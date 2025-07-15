"""
Reports API endpoints for generating and managing reports.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta, timezone
import io
import json

from ...core.security import get_current_user
from ...core.dependencies import get_report_service
from ...models.schemas import User, Report
from ...services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/emissions", response_model=Report)
async def generate_emissions_report(
    start_date: datetime,
    end_date: datetime,
    report_type: str = "emissions_summary",
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Generate a comprehensive emissions report for a specific period."""
    try:
        if start_date >= end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before end date"
            )
        
        if (end_date - start_date).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Report period cannot exceed 365 days"
            )
        
        return await report_service.generate_emissions_report(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date,
            report_type=report_type
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compliance", response_model=Report)
async def generate_compliance_report(
    compliance_standard: str = "ISO_14064",
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Generate a compliance report for regulatory purposes."""
    try:
        current_year = datetime.now(timezone.utc).year
        if year and (year < 2020 or year > current_year):
            raise HTTPException(
                status_code=400,
                detail=f"Year must be between 2020 and {current_year}"
            )
        
        return await report_service.generate_compliance_report(
            user_id=current_user.id,
            compliance_standard=compliance_standard,
            year=year or current_year
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/net-zero", response_model=Report)
async def generate_net_zero_report(
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Generate a comprehensive net-zero progress report."""
    try:        return await report_service.generate_net_zero_progress_report(
            user_id=current_user.id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Report])
async def get_user_reports(
    skip: int = Query(0, ge=0, description="Number of reports to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of reports to return"),
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Get all reports for the current user with optional filtering."""
    try:
        return await report_service.get_user_reports(
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            report_type=report_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}", response_model=Report)
async def get_report_details(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Get detailed information about a specific report."""
    try:
        report = await report_service.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}/download")
async def download_report(
    report_id: UUID,
    format: str = Query("pdf", description="Download format: pdf, csv, json"),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Download a report in the specified format."""
    try:
        print(f"Download request - Report ID: {report_id}, Format: {format}, User: {current_user.id}")
        
        # Verify report exists and belongs to user
        report = await report_service.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id
        )
        
        if not report:
            print(f"Report not found - ID: {report_id}, User: {current_user.id}")
            raise HTTPException(status_code=404, detail="Report not found")
        
        print(f"Report found - Title: {report.title}, Type: {report.report_type}")
        print(f"Report data keys: {list(report.data.keys()) if isinstance(report.data, dict) else 'Not a dict'}")
        
        # Generate download content based on format
        if format.lower() == "json":
            print("Generating JSON format")
            content = json.dumps(report.data, indent=2, default=str)
            media_type = "application/json"
            filename = f"{report.title.replace(' ', '_')}.json"
        elif format.lower() == "csv":
            print("Generating CSV format")
            # For CSV, extract relevant data and format as CSV
            csv_content = await report_service.export_report_as_csv(report)
            print(f"CSV content length: {len(csv_content)}")
            content = csv_content
            media_type = "text/csv"
            filename = f"{report.title.replace(' ', '_')}.csv"
        else:  # Default to PDF
            print("Generating PDF format")
            # Generate proper PDF content
            pdf_content = await report_service.export_report_as_pdf(report)
            print(f"PDF content length: {len(pdf_content)} bytes")
            
            return StreamingResponse(
                io.BytesIO(pdf_content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={report.title.replace(' ', '_')}.pdf"}
            )
        
        print(f"Content length: {len(content)}")
        
        # Create BytesIO object for non-PDF formats
        content_bytes = content.encode('utf-8')
        print(f"Content bytes length: {len(content_bytes)}")
        
        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{report_id}/share")
async def share_report(
    report_id: UUID,
    share_with: List[str] = [],
    message: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Share a report with specified users or generate a shareable link."""
    try:
        # Verify report exists and belongs to user
        report = await report_service.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Generate a shareable link (placeholder implementation)
        share_link = f"https://your-domain.com/shared-reports/{report_id}"
        
        # In a real implementation, you would:
        # 1. Store share permissions in database
        # 2. Send emails to shared users
        # 3. Generate secure access tokens
        
        # For now, return success with share link
        return {
            "message": "Report shared successfully",
            "share_link": share_link,
            "shared_with": share_with,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/available")
async def get_available_report_templates(
    current_user: User = Depends(get_current_user),
):
    """Get available report templates and their descriptions."""
    templates = {
        "emissions_summary": {
            "name": "Emissions Summary",
            "description": "Comprehensive overview of emission activities",
            "fields": ["total_emissions", "by_category", "trends", "top_activities"],
            "format": "Standard summary with charts and tables"
        },
        "compliance": {
            "name": "Compliance Report", 
            "description": "Regulatory compliance documentation",
            "fields": ["compliance_status", "regulatory_framework", "audit_trail"],
            "format": "Formal compliance document"
        },
        "net_zero": {
            "name": "Net-Zero Progress",
            "description": "Progress toward net-zero commitments",
            "fields": ["current_emissions", "offset_credits", "progress_percentage", "projections"],
            "format": "Progress tracking with goals and timelines"
        },
        "carbon_footprint": {
            "name": "Carbon Footprint",
            "description": "Detailed carbon footprint analysis",
            "fields": ["scope_1", "scope_2", "scope_3", "total_footprint"],
            "format": "Comprehensive footprint breakdown"
        }
    }
    
    return {"templates": templates}


@router.get("/analytics/summary")
async def get_reporting_analytics(
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Get analytics summary about user's reporting activity."""
    try:
        reports = await report_service.get_user_reports(current_user.id)
        
        # Calculate analytics
        total_reports = len(reports)
        report_types = {}
        recent_reports = 0
        
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        for report in reports:
            # Count by type
            if report.report_type not in report_types:
                report_types[report.report_type] = 0
            report_types[report.report_type] += 1
            
            # Count recent reports
            if report.generated_at >= thirty_days_ago:
                recent_reports += 1
        
        most_common_type = max(report_types.keys(), key=lambda k: report_types[k]) if report_types else None
        
        return {
            "total_reports_generated": total_reports,
            "reports_last_30_days": recent_reports,
            "most_common_report_type": most_common_type,
            "report_type_breakdown": report_types,
            "average_reports_per_month": total_reports / max(1, (datetime.now(timezone.utc) - reports[-1].generated_at).days / 30) if reports else 0,
            "compliance_status": "up_to_date" if recent_reports > 0 else "needs_attention"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}")
async def delete_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    """Delete a specific report."""
    try:
        # Verify report exists and belongs to user
        report = await report_service.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Delete from database
        supabase = report_service.supabase
        supabase.table("reports").delete().eq("id", str(report_id)).eq(
            "user_id", str(current_user.id)
        ).execute()
        
        return {"message": "Report deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
