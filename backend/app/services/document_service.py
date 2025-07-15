"""
Document processing service for extracting emission data from uploaded documents.
"""
import os
import tempfile
import aiofiles
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.settings import settings as docling_settings
from docling.document_converter import DocumentConverter, PdfFormatOption
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import EmissionCreate, EmissionCategory
from datetime import datetime
import json
import re

class DocumentProcessingService:
    def __init__(self):
        # Initialize Gemini AI
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
        
        # Initialize Docling converter with acceleration if available
        self.converter = self._setup_converter()
    
    def _setup_converter(self) -> DocumentConverter:
        """Setup DocumentConverter with CUDA acceleration (GPU only)."""
        # Configure CUDA acceleration
        accelerator_options = AcceleratorOptions(
            num_threads=8, 
            device=AcceleratorDevice.CUDA
        )
        
        # Configure PDF pipeline options
        pipeline_options = PdfPipelineOptions()
        pipeline_options.accelerator_options = accelerator_options
        pipeline_options.do_ocr = True
        pipeline_options.do_table_structure = True
        pipeline_options.table_structure_options.do_cell_matching = True
        
        # Enable profiling for performance monitoring
        docling_settings.debug.profile_pipeline_timings = True
        
        # Create converter with CUDA settings
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                )
            }
        )
        
        print("✅ DocumentConverter initialized with CUDA acceleration")
        return converter

    async def process_document_for_emissions(self, file: UploadFile) -> Dict[str, Any]:
        """
        Main processing pipeline:
        1. Validate and save uploaded file
        2. Convert to markdown using Docling
        3. Extract emission data using Gemini AI
        4. Return structured emission data
        """
        try:
            # Step 1: Validate file
            await self._validate_file(file)
            
            # Step 2: Save file temporarily
            temp_file_path = await self._save_temp_file(file)
            
            try:
                # Step 3: Convert to markdown
                markdown_content = await self._convert_to_markdown(temp_file_path)
                
                # Step 4: Extract emission data
                emission_data = await self._extract_emission_data(markdown_content)
                
                return {
                    "success": True,
                    "markdown": markdown_content[:1000] + "..." if len(markdown_content) > 1000 else markdown_content,
                    "extracted_data": emission_data,
                    "message": "Document processed successfully"
                }
                
            finally:
                # Clean up temp file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")
    
    async def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file type and size."""
        # Supported file types
        supported_types = {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
            "text/markdown": [".md"],
            "text/html": [".html", ".htm"],
            "text/csv": [".csv"],
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/tiff": [".tiff", ".tif"],
            "image/bmp": [".bmp"],
            "image/webp": [".webp"]
        }
        
        # Check file type
        file_extension = os.path.splitext(file.filename or "")[1].lower()
        is_supported = any(
            file_extension in extensions or file.content_type == content_type
            for content_type, extensions in supported_types.items()
        )
        
        if not is_supported:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Supported types: {', '.join(supported_types.keys())}"
            )
        
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if hasattr(file, 'size') and file.size and file.size > max_size:
            raise HTTPException(status_code=400, detail="File size too large. Maximum size is 10MB.")
    
    async def _save_temp_file(self, file: UploadFile) -> str:
        """Save uploaded file to temporary location."""
        # Create temp file with original extension
        file_extension = os.path.splitext(file.filename or "")[1]
        temp_fd, temp_path = tempfile.mkstemp(suffix=file_extension)
        
        try:
            # Write file content
            async with aiofiles.open(temp_path, 'wb') as temp_file:
                content = await file.read()
                await temp_file.write(content)
            
            # Reset file position for any further reads
            await file.seek(0)
            
            return temp_path
            
        finally:
            os.close(temp_fd)
    
    async def _convert_to_markdown(self, file_path: str) -> str:
        """Convert document to markdown using Docling."""
        try:
            # Convert document
            result = self.converter.convert(file_path)
            markdown_content = result.document.export_to_markdown()
            
            if not markdown_content.strip():
                raise ValueError("Document conversion resulted in empty content")
            
            return markdown_content
            
        except Exception as e:
            raise Exception(f"Document conversion failed: {str(e)}")
    
    async def _extract_emission_data(self, markdown_content: str) -> Dict[str, Any]:
        """Extract emission data from markdown using Gemini AI."""
        if not self.model:
            raise Exception("Gemini AI not configured. Please set GEMINI_API_KEY in environment variables.")
        
        # Create extraction prompt
        prompt = self._create_extraction_prompt(markdown_content)
        
        try:
            # Generate response
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise Exception("AI model returned empty response")
            
            # Parse JSON response
            extracted_data = self._parse_ai_response(response.text)
            
            return extracted_data
            
        except Exception as e:
            raise Exception(f"AI extraction failed: {str(e)}")
    
    def _create_extraction_prompt(self, markdown_content: str) -> str:
        """Create a detailed prompt for Gemini to extract emission data."""
        categories = [cat.value for cat in EmissionCategory]
        
        prompt = f"""
