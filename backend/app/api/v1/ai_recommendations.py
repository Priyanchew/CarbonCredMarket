"""
AI recommendations API endpoints.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta, timezone

from ...core.security import get_current_user
from ...core.dependencies import get_ai_service, get_emission_service
from ...models.schemas import User
from ...services.ai_service import AIRecommendationService
from ...services.emission_service import EmissionService

router = APIRouter(prefix="/ai", tags=["ai-recommendations"])


@router.get("/recommendations")
async def get_credit_recommendations(
    budget: Optional[float] = Query(None, ge=0, description="Maximum budget for credit purchases"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to analyze emissions data"),
    current_user: User = Depends(get_current_user),
    ai_service: AIRecommendationService = Depends(get_ai_service),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get AI-powered carbon credit recommendations based on user emissions."""
    try:
        # Get recent emissions data
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        
        emissions = await emission_service.get_user_emissions(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not emissions:
            return {
                "recommendations": [],
                "message": "No emissions data available for analysis. Please add emission records first.",
                "analysis_period": f"{days_back} days"
            }
        
        recommendations = await ai_service.get_credit_recommendations(
            user_id=current_user.id,
            emission_data=emissions,
            budget=budget
        )
        
        return {
            "recommendations": recommendations,
            "analysis_period": f"{days_back} days",
            "total_emissions_analyzed": sum(e.co2_equivalent for e in emissions),
            "budget_constraint": budget,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/impact-prediction")
async def predict_impact(
    credit_purchases: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user),
    ai_service: AIRecommendationService = Depends(get_ai_service),
):
    """Predict environmental impact of planned credit purchases."""
    try:
        # Validate input
        if not credit_purchases:
            raise HTTPException(status_code=400, detail="No credit purchases provided")
        
        # Validate each purchase has required fields
        required_fields = ["credit", "quantity", "total_cost"]
        for i, purchase in enumerate(credit_purchases):
            for field in required_fields:
                if field not in purchase:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Purchase {i+1} missing required field: {field}"
                    )
        
        impact_prediction = await ai_service.get_impact_prediction(
            user_id=current_user.id,
            credit_purchases=credit_purchases
        )
        
        return impact_prediction
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emission-insights")
async def get_emission_insights(
    days_back: int = Query(90, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get AI-powered insights about emission patterns."""
    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        
        emissions = await emission_service.get_user_emissions(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not emissions:
            return {
                "insights": [],
                "message": "No emissions data available for analysis."
            }
        
        # Generate insights
        insights = _generate_emission_insights(emissions)
        
        return {
            "insights": insights,
            "analysis_period": f"{days_back} days",
            "total_emissions": sum(e.co2_equivalent for e in emissions),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimization-suggestions")
async def get_optimization_suggestions(
    current_user: User = Depends(get_current_user),
    emission_service: EmissionService = Depends(get_emission_service),
):
    """Get AI-powered suggestions for emission reduction and optimization."""
    try:
        # Get emissions from last 90 days
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=90)
        
        emissions = await emission_service.get_user_emissions(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not emissions:
            return {
                "suggestions": [],
                "message": "No emissions data available for optimization analysis."
            }
        
        suggestions = _generate_optimization_suggestions(emissions)
        
        return {
            "suggestions": suggestions,
            "priority_actions": suggestions[:3],  # Top 3 priority actions
            "potential_savings": _calculate_potential_savings(emissions),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_emission_insights(emissions) -> List[Dict[str, Any]]:
    """Generate insights about emission patterns."""
    insights = []
    
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
            "type": "highest_impact_category",
            "title": "Highest Impact Category",
            "description": f"Your {highest_category} activities generate the most emissions",
            "value": category_totals[highest_category],
            "recommendation": f"Focus on reducing {highest_category} emissions for maximum impact"
        })
    
    # Trend analysis (simplified)
    if len(emissions) >= 7:  # At least a week of data
        recent_avg = sum(e.co2_equivalent for e in emissions[-7:]) / 7
        older_avg = sum(e.co2_equivalent for e in emissions[:-7]) / (len(emissions) - 7)
        
        if recent_avg > older_avg * 1.1:
            insights.append({
                "type": "increasing_trend",
                "title": "Increasing Emissions Trend",
                "description": "Your recent emissions are higher than your historical average",
                "value": ((recent_avg - older_avg) / older_avg) * 100,
                "recommendation": "Review recent activities and implement reduction measures"
            })
        elif recent_avg < older_avg * 0.9:
            insights.append({
                "type": "improving_trend",
                "title": "Improving Emissions Trend",
                "description": "Your recent emissions are lower than your historical average",
                "value": ((older_avg - recent_avg) / older_avg) * 100,
                "recommendation": "Continue current reduction efforts and maintain progress"
            })
    
    return insights


def _generate_optimization_suggestions(emissions) -> List[Dict[str, Any]]:
    """Generate optimization suggestions based on emission patterns."""
    suggestions = []
    
    # Category-specific suggestions
    category_totals = {}
    for emission in emissions:
        category = emission.category
        if category not in category_totals:
            category_totals[category] = 0
        category_totals[category] += emission.co2_equivalent
    
    category_suggestions = {
        "transportation": [
            {
                "title": "Optimize Transportation Routes",
                "description": "Review and optimize delivery/travel routes to reduce fuel consumption",
                "impact": "High",
                "effort": "Medium",
                "potential_reduction": "15-25%"
            },
            {
                "title": "Electric Vehicle Transition",
                "description": "Consider transitioning fleet to electric or hybrid vehicles",
                "impact": "Very High",
                "effort": "High",
                "potential_reduction": "40-60%"
            }
        ],
        "energy": [
            {
                "title": "Energy Efficiency Audit",
                "description": "Conduct comprehensive energy audit to identify waste",
                "impact": "High",
                "effort": "Low",
                "potential_reduction": "10-20%"
            },
            {
                "title": "Renewable Energy Sources",
                "description": "Install solar panels or switch to renewable energy suppliers",
                "impact": "Very High",
                "effort": "High",
                "potential_reduction": "50-80%"
            }
        ],
        "manufacturing": [
            {
                "title": "Process Optimization",
                "description": "Optimize manufacturing processes to reduce energy consumption",
                "impact": "High",
                "effort": "Medium",
                "potential_reduction": "20-30%"
            }
        ]
    }
    
    # Add suggestions for top emission categories
    for category, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]:
        if category in category_suggestions:
            for suggestion in category_suggestions[category]:
                suggestion["category"] = category
                suggestion["current_emissions"] = total
                suggestions.append(suggestion)
    
    # General suggestions
    suggestions.extend([
        {
            "title": "Implement Carbon Tracking System",
            "description": "Set up automated systems to track and monitor emissions in real-time",
            "impact": "Medium",
            "effort": "Medium",
            "category": "management",
            "potential_reduction": "5-10%"
        },
        {
            "title": "Employee Training Program",
            "description": "Train employees on sustainability practices and emission reduction",
            "impact": "Medium",
            "effort": "Low",
            "category": "culture",
            "potential_reduction": "5-15%"
        }
    ])
    
    return suggestions


def _calculate_potential_savings(emissions) -> Dict[str, float]:
    """Calculate potential emission savings from optimization."""
    total_emissions = sum(e.co2_equivalent for e in emissions)
    
    return {
        "current_total_emissions": total_emissions,
        "low_effort_savings": total_emissions * 0.10,  # 10% with low effort
        "medium_effort_savings": total_emissions * 0.25,  # 25% with medium effort
        "high_effort_savings": total_emissions * 0.50,  # 50% with high effort
        "maximum_theoretical_savings": total_emissions * 0.70  # 70% maximum
    }
