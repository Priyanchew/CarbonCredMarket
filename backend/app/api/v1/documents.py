"""
Document upload API endpoints for emission data extraction.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any
import uuid
from datetime import datetime

from ...core.security import get_current_user
from ...models.schemas import User
from ...services.document_service import DocumentProcessingService, get_document_service

router = APIRouter(prefix="/documents", tags=["documents"])

# Store processing status in memory (in production, use Redis or database)
processing_status = {}

@router.post("/upload-for-emissions")
async def upload_document_for_emissions(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    doc_service: DocumentProcessingService = Depends(get_document_service)
):
    """
    Upload a document to extract emission data.
    Returns a task ID for tracking processing status.
    """
    try:
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Initialize processing status
        processing_status[task_id] = {
            "status": "uploading",
            "message": "File uploaded, starting processing...",
            "progress": 10,
            "user_id": str(current_user.id),
            "filename": file.filename,
            "started_at": datetime.now().isoformat()
        }
        
        # Start background processing
        background_tasks.add_task(
            process_document_background,
            task_id,
            file,
            doc_service
        )
        
        return {
            "task_id": task_id,
            "message": "Document upload started. Use the task ID to check processing status.",
            "filename": file.filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/processing-status/{task_id}")
async def get_processing_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the processing status of a document upload task."""
    
    if task_id not in processing_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status = processing_status[task_id]
    
    # Verify user owns this task
    if status["user_id"] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return status


@router.post("/quick-extract")
async def quick_extract_emissions(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    doc_service: DocumentProcessingService = Depends(get_document_service)
):
    """
    Quick synchronous extraction for smaller files.
    Returns extracted emission data immediately.
    """
    try:
        # Validate file size for quick processing (max 2MB)
        if hasattr(file, 'size') and file.size and file.size > 2 * 1024 * 1024:
            raise HTTPException(
                status_code=400, 
                detail="File too large for quick extraction. Use async upload instead."
            )
        
        # Process document
        result = await doc_service.process_document_for_emissions(file)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick extraction failed: {str(e)}")


async def process_document_background(
    task_id: str,
    file: UploadFile,
    doc_service: DocumentProcessingService
):
    """Background task for processing documents."""
    try:
        # Update status: Converting
        processing_status[task_id].update({
            "status": "converting",
            "message": "Converting document to markdown...",
            "progress": 30
        })
        
        # Reset file position
        await file.seek(0)
        
        # Process document
        result = await doc_service.process_document_for_emissions(file)
        
        # Update status: Success
        processing_status[task_id].update({
            "status": "completed",
            "message": "Document processed successfully",
            "progress": 100,
            "result": result,
            "completed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        # Update status: Error
        processing_status[task_id].update({
            "status": "error",
            "message": f"Processing failed: {str(e)}",
            "progress": 0,
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })


@router.delete("/clear-completed")
async def clear_completed_tasks(
    current_user: User = Depends(get_current_user)
):
    """Clear completed processing tasks for the current user."""
    user_id = str(current_user.id)
    
    # Find and remove completed tasks for this user
    tasks_to_remove = [
        task_id for task_id, status in processing_status.items()
        if status["user_id"] == user_id and status["status"] in ["completed", "error"]
    ]
    
    for task_id in tasks_to_remove:
        del processing_status[task_id]
    
    return {
        "message": f"Cleared {len(tasks_to_remove)} completed tasks"
    }


@router.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported document formats."""
    return {
        "formats": [
            {
                "type": "PDF",
                "extensions": [".pdf"],
                "mime_types": ["application/pdf"],
                "description": "Portable Document Format"
            },
            {
                "type": "Microsoft Office",
                "extensions": [".docx", ".xlsx", ".pptx"],
                "mime_types": [
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                ],
                "description": "Word, Excel, PowerPoint documents"
            },
            {
                "type": "Text & Web",
                "extensions": [".md", ".html", ".htm", ".csv"],
                "mime_types": ["text/markdown", "text/html", "text/csv"],
                "description": "Markdown, HTML, CSV files"
            },
            {
                "type": "Images",
                "extensions": [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"],
                "mime_types": ["image/png", "image/jpeg", "image/tiff", "image/bmp", "image/webp"],
                "description": "Image files with text"
            }
        ],
        "max_file_size": "10MB for async, 2MB for quick extraction",
        "note": "All formats support text extraction and emission data recognition"
    }