You are an expert in carbon emissions data extraction. Analyze the following document and extract ANY emission-related activities or data.

Document content:
{markdown_content}

Extract information for carbon emission activities and return it as a JSON array. Each activity should have:

1. activity_name: string (descriptive name of the activity)
2. category: string (one of: {', '.join(categories)})
3. description: string (detailed description)
4. amount: number (quantity/amount of activity)
5. unit: string (unit of measurement like "km", "kWh", "tons", "liters", etc.)
6. emission_factor: number (CO2 equivalent factor per unit, estimate if not provided)
7. date: string (ISO format date, use document date or current date if not specified)

Guidelines:
- Look for ANY activities that could generate emissions: travel, energy use, fuel consumption, manufacturing, waste, etc.
- If emission factors are not provided, use reasonable estimates based on common factors
- If amounts are ranges, use the average
- If dates are not specific, use reasonable estimates
- Include as many relevant activities as possible
- Ensure all numeric values are positive numbers

Return ONLY a JSON array, no additional text or explanation.

Example output:
[
  {{
    "activity_name": "Business travel by car",
    "category": "transportation",
    "description": "Employee travel from office to client meeting",
    "amount": 150,
    "unit": "km",
    "emission_factor": 0.12,
    "date": "2024-12-01T00:00:00Z"
  }}
]
"""
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate AI response."""
        try:
            # Clean response text
            response_text = response_text.strip()
            
            # Extract JSON from response (in case there's extra text)
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group()
            else:
                json_text = response_text
            
            # Parse JSON
            extracted_activities = json.loads(json_text)
            
            if not isinstance(extracted_activities, list):
                raise ValueError("Response should be a JSON array")
            
            # Validate and clean each activity
            validated_activities = []
            for activity in extracted_activities:
                validated_activity = self._validate_activity_data(activity)
                if validated_activity:
                    validated_activities.append(validated_activity)
            
            return {
                "activities": validated_activities,
                "count": len(validated_activities)
            }
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to parse AI response: {str(e)}")
    
    def _validate_activity_data(self, activity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate and clean individual activity data."""
        try:
            # Required fields
            required_fields = ["activity_name", "category", "description", "amount", "unit", "emission_factor", "date"]
            
            for field in required_fields:
                if field not in activity:
                    return None
            
            # Validate category
            if activity["category"] not in [cat.value for cat in EmissionCategory]:
                # Try to map to closest category
                activity["category"] = self._map_to_valid_category(activity["category"])
            
            # Validate numeric fields
            activity["amount"] = float(activity["amount"])
            activity["emission_factor"] = float(activity["emission_factor"])
            
            if activity["amount"] <= 0 or activity["emission_factor"] <= 0:
                return None
            
            # Validate date
            try:
                datetime.fromisoformat(activity["date"].replace('Z', '+00:00'))
            except:
                activity["date"] = datetime.now().isoformat() + "Z"
            
            return activity
            
        except Exception:
            return None
    
    def _map_to_valid_category(self, category: str) -> str:
        """Map invalid category to closest valid category."""
        category_mapping = {
            "transport": "transportation",
            "travel": "transportation",
            "vehicle": "transportation",
            "fuel": "transportation",
            "electricity": "energy",
            "power": "energy",
            "heating": "energy",
            "cooling": "energy",
            "production": "manufacturing",
            "factory": "manufacturing",
            "industrial": "manufacturing",
            "food": "agriculture",
            "farming": "agriculture",
            "livestock": "agriculture",
            "garbage": "waste",
            "disposal": "waste",
            "recycling": "waste"
        }
        
        category_lower = category.lower()
        for key, value in category_mapping.items():
            if key in category_lower:
                return value
        
        # Default to energy if no match
        return "energy"


def get_document_service() -> DocumentProcessingService:
    """Dependency to get document processing service."""
    return DocumentProcessingService()
