"""
Dashboard API endpoints for overview and analytics.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone

from ...core.security import get_current_user
from ...core.dependencies import get_emission_service, get_marketplace_service, get_ai_service
from ...models.schemas import User, DashboardStats
from ...services.emission_service import EmissionService
from ...services.marketplace_service import MarketplaceService
from ...services.ai_service import AIRecommendationService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    days_back: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get comprehensive dashboard statistics"""
    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
          # Get emission summary
        try:
            emission_summary = await emission_service.get_emission_summary(
                user_id=current_user.id,
                start_date=start_date,
                end_date=end_date
            )
            print(f"Dashboard emission_summary: {emission_summary}")
        except Exception as e:
            print(f"Error in emission_summary: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch emission summary: {str(e)}")
          # Get recent activities (last 10)
        try:
            recent_emissions = await emission_service.get_user_emissions(
                user_id=current_user.id,
                start_date=start_date,
                end_date=end_date
            )
            recent_activities = recent_emissions[-10:] if recent_emissions else []
            print(f"Dashboard recent_activities count: {len(recent_activities)}")
        except Exception as e:
            print(f"Error in recent_emissions: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch recent emission activities: {str(e)}")        # Get recent purchases
        try:
            recent_purchases = await marketplace_service.get_user_purchases(current_user.id)
            recent_purchases = recent_purchases[-5:] if recent_purchases else []  # Last 5
            print(f"Dashboard recent_purchases count: {len(recent_purchases)}")
        except Exception as e:
            print(f"Error in recent_purchases: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch recent purchases: {str(e)}")
          # Calculate net-zero progress
        total_emissions = emission_summary.total_emissions
        total_offsets = emission_summary.total_offsets
        net_zero_progress = min(100, (total_offsets / total_emissions * 100)) if total_emissions > 0 else 0
        
        print(f"Dashboard creating DashboardStats...")
        try:
            dashboard_stats = DashboardStats(
                emission_summary=emission_summary,
                recent_activities=recent_activities,
                recent_purchases=recent_purchases,
                net_zero_progress=net_zero_progress,
                recommendations_count=3  # Simplified for now
            )
            print(f"Dashboard DashboardStats created successfully")
            return dashboard_stats
        except Exception as e:
            print(f"Error creating DashboardStats: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create dashboard stats: {str(e)}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overview")
async def get_overview(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
    marketplace_service: MarketplaceService = Depends(get_marketplace_service),
):
    """Get high-level overview metrics"""
    try:
        # Get this month's data
        end_date = datetime.now(timezone.utc)
        start_date = end_date.replace(day=1)  # First day of current month
        
        # Get emission summary
        emission_summary = await emission_service.get_emission_summary(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Get marketplace stats
        purchases = await marketplace_service.get_user_purchases(current_user.id)
        
        total_investment = sum(p.total_cost for p in purchases)
        total_credits = sum(p.quantity for p in purchases)
        total_retired = sum(p.retired_quantity for p in purchases)
        
        return {
            "current_month": {
                "emissions": emission_summary.total_emissions,
                "offsets": emission_summary.total_offsets,
                "net_emissions": emission_summary.net_emissions
            },
            "total_investment": total_investment,
            "credits_portfolio": {
                "total_credits": total_credits,
                "retired_credits": total_retired,
                "available_credits": total_credits - total_retired
            },
            "progress_metrics": {
                "offset_percentage": emission_summary.offset_percentage,
                "monthly_reduction": 0,  # Would calculate from historical data
                "sustainability_score": min(100, emission_summary.offset_percentage + 20)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def get_dashboard_insights(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get AI-powered insights for the dashboard"""
    try:
        # Get recent emissions for analysis
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=90)
        
        emissions = await emission_service.get_user_emissions(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        insights = []
        
        if emissions:
            # Calculate insights
            total_emissions = sum(e.co2_equivalent for e in emissions)
            
            # Category analysis
            category_totals = {}
            for emission in emissions:
                category = emission.category
                if category not in category_totals:
                    category_totals[category] = 0
                category_totals[category] += emission.co2_equivalent
            
            if category_totals:
                highest_category = max(category_totals, key=category_totals.get)
                insights.append({
                    "type": "category_analysis",
                    "title": f"Highest Impact: {highest_category.title()}",
                    "description": f"Your {highest_category} activities represent {(category_totals[highest_category]/total_emissions*100):.1f}% of total emissions",
                    "action": f"Focus on reducing {highest_category} emissions for maximum impact",
                    "priority": "high"
                })
            
            # Trend analysis
            if len(emissions) >= 14:  # At least 2 weeks of data
                recent_avg = sum(e.co2_equivalent for e in emissions[-7:]) / 7
                older_avg = sum(e.co2_equivalent for e in emissions[-14:-7]) / 7
                
                if recent_avg > older_avg * 1.1:
                    insights.append({
                        "type": "trend_alert",
                        "title": "Emissions Increasing",
                        "description": f"Recent emissions are {((recent_avg-older_avg)/older_avg*100):.1f}% higher than previous week",
                        "action": "Review recent activities and implement reduction measures",
                        "priority": "medium"
                    })
                elif recent_avg < older_avg * 0.9:
                    insights.append({
                        "type": "trend_positive",
                        "title": "Great Progress!",
                        "description": f"Recent emissions are {((older_avg-recent_avg)/older_avg*100):.1f}% lower than previous week",
                        "action": "Continue current reduction efforts",
                        "priority": "low"
                    })
            
            # Recommendations
            insights.append({
                "type": "recommendation",
                "title": "Consider Carbon Credits",
                "description": f"You have {total_emissions:.1f} tons of unoffset emissions",
                "action": "Explore carbon credit marketplace for offset opportunities",
                "priority": "medium"
            })
        
        return {
            "insights": insights,
            "total_insights": len(insights),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
