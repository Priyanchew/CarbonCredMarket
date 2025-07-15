"""
AI recommendation service for carbon credit suggestions.
"""
from typing import List, Dict, Any
from uuid import UUID
import random
from datetime import datetime, timedelta, timezone
from supabase import Client

from ..models.schemas import CarbonCredit, Emission


class AIRecommendationService:
    def __init__(self, db: Client):
        self.supabase = db

    async def get_credit_recommendations(
        self,
        user_id: UUID,
        emission_data: List[Emission],
        budget: float = None
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered carbon credit recommendations based on user emissions.
        This is a simplified AI simulation - in production, this would use ML models.
        """
        try:
            # Calculate total emissions
            total_emissions = sum(emission.co2_equivalent for emission in emission_data)
            
            if total_emissions == 0:
                return []

            # Get available credits
            available_credits = await self._get_available_credits()
            
            # Generate recommendations based on emission patterns
            recommendations = []
            
            # Strategy 1: Exact Match - Find credits that match emission types
            exact_matches = self._find_exact_matches(emission_data, available_credits)
            
            # Strategy 2: Cost-Effective - Find best price per ton
            cost_effective = self._find_cost_effective(available_credits, total_emissions, budget)
            
            # Strategy 3: High-Impact Projects - Prioritize certain project types
            high_impact = self._find_high_impact_projects(available_credits, total_emissions)
            
            # Strategy 4: Portfolio Diversification
            diversified = self._create_diversified_portfolio(available_credits, total_emissions, budget)
            
            # Combine and rank recommendations
            all_recommendations = {
                "exact_match": exact_matches,
                "cost_effective": cost_effective,
                "high_impact": high_impact,
                "diversified": diversified
            }
            
            for strategy, recs in all_recommendations.items():
                for rec in recs:
                    rec["strategy"] = strategy
                    rec["confidence_score"] = self._calculate_confidence_score(rec, emission_data)
                    recommendations.append(rec)
            
            # Remove duplicates and sort by confidence score
            unique_recommendations = self._remove_duplicates(recommendations)
            unique_recommendations.sort(key=lambda x: x["confidence_score"], reverse=True)
            
            return unique_recommendations[:10]  # Return top 10 recommendations
        
        except Exception as e:
            raise Exception(f"Failed to generate recommendations: {str(e)}")

    async def _get_available_credits(self) -> List[CarbonCredit]:
        """Get all available carbon credits."""
        response = self.supabase.table("carbon_credits").select("*").eq("status", "available").execute()
        return [CarbonCredit(**credit) for credit in response.data]

    def _find_exact_matches(self, emissions: List[Emission], credits: List[CarbonCredit]) -> List[Dict[str, Any]]:
        """Find credits that match emission categories."""
        recommendations = []
        
        # Group emissions by category
        emission_categories = {}
        for emission in emissions:
            category = emission.category
            if category not in emission_categories:
                emission_categories[category] = 0
            emission_categories[category] += emission.co2_equivalent
        
        # Map emission categories to project types
        category_mapping = {
            "transportation": ["renewable_energy", "forestry"],
            "energy": ["renewable_energy", "energy_efficiency"],
            "manufacturing": ["industrial", "renewable_energy"],
            "agriculture": ["agriculture", "forestry"],
            "waste": ["waste_management", "methane_capture"]
        }
        
        for category, emissions_amount in emission_categories.items():
            if category in category_mapping:
                for project_type in category_mapping[category]:
                    matching_credits = [c for c in credits if c.project_type == project_type]
                    for credit in matching_credits[:3]:  # Top 3 per category
                        recommended_quantity = min(emissions_amount, credit.available_quantity)
                        recommendations.append({
                            "credit": credit,
                            "recommended_quantity": recommended_quantity,
                            "total_cost": recommended_quantity * credit.price_per_ton,
                            "offset_percentage": (recommended_quantity / emissions_amount) * 100,
                            "reason": f"Matches your {category} emissions"
                        })
        
        return recommendations

    def _find_cost_effective(self, credits: List[CarbonCredit], total_emissions: float, budget: float = None) -> List[Dict[str, Any]]:
        """Find most cost-effective credits."""
        recommendations = []
        
        # Sort by price per ton
        sorted_credits = sorted(credits, key=lambda x: x.price_per_ton)
        
        for credit in sorted_credits[:5]:
            if budget:
                max_quantity = min(budget / credit.price_per_ton, credit.available_quantity, total_emissions)
            else:
                max_quantity = min(credit.available_quantity, total_emissions)
            
            if max_quantity > 0:
                recommendations.append({
                    "credit": credit,
                    "recommended_quantity": max_quantity,
                    "total_cost": max_quantity * credit.price_per_ton,
                    "offset_percentage": (max_quantity / total_emissions) * 100,
                    "reason": f"Most cost-effective at ${credit.price_per_ton:.2f} per ton"
                })
        
        return recommendations

    def _find_high_impact_projects(self, credits: List[CarbonCredit], total_emissions: float) -> List[Dict[str, Any]]:
        """Find high-impact project types."""
        high_impact_types = ["forestry", "renewable_energy", "direct_air_capture"]
        recommendations = []
        
        for project_type in high_impact_types:
            type_credits = [c for c in credits if c.project_type == project_type]
            type_credits.sort(key=lambda x: x.verification_standard, reverse=True)  # Prefer higher standards
            
            for credit in type_credits[:2]:
                recommended_quantity = min(total_emissions * 0.3, credit.available_quantity)  # 30% of emissions
                recommendations.append({
                    "credit": credit,
                    "recommended_quantity": recommended_quantity,
                    "total_cost": recommended_quantity * credit.price_per_ton,
                    "offset_percentage": (recommended_quantity / total_emissions) * 100,
                    "reason": f"High-impact {project_type.replace('_', ' ')} project"
                })
        
        return recommendations

    def _create_diversified_portfolio(self, credits: List[CarbonCredit], total_emissions: float, budget: float = None) -> List[Dict[str, Any]]:
        """Create a diversified portfolio of credits."""
        recommendations = []
        
        # Group credits by project type
        project_types = {}
        for credit in credits:
            if credit.project_type not in project_types:
                project_types[credit.project_type] = []
            project_types[credit.project_type].append(credit)
        
        # Allocate budget/emissions across different project types
        allocation_per_type = total_emissions / len(project_types)
        
        for project_type, type_credits in project_types.items():
            # Select best credit from each type
            best_credit = min(type_credits, key=lambda x: x.price_per_ton)
            recommended_quantity = min(allocation_per_type, best_credit.available_quantity)
            
            if recommended_quantity > 0:
                recommendations.append({
                    "credit": best_credit,
                    "recommended_quantity": recommended_quantity,
                    "total_cost": recommended_quantity * best_credit.price_per_ton,
                    "offset_percentage": (recommended_quantity / total_emissions) * 100,
                    "reason": f"Part of diversified portfolio ({project_type.replace('_', ' ')})"
                })
        
        return recommendations

    def _calculate_confidence_score(self, recommendation: Dict[str, Any], emissions: List[Emission]) -> float:
        """Calculate confidence score for a recommendation."""
        base_score = 0.5
        
        # Higher score for higher offset percentage
        offset_bonus = min(recommendation["offset_percentage"] / 100, 0.3)
        
        # Higher score for better price
        price_score = max(0, (50 - recommendation["credit"].price_per_ton) / 50 * 0.2)
        
        # Higher score for verified standards
        standard_bonus = 0.1 if recommendation["credit"].verification_standard in ["Gold Standard", "VCS"] else 0
        
        # Strategy-specific bonuses
        strategy_bonus = {
            "exact_match": 0.2,
            "cost_effective": 0.15,
            "high_impact": 0.25,
            "diversified": 0.1
        }.get(recommendation["strategy"], 0)
        
        total_score = base_score + offset_bonus + price_score + standard_bonus + strategy_bonus
        return min(total_score, 1.0)

    def _remove_duplicates(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate credit recommendations."""
        seen_credits = set()
        unique_recommendations = []
        
        for rec in recommendations:
            credit_id = rec["credit"].id
            if credit_id not in seen_credits:
                seen_credits.add(credit_id)
                unique_recommendations.append(rec)
        
        return unique_recommendations

    async def get_impact_prediction(self, user_id: UUID, credit_purchases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict environmental impact of credit purchases."""
        try:
            total_credits = sum(purchase["quantity"] for purchase in credit_purchases)
            total_cost = sum(purchase["total_cost"] for purchase in credit_purchases)
            
            # Simulate impact calculations
            co2_offset = total_credits
            tree_equivalent = total_credits * 40  # Rough equivalent
            car_miles_offset = total_credits * 2400  # Rough equivalent
            
            # Calculate impact by project type
            project_impacts = {}
            for purchase in credit_purchases:
                project_type = purchase["credit"].project_type
                if project_type not in project_impacts:
                    project_impacts[project_type] = 0
                project_impacts[project_type] += purchase["quantity"]
            
            return {
                "total_co2_offset": co2_offset,
                "equivalent_trees_planted": tree_equivalent,
                "equivalent_car_miles_offset": car_miles_offset,
                "total_investment": total_cost,
                "project_type_breakdown": project_impacts,
                "environmental_benefit_score": min(total_credits / 100 * 10, 10),  # Scale 1-10
                "prediction_date": datetime.now(timezone.utc).isoformat()
            }
        
        except Exception as e:
            raise Exception(f"Failed to calculate impact prediction: {str(e)}")
