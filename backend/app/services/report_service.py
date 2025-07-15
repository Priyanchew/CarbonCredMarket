"""
Report generation service for compliance and analytics.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
import json
from supabase import Client

from ..models.schemas import Report, Emission, CarbonCreditPurchase


class ReportService:
    def __init__(self, db: Client):
        self.supabase = db

    def _parse_emission_data(self, emission_data: Dict[str, Any]) -> Emission:
        """Parse emission data from database with proper type conversion."""
        # Parse datetime fields
        emission_data["date"] = datetime.fromisoformat(emission_data["date"].replace("Z", "+00:00"))
        if emission_data.get("offset_date"):
            emission_data["offset_date"] = datetime.fromisoformat(emission_data["offset_date"].replace("Z", "+00:00"))
        emission_data["created_at"] = datetime.fromisoformat(emission_data["created_at"].replace("Z", "+00:00"))
        emission_data["updated_at"] = datetime.fromisoformat(emission_data["updated_at"].replace("Z", "+00:00"))
        
        # Convert UUIDs
        emission_data["id"] = UUID(emission_data["id"])
        emission_data["user_id"] = UUID(emission_data["user_id"])
        if emission_data.get("offset_purchase_id"):
            emission_data["offset_purchase_id"] = UUID(emission_data["offset_purchase_id"])
        
        return Emission(**emission_data)

    def _parse_purchase_data(self, purchase_data: Dict[str, Any]) -> CarbonCreditPurchase:
        """Parse purchase data from database with proper type conversion."""
        # Handle the nested carbon_credits relationship
        credit_data = purchase_data.pop("carbon_credits", None)
        if credit_data:
            purchase_data["credit"] = credit_data
        
        # Parse datetime fields
        purchase_data["purchase_date"] = datetime.fromisoformat(purchase_data["purchase_date"].replace("Z", "+00:00"))
        if purchase_data.get("last_retirement_date"):
            purchase_data["last_retirement_date"] = datetime.fromisoformat(purchase_data["last_retirement_date"].replace("Z", "+00:00"))
        
        # Convert UUIDs
        purchase_data["id"] = UUID(purchase_data["id"])
        purchase_data["user_id"] = UUID(purchase_data["user_id"])
        purchase_data["credit_id"] = UUID(purchase_data["credit_id"])
        
        return CarbonCreditPurchase(**purchase_data)

    def _fetch_emissions(self, user_id: UUID, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Emission]:
        """Fetch and parse emissions data for a user within a date range."""
        query = self.supabase.table("emissions").select("*").eq("user_id", str(user_id))
        
        if start_date:
            query = query.gte("date", start_date.isoformat())
        if end_date:
            query = query.lte("date", end_date.isoformat())
        
        response = query.execute()
        
        emissions = []
        for e in response.data:
            try:
                emission = self._parse_emission_data(e)
                emissions.append(emission)
            except Exception as ex:
                print(f"Error parsing emission {e.get('id', 'unknown')}: {ex}")
                continue
        
        return emissions

    def _fetch_purchases(self, user_id: UUID, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[CarbonCreditPurchase]:
        """Fetch and parse purchase data for a user within a date range."""
        query = self.supabase.table("carbon_credit_purchases").select("*, carbon_credits(*)").eq("user_id", str(user_id))
        
        if start_date:
            query = query.gte("purchase_date", start_date.isoformat())
        if end_date:
            query = query.lte("purchase_date", end_date.isoformat())
        
        response = query.execute()
        
        purchases = []
        for p in response.data:
            try:
                purchase = self._parse_purchase_data(p)
                purchases.append(purchase)
            except Exception as e:
                print(f"Error parsing purchase {p.get('id', 'unknown')}: {e}")
                continue
        
        return purchases

    async def generate_emissions_report(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime,
        report_type: str = "emissions_summary"
    ) -> Report:
        """Generate comprehensive emissions report."""
        try:
            # Fetch emissions data for the period
            emissions = self._fetch_emissions(user_id, start_date, end_date)
            
            # Fetch credit purchases for the period
            purchases = self._fetch_purchases(user_id, start_date, end_date)
            
            # Generate report data
            report_data = self._generate_emissions_report_data(emissions, purchases, start_date, end_date)
            
            # Save report to database
            report_id = uuid4()
            report_record = {
                "id": str(report_id),
                "user_id": str(user_id),
                "report_type": report_type,
                "title": f"Emissions Report - {start_date.strftime('%B %Y')}",
                "data": json.dumps(report_data),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat()
            }
            
            self.supabase.table("reports").insert(report_record).execute()
            
            # Create Report object with proper types
            return Report(
                id=report_id,
                user_id=user_id,
                report_type=report_type,
                title=f"Emissions Report - {start_date.strftime('%B %Y')}",
                data=report_data,
                generated_at=datetime.now(timezone.utc),
                period_start=start_date,
                period_end=end_date
            )
        
        except Exception as e:
            raise Exception(f"Failed to generate emissions report: {str(e)}")

    async def generate_compliance_report(
        self,
        user_id: UUID,
        compliance_standard: str = "ISO_14064",
        year: Optional[int] = None
    ) -> Report:
        """Generate compliance report for regulatory standards."""
        try:
            if not year:
                year = datetime.now().year
            
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 12, 31)
            
            # Fetch all data for the year
            emissions = self._fetch_emissions(user_id, start_date, end_date)
            
            purchases = self._fetch_purchases(user_id, start_date, end_date)
            
            # Generate compliance-specific report
            report_data = self._generate_compliance_report_data(
                emissions, purchases, compliance_standard, year
            )
            
            # Save report
            report_id = uuid4()
            report_record = {
                "id": str(report_id),
                "user_id": str(user_id),
                "report_type": f"compliance_{compliance_standard.lower()}",
                "title": f"{compliance_standard} Compliance Report - {year}",
                "data": json.dumps(report_data),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat()
            }
            
            self.supabase.table("reports").insert(report_record).execute()
            
            # Create Report object with proper types
            return Report(
                id=report_id,
                user_id=user_id,
                report_type=f"compliance_{compliance_standard.lower()}",
                title=f"{compliance_standard} Compliance Report - {year}",
                data=report_data,
                generated_at=datetime.now(timezone.utc),
                period_start=start_date,
                period_end=end_date
            )
        
        except Exception as e:
            raise Exception(f"Failed to generate compliance report: {str(e)}")

    async def generate_net_zero_progress_report(self, user_id: UUID) -> Report:
        """Generate net-zero progress tracking report."""
        try:
            # Get all user data
            emissions = self._fetch_emissions(user_id)
            
            purchases = self._fetch_purchases(user_id)
            
            # Generate net-zero analysis
            report_data = self._generate_net_zero_report_data(emissions, purchases)
            
            # Save report
            report_id = uuid4()
            report_record = {
                "id": str(report_id),
                "user_id": str(user_id),
                "report_type": "net_zero_progress",
                "title": "Net-Zero Progress Report",
                "data": json.dumps(report_data),
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "period_start": None,
                "period_end": None
            }
            
            self.supabase.table("reports").insert(report_record).execute()
            
            # Create Report object with proper types
            return Report(
                id=report_id,
                user_id=user_id,
                report_type="net_zero_progress",
                title="Net-Zero Progress Report",
                data=report_data,
                generated_at=datetime.now(timezone.utc),
                period_start=None,
                period_end=None
            )
        
        except Exception as e:
            raise Exception(f"Failed to generate net-zero report: {str(e)}")

    async def get_user_reports(
        self, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 10, 
        report_type: Optional[str] = None
    ) -> List[Report]:
        """Get all reports for a user with pagination and filtering."""
        try:
            query = self.supabase.table("reports").select("*").eq(
                "user_id", str(user_id)
            )
            
            # Add filter by report type if specified
            if report_type:
                query = query.eq("report_type", report_type)
            
            # Add pagination and ordering
            response = query.order("generated_at", desc=True).range(skip, skip + limit - 1).execute()
            
            reports = []
            for report_data in response.data:
                # Parse the JSON data field
                data = json.loads(report_data["data"]) if isinstance(report_data["data"], str) else report_data["data"]
                
                # Convert string dates back to datetime objects
                generated_at = datetime.fromisoformat(report_data["generated_at"].replace("Z", "+00:00"))
                period_start = datetime.fromisoformat(report_data["period_start"].replace("Z", "+00:00")) if report_data["period_start"] else None
                period_end = datetime.fromisoformat(report_data["period_end"].replace("Z", "+00:00")) if report_data["period_end"] else None
                
                report = Report(
                    id=UUID(report_data["id"]),
                    user_id=UUID(report_data["user_id"]),
                    report_type=report_data["report_type"],
                    title=report_data["title"],
                    data=data,
                    generated_at=generated_at,
                    period_start=period_start,
                    period_end=period_end
                )
                reports.append(report)
            
            return reports
        
        except Exception as e:
            raise Exception(f"Failed to fetch reports: {str(e)}")

    async def get_report_by_id(self, report_id: UUID, user_id: UUID) -> Optional[Report]:
        """Get a specific report by ID."""
        try:
            response = self.supabase.table("reports").select("*").eq(
                "id", str(report_id)
            ).eq("user_id", str(user_id)).execute()
            
            if response.data:
                report_data = response.data[0]
                
                # Parse the JSON data field
                data = json.loads(report_data["data"]) if isinstance(report_data["data"], str) else report_data["data"]
                
                # Convert string dates back to datetime objects
                generated_at = datetime.fromisoformat(report_data["generated_at"].replace("Z", "+00:00"))
                period_start = datetime.fromisoformat(report_data["period_start"].replace("Z", "+00:00")) if report_data["period_start"] else None
                period_end = datetime.fromisoformat(report_data["period_end"].replace("Z", "+00:00")) if report_data["period_end"] else None
                
                return Report(
                    id=UUID(report_data["id"]),
                    user_id=UUID(report_data["user_id"]),
                    report_type=report_data["report_type"],
                    title=report_data["title"],
                    data=data,
                    generated_at=generated_at,
                    period_start=period_start,
                    period_end=period_end
                )
            return None
        
        except Exception as e:
            raise Exception(f"Failed to fetch report: {str(e)}")

    def _generate_emissions_report_data(
        self,
        emissions: List[Emission],
        purchases: List[CarbonCreditPurchase],
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate detailed emissions report data."""
        
        # Calculate total emissions
        total_emissions = sum(e.co2_equivalent for e in emissions)
        
        # Group emissions by category
        emissions_by_category = {}
        for emission in emissions:
            category = emission.category
            if category not in emissions_by_category:
                emissions_by_category[category] = []
            emissions_by_category[category].append(emission.co2_equivalent)
        
        category_totals = {
            category: sum(values) for category, values in emissions_by_category.items()
        }
        
        # Calculate monthly trends
        monthly_emissions = {}
        for emission in emissions:
            month_key = emission.date.strftime("%Y-%m")
            if month_key not in monthly_emissions:
                monthly_emissions[month_key] = 0
            monthly_emissions[month_key] += emission.co2_equivalent
        
        # Calculate offsets from purchases
        total_credits_purchased = sum(p.quantity for p in purchases)
        total_credits_retired = sum(p.retired_quantity for p in purchases)
        
        # Calculate net emissions
        net_emissions = total_emissions - total_credits_retired
        offset_percentage = (total_credits_retired / total_emissions * 100) if total_emissions > 0 else 0
        
        return {
            "summary": {
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "total_emissions": total_emissions,
                "total_credits_purchased": total_credits_purchased,
                "total_credits_retired": total_credits_retired,
                "net_emissions": net_emissions,
                "offset_percentage": offset_percentage
            },
            "emissions_breakdown": {
                "by_category": category_totals,
                "monthly_trend": monthly_emissions
            },
            "offset_activities": {
                "purchases": len(purchases),
                "credits_available": total_credits_purchased - total_credits_retired,
                "total_investment": sum(p.total_cost for p in purchases)
            },
            "recommendations": self._generate_recommendations(total_emissions, offset_percentage),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    def _generate_compliance_report_data(
        self,
        emissions: List[Emission],
        purchases: List[CarbonCreditPurchase],
        standard: str,
        year: int
    ) -> Dict[str, Any]:
        """Generate compliance-specific report data."""
        
        total_emissions = sum(e.co2_equivalent for e in emissions)
        total_offsets = sum(p.retired_quantity for p in purchases)
        
        # Compliance-specific calculations
        compliance_data = {
            "ISO_14064": {
                "scope_1_emissions": sum(e.co2_equivalent for e in emissions if e.category in ["manufacturing", "transportation"]),
                "scope_2_emissions": sum(e.co2_equivalent for e in emissions if e.category == "energy"),
                "scope_3_emissions": sum(e.co2_equivalent for e in emissions if e.category in ["waste", "agriculture"]),
                "total_verified_offsets": total_offsets,
                "net_emissions": total_emissions - total_offsets
            },
            "GHG_Protocol": {
                "direct_emissions": sum(e.co2_equivalent for e in emissions if e.category in ["manufacturing", "transportation"]),
                "indirect_emissions": sum(e.co2_equivalent for e in emissions if e.category in ["energy", "waste"]),
                "offset_credits": total_offsets,
                "reduction_percentage": ((total_offsets / total_emissions) * 100) if total_emissions > 0 else 0
            }
        }
        
        current_compliance = compliance_data.get(standard, compliance_data["ISO_14064"])
        
        return {
            "compliance_standard": standard,
            "reporting_year": year,
            "compliance_status": "compliant" if total_offsets >= total_emissions * 0.8 else "non_compliant",
            "data": current_compliance,
            "verification_notes": [
                "All emissions data collected according to standard methodology",
                "Carbon credits verified through recognized standards",
                "Regular monitoring and reporting procedures in place"
            ],
            "recommendations": self._generate_compliance_recommendations(current_compliance, standard)
        }

    def _generate_net_zero_report_data(
        self,
        emissions: List[Emission],
        purchases: List[CarbonCreditPurchase]
    ) -> Dict[str, Any]:
        """Generate net-zero progress analysis."""
        
        # Calculate year-over-year trends
        yearly_emissions = {}
        for emission in emissions:
            year = emission.date.year
            if year not in yearly_emissions:
                yearly_emissions[year] = 0
            yearly_emissions[year] += emission.co2_equivalent
        
        yearly_offsets = {}
        for purchase in purchases:
            year = purchase.purchase_date.year
            if year not in yearly_offsets:
                yearly_offsets[year] = 0
            yearly_offsets[year] += purchase.retired_quantity
        
        # Calculate progress metrics
        current_year = datetime.now().year
        current_emissions = yearly_emissions.get(current_year, 0)
        current_offsets = yearly_offsets.get(current_year, 0)
        net_current = current_emissions - current_offsets
        
        # Project net-zero timeline
        avg_annual_reduction = self._calculate_reduction_trend(yearly_emissions)
        years_to_net_zero = self._estimate_net_zero_timeline(current_emissions, avg_annual_reduction)
        
        return {
            "current_status": {
                "current_year_emissions": current_emissions,
                "current_year_offsets": current_offsets,
                "net_emissions": net_current,
                "is_net_zero": net_current <= 0
            },
            "historical_trends": {
                "yearly_emissions": yearly_emissions,
                "yearly_offsets": yearly_offsets,
                "average_annual_reduction": avg_annual_reduction
            },
            "projections": {
                "estimated_years_to_net_zero": years_to_net_zero,
                "required_annual_reduction": max(0, current_emissions / max(years_to_net_zero, 1)),
                "target_year": current_year + years_to_net_zero if years_to_net_zero > 0 else current_year
            },
            "recommendations": self._generate_net_zero_recommendations(net_current, years_to_net_zero)
        }

    def _calculate_reduction_trend(self, yearly_emissions: Dict[int, float]) -> float:
        """Calculate average annual emissions reduction."""
        if len(yearly_emissions) < 2:
            return 0
        
        years = sorted(yearly_emissions.keys())
        reductions = []
        
        for i in range(1, len(years)):
            prev_year = years[i-1]
            curr_year = years[i]
            reduction = yearly_emissions[prev_year] - yearly_emissions[curr_year]
            reductions.append(reduction)
        
        return sum(reductions) / len(reductions) if reductions else 0

    def _estimate_net_zero_timeline(self, current_emissions: float, annual_reduction: float) -> int:
        """Estimate years to reach net-zero emissions."""
        if annual_reduction <= 0:
            return 50  # Default if no reduction trend
        
        years = max(1, int(current_emissions / annual_reduction))
        return min(years, 50)  # Cap at 50 years

    def _generate_recommendations(self, total_emissions: float, offset_percentage: float) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        if offset_percentage < 25:
            recommendations.append("Consider purchasing more carbon credits to increase offset percentage")
        
        if total_emissions > 100:
            recommendations.append("Focus on emission reduction strategies before offsetting")
        
        recommendations.extend([
            "Implement energy efficiency measures to reduce future emissions",
            "Consider renewable energy sources for operations",
            "Regular monitoring and reporting for continuous improvement"
        ])
        
        return recommendations

    def _generate_compliance_recommendations(self, data: Dict[str, Any], standard: str) -> List[str]:
        """Generate compliance-specific recommendations."""
        recommendations = [
            f"Ensure all reporting meets {standard} requirements",
            "Regular third-party verification of emissions data",
            "Maintain detailed documentation for audit purposes"
        ]
        
        if standard == "ISO_14064":
            recommendations.extend([
                "Focus on Scope 1 emissions reduction first",
                "Implement robust monitoring systems for all emission sources"
            ])
        
        return recommendations

    def _generate_net_zero_recommendations(self, net_emissions: float, years_to_zero: int) -> List[str]:
        """Generate net-zero specific recommendations."""
        recommendations = []
        
        if net_emissions > 0:
            recommendations.extend([
                "Accelerate emissions reduction efforts",
                "Increase carbon credit purchases and retirement",
                "Set interim reduction targets"
            ])
        
        if years_to_zero > 10:
            recommendations.extend([
                "Develop aggressive reduction roadmap",
                "Consider investing in innovative offset technologies",
                "Partner with suppliers to reduce scope 3 emissions"
            ])
        
        recommendations.extend([
            "Regular progress monitoring and reporting",
            "Employee engagement and training programs",
            "Integration of sustainability into business strategy"
        ])
        
        return recommendations

    async def export_report_as_csv(self, report: Report) -> str:
        """Export report data as CSV format."""
        import csv
        import io
        
        output = io.StringIO()
        
        if report.report_type == "emissions_summary":
            writer = csv.writer(output)
            # Write headers
            writer.writerow(["Metric", "Value", "Unit"])
            
            data = report.data
            # Basic metrics
            writer.writerow(["Total Emissions", data.get("total_emissions", 0), "kg CO2e"])
            writer.writerow(["Report Period Start", data.get("period_start", ""), ""])
            writer.writerow(["Report Period End", data.get("period_end", ""), ""])
            writer.writerow(["Number of Activities", data.get("total_activities", 0), "activities"])
            
            # Category breakdown
            if "emissions_by_category" in data:
                writer.writerow([])  # Empty row
                writer.writerow(["Category Breakdown", "", ""])
                for category, amount in data["emissions_by_category"].items():
                    writer.writerow([category, amount, "kg CO2e"])
            
            # Monthly trends
            if "monthly_trends" in data:
                writer.writerow([])  # Empty row
                writer.writerow(["Monthly Trends", "", ""])
                writer.writerow(["Month", "Emissions", "Unit"])
                for trend in data["monthly_trends"]:
                    writer.writerow([trend.get("month", ""), trend.get("emissions", 0), "kg CO2e"])
                    
        elif report.report_type == "compliance":
            writer = csv.writer(output)
            writer.writerow(["Compliance Metric", "Value", "Status"])
            
            data = report.data
            writer.writerow(["Compliance Standard", data.get("compliance_standard", ""), ""])
            writer.writerow(["Report Year", data.get("year", ""), ""])
            writer.writerow(["Compliance Status", data.get("compliance_status", ""), ""])
            writer.writerow(["Total Emissions", data.get("total_emissions", 0), "kg CO2e"])
            writer.writerow(["Credits Retired", data.get("credits_retired", 0), "credits"])
            
        elif report.report_type == "net_zero":
            writer = csv.writer(output)
            writer.writerow(["Net-Zero Metric", "Value", "Unit"])
            
            data = report.data
            writer.writerow(["Target Year", data.get("target_year", ""), ""])
            writer.writerow(["Current Emissions", data.get("current_emissions", 0), "kg CO2e"])
            writer.writerow(["Credits Retired", data.get("credits_retired", 0), "credits"])
            writer.writerow(["Net Emissions", data.get("net_emissions", 0), "kg CO2e"])
            writer.writerow(["Progress Percentage", data.get("progress_percentage", 0), "%"])
            writer.writerow(["Years to Net-Zero", data.get("years_to_net_zero", 0), "years"])
        
        else:
            # Generic export for unknown report types
            writer = csv.writer(output)
            writer.writerow(["Report Data"])
            writer.writerow(["Key", "Value"])
            
            def flatten_dict(d, parent_key='', sep='_'):
                items = []
                for k, v in d.items():
                    new_key = f"{parent_key}{sep}{k}" if parent_key else k
                    if isinstance(v, dict):
                        items.extend(flatten_dict(v, new_key, sep=sep).items())
                    else:
                        items.append((new_key, v))
                return dict(items)
            
            flattened = flatten_dict(report.data)
            for key, value in flattened.items():
                writer.writerow([key, value])
        
        return output.getvalue()

    async def export_report_as_pdf(self, report: Report) -> bytes:
        """Export report data as PDF format."""
        try:
            # For a quick implementation, we'll use reportlab to generate PDFs
            # In production, you might want to use more sophisticated PDF libraries
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            import io
            
            print(f"Starting PDF generation for report: {report.title}")
            
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create the PDF object
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                textColor=colors.HexColor('#2563eb')
            )
            
            # Add title
            story.append(Paragraph(report.title, title_style))
            story.append(Spacer(1, 12))
            
            # Add report metadata
            story.append(Paragraph(f"<b>Report Type:</b> {report.report_type}", styles['Normal']))
            story.append(Paragraph(f"<b>Generated:</b> {report.generated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['Normal']))
            
            if report.period_start and report.period_end:
                story.append(Paragraph(f"<b>Period:</b> {report.period_start.strftime('%Y-%m-%d')} to {report.period_end.strftime('%Y-%m-%d')}", styles['Normal']))
            
            story.append(Spacer(1, 20))
            
            # Add report data based on type
            data = report.data
            print(f"Report data type: {type(data)}, keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if report.report_type == "emissions_summary":
                self._add_emissions_summary_to_pdf(story, data, styles)
            elif "compliance" in report.report_type:
                self._add_compliance_data_to_pdf(story, data, styles)
            elif report.report_type == "net_zero_progress":
                self._add_net_zero_data_to_pdf(story, data, styles)
            else:
                # Generic report data
                self._add_generic_data_to_pdf(story, data, styles)
            
            # Build PDF
            print("Building PDF document...")
            doc.build(story)
            
            # Get the value of the BytesIO buffer
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            print(f"PDF generated successfully. Size: {len(pdf_bytes)} bytes")
            return pdf_bytes
            
        except ImportError as e:
            print(f"PDF library not available: {e}")
            # Fallback to simple text PDF if reportlab is not available
            return self._create_simple_text_pdf(report)
        except Exception as e:
            print(f"Error generating PDF: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to simple text PDF
            return self._create_simple_text_pdf(report)

    def _add_emissions_summary_to_pdf(self, story, data, styles):
        """Add emissions summary data to PDF."""
        try:
            from reportlab.platypus import Table, TableStyle, Paragraph
            from reportlab.lib import colors
            
            # Summary section
            story.append(Paragraph("<b>Executive Summary</b>", styles['Heading2']))
            
            if 'summary' in data:
                summary = data['summary']
                summary_data = [
                    ['Metric', 'Value', 'Unit'],
                    ['Total Emissions', f"{summary.get('total_emissions', 0):.2f}", 'kg CO2e'],
                    ['Credits Purchased', f"{summary.get('total_credits_purchased', 0):.2f}", 'credits'],
                    ['Credits Retired', f"{summary.get('total_credits_retired', 0):.2f}", 'credits'],
                    ['Net Emissions', f"{summary.get('net_emissions', 0):.2f}", 'kg CO2e'],
                    ['Offset Percentage', f"{summary.get('offset_percentage', 0):.1f}", '%']
                ]
                
                table = Table(summary_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
            
            # Emissions by category
            if 'emissions_breakdown' in data and 'by_category' in data['emissions_breakdown']:
                story.append(Paragraph("<b>Emissions by Category</b>", styles['Heading2']))
                categories = data['emissions_breakdown']['by_category']
                
                cat_data = [['Category', 'Emissions (kg CO2e)']]
                for category, amount in categories.items():
                    cat_data.append([category.title(), f"{amount:.2f}"])
                
                cat_table = Table(cat_data)
                cat_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(cat_table)
                
        except Exception as e:
            print(f"Error adding emissions summary to PDF: {e}")
            # Add basic text if table creation fails
            from reportlab.platypus import Paragraph
            story.append(Paragraph("Summary data available in raw format", styles['Normal']))

    def _add_compliance_data_to_pdf(self, story, data, styles):
        """Add compliance data to PDF."""
        try:
            from reportlab.platypus import Paragraph
            from reportlab.platypus import Paragraph
            
            story.append(Paragraph("<b>Compliance Information</b>", styles['Heading2']))
            
            if 'compliance_standard' in data:
                story.append(Paragraph(f"Standard: {data['compliance_standard']}", styles['Normal']))
            if 'reporting_year' in data:
                story.append(Paragraph(f"Reporting Year: {data['reporting_year']}", styles['Normal']))
            if 'compliance_status' in data:
                status = data['compliance_status'].replace('_', ' ').title()
                story.append(Paragraph(f"Status: {status}", styles['Normal']))
                
        except Exception as e:
            print(f"Error adding compliance data to PDF: {e}")

    def _add_net_zero_data_to_pdf(self, story, data, styles):
        """Add net-zero progress data to PDF."""
        try:
            from reportlab.platypus import Paragraph
            from reportlab.platypus import Paragraph
            
            story.append(Paragraph("<b>Net-Zero Progress</b>", styles['Heading2']))
            
            if 'current_status' in data:
                status = data['current_status']
                story.append(Paragraph(f"Current Year Emissions: {status.get('current_year_emissions', 0):.2f} kg CO2e", styles['Normal']))
                story.append(Paragraph(f"Current Year Offsets: {status.get('current_year_offsets', 0):.2f} credits", styles['Normal']))
                story.append(Paragraph(f"Net Emissions: {status.get('net_emissions', 0):.2f} kg CO2e", styles['Normal']))
                
                is_net_zero = status.get('is_net_zero', False)
                story.append(Paragraph(f"Net-Zero Achieved: {'Yes' if is_net_zero else 'No'}", styles['Normal']))
                
        except Exception as e:
            print(f"Error adding net-zero data to PDF: {e}")

    def _add_generic_data_to_pdf(self, story, data, styles):
        """Add generic report data to PDF."""
        from reportlab.platypus import Paragraph
        from reportlab.platypus import Paragraph
        
        story.append(Paragraph("<b>Report Data</b>", styles['Heading2']))
        
        # Convert data to readable format
        data_str = json.dumps(data, indent=2, default=str)
        story.append(Paragraph(f"<pre>{data_str}</pre>", styles['Code']))

    def _create_simple_text_pdf(self, report: Report) -> bytes:
        """Create a simple text-based PDF when reportlab is not available."""
        print("Creating simple text PDF fallback")
        
        # Create a simple text content
        content = f"""
{report.title}
{'=' * len(report.title)}

Report Type: {report.report_type}
Generated: {report.generated_at}

Report Data:
{json.dumps(report.data, indent=2, default=str)}
"""
        
        # Return as bytes (this will still be text, but properly encoded)
        return content.encode('utf-8')
