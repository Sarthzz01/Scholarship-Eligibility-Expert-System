from typing import Any, Dict, List, Optional

FIELD_GUIDANCE = {
    "annual_income": {
        "title": "Annual Family Income Limit",
        "nature": "needs_verification",
        "guidance": "Check the official income definition and Tehsil/SDM income certificate requirements. If the entered amount was an error, update your profile with accurate financial details. Note that published government income ceilings cannot be bypassed.",
        "actionable": True
    },
    "marks_percentage": {
        "title": "Minimum Academic Marks Cutoff",
        "nature": "fixed_restriction",
        "guidance": "The reported marks are below the published merit requirement. Academic scores for completed exams cannot be altered; check whether another applicable category scheme or future renewal opportunity applies to your course.",
        "actionable": False
    },
    "category": {
        "title": "Social Category Reservation",
        "nature": "fixed_restriction",
        "guidance": "This scheme is strictly notified for the specified category pursuant to government regulations. Review the National or State scholarship portal for schemes designated for your category.",
        "actionable": False
    },
    "state": {
        "title": "Domicile / State Residence",
        "nature": "fixed_restriction",
        "guidance": "Applicant domicile state does not match the scheme jurisdiction. Review scholarship portals for your native domicile state or central all-India schemes on NSP.",
        "actionable": False
    },
    "course_level": {
        "title": "Educational Course Level",
        "nature": "fixed_restriction",
        "guidance": "This scheme is restricted to students enrolled in the designated educational tier (e.g. Post-Matric). Verify that your course level was selected accurately in your profile.",
        "actionable": False
    },
    "course_type": {
        "title": "Course Type Classification",
        "nature": "fixed_restriction",
        "guidance": "Scheme eligibility is restricted to approved course classifications (e.g. Professional vs Non-Professional). Check your institute's government recognition status.",
        "actionable": False
    },
    "attendance_percentage": {
        "title": "Minimum Attendance Threshold",
        "nature": "actionable",
        "guidance": "At least 75% attendance is mandatory for government fee reimbursement. Ensure your college has recorded your biometric attendance accurately before portal scrutiny.",
        "actionable": True
    },
    "cap_admission": {
        "title": "Centralized Admission Process (CAP) Allotment",
        "nature": "actionable",
        "guidance": "Admission through CAP allotment is mandatory for professional courses under government reimbursement rules. If admitted through CAP, keep your CAP allotment letter and college fee receipt ready.",
        "actionable": True
    },
    "receiving_other_scholarship": {
        "title": "Dual Scholarship Restriction",
        "nature": "actionable",
        "guidance": "Government regulations prohibit drawing dual scholarships or stipends simultaneously for the same academic year. If forgoing the other award, submit an official undertaking.",
        "actionable": True
    },
    "passed_previous_year": {
        "title": "Previous Academic Year Progression",
        "nature": "actionable",
        "guidance": "Must have successfully passed the previous qualifying year without unapproved backlogs. Verify whether clearance of supplementary exams restores eligibility.",
        "actionable": True
    }
}

def generate_condition_guidance(condition_item: Dict[str, Any], scheme_source_url: str, verified_date: str) -> Dict[str, Any]:
    field = condition_item.get("field", "")
    info = FIELD_GUIDANCE.get(field, {
        "title": field.replace("_", " ").title(),
        "nature": "needs_verification",
        "guidance": "Review the official scheme guidelines to verify this requirement.",
        "actionable": True
    })

    return {
        "condition_id": field,
        "requirement_title": info["title"],
        "message": condition_item.get("message", f"Requirement on {field}"),
        "student_value": condition_item.get("actual"),
        "required_value": condition_item.get("expected"),
        "operator": condition_item.get("operator", "eq"),
        "is_mandatory": condition_item.get("required", True),
        "nature": info["nature"],  # 'actionable' | 'fixed_restriction' | 'needs_verification'
        "actionable": info["actionable"],
        "next_action": info["guidance"],
        "official_source": scheme_source_url,
        "verification_date": verified_date
    }

def build_student_evaluation_response(eval_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Transforms raw rule engine evaluation results into student-friendly,
    actionable sections:
      - eligible_schemes (Potentially Eligible)
      - requires_action_schemes (Failed mandatory conditions with clear next steps)
      - needs_information_schemes (Missing fields with instructions on where to update)
    """
    eligible = []
    requires_action = []
    needs_info = []

    for res in eval_results:
        source_url = res.get("source_url", "")
        verified_date = res.get("source_verified_on", "")
        status = res.get("status")

        # Base scheme presentation (no AI algorithm jargon)
        scheme_card = {
            "scholarship_id": res.get("scholarship_id"),
            "scholarship_name": res.get("scholarship_name"),
            "description": res.get("description", res.get("notes", "")),
            "status": status,
            "award_amount": res.get("award_amount", 50000),
            "deadline": res.get("deadline", "2026-11-30"),
            "source_url": source_url,
            "source_verified_on": verified_date,
            "is_official": res.get("is_official", False),
            "required_documents": res.get("required_documents", []),
            "disclaimer": "Potentially eligible. Preliminary expert system evaluation. The official authority makes the final sanction decision."
        }

        if status == "potential_match":
            scheme_card["passed_conditions_summary"] = [
                {"message": c["message"], "field": c["field"]} for c in res.get("passed_conditions", [])
            ]
            eligible.append(scheme_card)

        elif status == "ineligible":
            # Build actionable guidance for every failed condition
            failed_with_guidance = [
                generate_condition_guidance(c, source_url, verified_date)
                for c in res.get("failed_conditions", [])
            ]
            scheme_card["failed_conditions"] = failed_with_guidance
            scheme_card["passed_conditions_count"] = len(res.get("passed_conditions", []))
            scheme_card["actionable_count"] = len([f for f in failed_with_guidance if f["actionable"]])
            scheme_card["fixed_restriction_count"] = len([f for f in failed_with_guidance if not f["actionable"]])
            requires_action.append(scheme_card)

        elif status == "needs_information":
            missing_items = []
            for m in res.get("missing_information", []):
                field = m.get("field", "")
                info = FIELD_GUIDANCE.get(field, {"title": field.replace("_", " ").title()})
                missing_items.append({
                    "field": field,
                    "title": info.get("title", field),
                    "message": m.get("message"),
                    "instruction": f"Please provide your '{info.get('title', field)}' in the Profile section to complete verification."
                })
            scheme_card["missing_fields"] = missing_items
            needs_info.append(scheme_card)

    return {
        "eligible_schemes": eligible,
        "requires_action_schemes": requires_action,
        "needs_information_schemes": needs_info,
        "total_evaluated": len(eval_results),
        "eligible_count": len(eligible),
        "requires_action_count": len(requires_action),
        "needs_information_count": len(needs_info)
    }
