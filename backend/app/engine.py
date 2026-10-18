import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

FIELD_ALIASES = {
    "state": "state",
    "category": "category",
    "annual_income": "annual_income",
    "marks_percentage": "marks_percentage",
    "course_level": "course_level",
    "course_type": "course_type",
    "attendance_percentage": "attendance_percentage",
    "cap_admission": "cap_admission",
    "receiving_other_scholarship": "receiving_other_scholarship",
    "passed_previous_year": "passed_previous_year",
    "is_fresh_application": "is_fresh_application",
}

def compare(actual: Any, operator: str, expected: Any) -> bool:
    if operator == "eq":
        return actual == expected
    if operator == "neq":
        return actual != expected
    if operator == "lte":
        return actual is not None and actual <= expected
    if operator == "lt":
        return actual is not None and actual < expected
    if operator == "gte":
        return actual is not None and actual >= expected
    if operator == "gt":
        return actual is not None and actual > expected
    if operator == "in":
        return actual in expected
    if operator == "not_in":
        return actual not in expected
    if operator == "contains":
        return expected in actual if actual is not None else False
    raise ValueError(f"Unsupported rule operator: {operator}")

def evaluate_scheme(student: dict, scheme: dict) -> dict:
    """
    Algorithm 1: Rule-Based Expert System forward chaining inference engine.
    Evaluates applicant facts against declarative IF-THEN rules of a scholarship scheme.
    Differentiates between:
      - Mandatory conditions (failure triggers 'ineligible', omission triggers 'needs_information')
      - Optional conditions / conditional rules triggered by 'when' clauses
      - Expired / closed schemes
      - Potential matches vs officially confirmed awards
    """
    start_time = time.perf_counter()
    passed, failed, missing, skipped = [], [], [], []
    scheme_id = scheme.get("id", 0)

    criteria = scheme.get("criteria", [])
    for idx, criterion in enumerate(criteria, 1):
        rule_id = f"R{scheme_id}_{idx}"
        field = criterion["field"]
        message = criterion.get("message", f"Condition: {field}")
        required = criterion.get("required", True)
        operator = criterion.get("operator", "eq")
        expected = criterion.get("value")

        condition = criterion.get("when")
        if condition:
            condition_field = condition.get("field")
            condition_value = student.get(condition_field)
            if condition_value is None or not compare(
                condition_value, condition.get("operator", "eq"), condition.get("value")
            ):
                skipped.append({
                    "rule_id": rule_id,
                    "field": field,
                    "message": f"Precondition not met: {message}",
                    "operator": operator,
                    "expected": expected,
                    "actual": None,
                    "required": False,
                    "status": "not_applicable",
                    "reason": f"Only triggered when {condition_field} {condition.get('operator')} {condition.get('value')}"
                })
                continue

        if field not in FIELD_ALIASES:
            failed.append({
                "rule_id": rule_id,
                "field": field,
                "message": f"Unsupported rule field: {field}",
                "operator": operator,
                "expected": expected,
                "actual": student.get(field),
                "required": required,
                "status": "failed"
            })
            continue

        actual = student.get(field)
        if actual is None:
            if required:
                missing.append({
                    "rule_id": rule_id,
                    "field": field,
                    "message": f"Missing information: {message}",
                    "operator": operator,
                    "expected": expected,
                    "actual": None,
                    "required": True,
                    "status": "needs_information"
                })
            else:
                passed.append({
                    "rule_id": rule_id,
                    "field": field,
                    "message": f"Optional condition skipped (no input): {message}",
                    "operator": operator,
                    "expected": expected,
                    "actual": None,
                    "required": False,
                    "status": "satisfied"
                })
            continue

        try:
            result = compare(actual, operator, expected)
        except (TypeError, ValueError):
            result = False

        item = {
            "rule_id": rule_id,
            "field": field,
            "message": message,
            "actual": actual,
            "expected": expected,
            "operator": operator,
            "required": required,
            "status": "satisfied" if result else "failed"
        }
        (passed if result else failed).append(item)

    # Check for expired deadline
    deadline_str = scheme.get("deadline")
    is_expired = False
    if deadline_str:
        try:
            parts = [int(p) for p in deadline_str.split("-")[:3]]
            deadline_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
            if deadline_dt < datetime.now(timezone.utc):
                is_expired = True
        except Exception:
            pass

    if is_expired:
        status = "closed_expired"
        summary = f"Closed / Expired: The application deadline ({deadline_str}) has passed for this academic cycle."
    elif failed:
        status = "ineligible"
        summary = f"Ineligible: Failed {len(failed)} mandatory condition{'s' if len(failed) > 1 else ''}."
    elif missing:
        status = "needs_information"
        summary = f"Information needed: {len(missing)} required field{'s' if len(missing) > 1 else ''} missing to verify eligibility."
    else:
        status = "potential_match"
        summary = f"Preliminary Match: All {len(passed)} verified conditions successfully passed. Subject to final authority verification."

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return {
        "scholarship_id": scheme.get("id", 0),
        "scholarship_name": scheme.get("name", "Scholarship"),
        "status": status,
        "is_expired": is_expired,
        "summary": summary,
        "passed_conditions": passed,
        "failed_conditions": failed,
        "missing_information": missing,
        "skipped_conditions": skipped,
        "total_rules": len(criteria),
        "source_url": scheme.get("source_url", ""),
        "source_verified_on": scheme.get("source_verified_on", ""),
        "is_official": scheme.get("is_official", False),
        "notes": scheme.get("notes", ""),
        "deadline": scheme.get("deadline", "2026-11-30"),
        "award_amount": scheme.get("award_amount", 50000),
        "category": scheme.get("category", "All"),
        "course_level": scheme.get("course_level", "Post-Matric"),
        "required_documents": scheme.get("required_documents", []),
        "application_effort_hours": scheme.get("application_effort_hours", 4.0),
        "evaluation_duration_ms": elapsed_ms,
        "disclaimer": "This is an automated expert system recommendation, not an official government sanction.",
    }

def evaluate_all_with_trace(student: dict, schemes: List[dict]) -> dict:
    """
    Evaluates all active schemes and generates a step-by-step inference trace
    suitable for interactive stepping in the AI Control Center.
    Trace events represent:
      - Initial fact assertion
      - Scheme selection
      - Condition verification (green/red/amber/grey)
      - Scheme classification conclusion
    """
    start_time = time.perf_counter()
    results = []
    trace_steps = []
    step_num = 1

    # Step 1: Assert Student Facts
    trace_steps.append({
        "step": step_num,
        "type": "fact_assertion",
        "title": "Assert Applicant Working Memory Facts",
        "description": f"Loaded applicant facts: Domicile={student.get('state')}, Category={student.get('category')}, Income=₹{student.get('annual_income')}, Marks={student.get('marks_percentage')}%, Course={student.get('course_level')} ({student.get('course_type')}).",
        "facts": {k: v for k, v in student.items() if k in FIELD_ALIASES},
        "target_scheme": None,
        "current_rule": None,
        "visual_state": "neutral"
    })
    step_num += 1

    total_rules = 0
    total_passed = 0
    total_failed = 0
    total_missing = 0
    total_skipped = 0

    for scheme in schemes:
        eval_res = evaluate_scheme(student, scheme)
        results.append(eval_res)

        total_rules += eval_res["total_rules"]
        total_passed += len(eval_res["passed_conditions"])
        total_failed += len(eval_res["failed_conditions"])
        total_missing += len(eval_res["missing_information"])
        total_skipped += len(eval_res["skipped_conditions"])

        # Scheme activation step
        trace_steps.append({
            "step": step_num,
            "type": "scheme_start",
            "title": f"Evaluate Scheme: {scheme['name']}",
            "description": f"Instantiating forward chaining rule set for '{scheme['name']}' ({eval_res['total_rules']} conditions defined).",
            "target_scheme": scheme["name"],
            "scheme_id": scheme["id"],
            "current_rule": None,
            "visual_state": "in_progress"
        })
        step_num += 1

        # Evaluate each condition step
        all_conds = (
            eval_res["passed_conditions"] +
            eval_res["failed_conditions"] +
            eval_res["missing_information"] +
            eval_res["skipped_conditions"]
        )

        for c in all_conds:
            st = c.get("status")
            v_state = "satisfied" if st == "satisfied" else "failed" if st == "failed" else "needs_info" if st == "needs_information" else "not_applicable"
            action_desc = (
                f"Rule {c['rule_id']} [{c['field']}]: Expected {c['operator']} {c['expected']}, actual was {c['actual']}. Status: {st.upper()}."
            )
            trace_steps.append({
                "step": step_num,
                "type": "rule_evaluation",
                "title": f"{c['rule_id']}: {c['field'].replace('_', ' ').title()}",
                "description": action_desc,
                "target_scheme": scheme["name"],
                "scheme_id": scheme["id"],
                "current_rule": c,
                "visual_state": v_state
            })
            step_num += 1

        # Scheme conclusion step
        trace_steps.append({
            "step": step_num,
            "type": "scheme_conclusion",
            "title": f"Classification for '{scheme['name']}': {eval_res['status'].upper()}",
            "description": eval_res["summary"],
            "target_scheme": scheme["name"],
            "scheme_id": scheme["id"],
            "current_rule": None,
            "visual_state": eval_res["status"]
        })
        step_num += 1

    total_duration_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return {
        "results": results,
        "trace_steps": trace_steps,
        "total_tested": len(schemes),
        "total_schemes_evaluated": len(schemes),
        "total_rules_evaluated": total_rules,
        "conditions_passed": total_passed,
        "conditions_failed": total_failed,
        "conditions_missing": total_missing,
        "conditions_skipped": total_skipped,
        "potential_matches": len([r for r in results if r["status"] == "potential_match"]),
        "ineligible": len([r for r in results if r["status"] == "ineligible"]),
        "needs_information": len([r for r in results if r["status"] == "needs_information"]),
        "execution_duration_ms": total_duration_ms
    }

def run_backward_chaining(scheme: dict, student: dict) -> dict:
    """
    Algorithm 1B: Goal-Directed Backward Chaining Inference Engine.
    Top Goal: Prove 'Student satisfies eligibility requirements for scheme [name]'.
    Hypothesis-driven search:
      1. Establish Top Goal on the goal stack.
      2. For each rule condition in the scheme, establish a Subgoal: 'Prove premise C_i'.
      3. Interrogate applicant working memory facts for the premise field.
      4. If fact satisfies condition -> Subgoal PROVEN.
      5. If fact violates condition -> Subgoal REFUTED.
      6. If fact is missing (None) -> Subgoal UNKNOWN (requires fact verification).
      7. Handle conditional 'when' rules: if prerequisite not met, Subgoal is NOT_APPLICABLE.
      8. Synthesize final proof:
         - All mandatory subgoals proven -> Top Goal PROVEN (status: 'potential_match').
         - Any mandatory subgoal refuted -> Top Goal REFUTED (status: 'ineligible').
         - Any mandatory subgoal unknown -> Top Goal UNRESOLVED (status: 'needs_information').
    """
    start_time = time.perf_counter()
    scheme_id = scheme.get("id", 0)
    scheme_name = scheme.get("name", "Target Scholarship")
    criteria = scheme.get("criteria", [])

    top_goal = f"Applicant qualifies for '{scheme_name}' (ID: #{scheme_id})"
    subgoals = []
    trace_steps = []
    missing_facts = []
    step_num = 1

    # Step 1: Push top goal
    trace_steps.append({
        "step": step_num,
        "type": "goal_push",
        "title": "Establish Top-Level Goal Hypothesis",
        "description": f"Goal: Prove '{top_goal}' by backward chaining across {len(criteria)} antecedents.",
        "goal_stack": [top_goal],
        "current_subgoal": None,
        "visual_state": "in_progress"
    })
    step_num += 1

    proven_count = 0
    refuted_count = 0
    unknown_count = 0
    skipped_count = 0

    for idx, crit in enumerate(criteria, 1):
        rule_id = f"R{scheme_id}_{idx}"
        field = crit.get("field", "")
        op = crit.get("operator", "eq")
        exp = crit.get("value")
        req = crit.get("required", True)
        msg = crit.get("message", f"Check {field}")

        subgoal_desc = f"Prove rule antecedent {rule_id}: {field} {op} {exp}"
        current_stack = [top_goal, subgoal_desc]

        # Check 'when' precondition
        cond = crit.get("when")
        if cond:
            c_field = cond.get("field")
            c_val = student.get(c_field)
            if c_val is None or not compare(c_val, cond.get("operator", "eq"), cond.get("value")):
                subgoals.append({
                    "subgoal_id": f"SG{idx}",
                    "rule_id": rule_id,
                    "field": field,
                    "operator": op,
                    "expected": exp,
                    "actual": None,
                    "status": "skipped",
                    "mandatory": False,
                    "proof": f"Bypassed: Precondition '{c_field} {cond.get('operator')} {cond.get('value')}' not satisfied.",
                    "message": msg
                })
                trace_steps.append({
                    "step": step_num,
                    "type": "subgoal_bypassed",
                    "title": f"Subgoal {rule_id} Bypassed (Precondition Inapplicable)",
                    "description": f"Precondition on '{c_field}' evaluated to false; premise skipped.",
                    "goal_stack": current_stack,
                    "current_subgoal": rule_id,
                    "visual_state": "not_applicable"
                })
                step_num += 1
                skipped_count += 1
                continue

        fact_val = student.get(field)
        if fact_val is None:
            if req:
                subgoals.append({
                    "subgoal_id": f"SG{idx}",
                    "rule_id": rule_id,
                    "field": field,
                    "operator": op,
                    "expected": exp,
                    "actual": None,
                    "status": "unknown",
                    "mandatory": True,
                    "proof": f"Unproven: Fact '{field}' is missing in applicant working memory.",
                    "message": msg
                })
                missing_facts.append(field)
                trace_steps.append({
                    "step": step_num,
                    "type": "subgoal_unproven",
                    "title": f"Subgoal {rule_id} Unknown: Fact Missing",
                    "description": f"Cannot prove '{field} {op} {exp}' because fact is undefined.",
                    "goal_stack": current_stack,
                    "current_subgoal": rule_id,
                    "visual_state": "needs_info"
                })
                unknown_count += 1
            else:
                subgoals.append({
                    "subgoal_id": f"SG{idx}",
                    "rule_id": rule_id,
                    "field": field,
                    "operator": op,
                    "expected": exp,
                    "actual": None,
                    "status": "proven",
                    "mandatory": False,
                    "proof": "Optional premise without input considered satisfied.",
                    "message": msg
                })
                proven_count += 1
            step_num += 1
            continue

        try:
            satisfied = compare(fact_val, op, exp)
        except Exception:
            satisfied = False

        if satisfied:
            subgoals.append({
                "subgoal_id": f"SG{idx}",
                "rule_id": rule_id,
                "field": field,
                "operator": op,
                "expected": exp,
                "actual": fact_val,
                "status": "proven",
                "mandatory": req,
                "proof": f"Fact verified: {field}={fact_val} satisfies {op} {exp}.",
                "message": msg
            })
            trace_steps.append({
                "step": step_num,
                "type": "subgoal_proven",
                "title": f"Subgoal {rule_id} Proven: {field} Satisfied",
                "description": f"Verified applicant fact '{field}={fact_val}' matches expected {op} {exp}.",
                "goal_stack": current_stack,
                "current_subgoal": rule_id,
                "visual_state": "satisfied"
            })
            proven_count += 1
        else:
            subgoals.append({
                "subgoal_id": f"SG{idx}",
                "rule_id": rule_id,
                "field": field,
                "operator": op,
                "expected": exp,
                "actual": fact_val,
                "status": "refuted",
                "mandatory": req,
                "proof": f"Fact refutes premise: {field}={fact_val} violates {op} {exp}.",
                "message": msg
            })
            trace_steps.append({
                "step": step_num,
                "type": "subgoal_refuted",
                "title": f"Subgoal {rule_id} Refuted: {field} Violated",
                "description": f"Applicant fact '{field}={fact_val}' contradicts required {op} {exp}.",
                "goal_stack": current_stack,
                "current_subgoal": rule_id,
                "visual_state": "failed"
            })
            refuted_count += 1
        step_num += 1

    # Check deadline
    deadline_str = scheme.get("deadline")
    is_expired = False
    if deadline_str:
        try:
            parts = [int(p) for p in deadline_str.split("-")[:3]]
            deadline_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
            if deadline_dt < datetime.now(timezone.utc):
                is_expired = True
        except Exception:
            pass

    if is_expired:
        overall_status = "closed_expired"
        summary = f"Goal Refuted: Scheme deadline ({deadline_str}) has expired."
    elif refuted_count > 0:
        overall_status = "refuted"
        summary = f"Goal Refuted: {refuted_count} mandatory premise{'s' if refuted_count > 1 else ''} contradicted by applicant facts."
    elif unknown_count > 0:
        overall_status = "unresolved"
        summary = f"Goal Unresolved: {unknown_count} mandatory fact{'s' if unknown_count > 1 else ''} missing in profile."
    else:
        overall_status = "proven"
        summary = f"Goal Proven: All {proven_count} mandatory premises logically verified against student facts."

    trace_steps.append({
        "step": step_num,
        "type": "goal_resolved",
        "title": f"Final Resolution: Top Goal {overall_status.upper()}",
        "description": summary,
        "goal_stack": [],
        "current_subgoal": None,
        "visual_state": overall_status
    })

    proof_tree = {
        "id": "goal_root",
        "label": top_goal,
        "status": overall_status,
        "children": [
            {
                "id": sg["subgoal_id"],
                "label": f"{sg['rule_id']} [{sg['field']}]: {sg['status'].upper()}",
                "status": sg["status"],
                "details": sg
            }
            for sg in subgoals
        ]
    }

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return {
        "top_goal": top_goal,
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "overall_status": overall_status,
        "summary": summary,
        "subgoals": subgoals,
        "proof_tree": proof_tree,
        "trace_steps": trace_steps,
        "missing_facts_to_prove": missing_facts,
        "counts": {
            "total_subgoals": len(criteria),
            "proven": proven_count,
            "refuted": refuted_count,
            "unknown": unknown_count,
            "skipped": skipped_count
        },
        "execution_duration_ms": elapsed_ms
    }

def validate_scheme_rules(criteria: List[dict]) -> dict:
    """
    Validates criteria before saving or publishing.
    Detects contradictions, duplicates, and malformed rules.
    """
    errors = []
    warnings = []
    duplicates = []
    contradictions = []

    seen_rules = set()
    field_rules: Dict[str, List[dict]] = {}

    for idx, c in enumerate(criteria, 1):
        field = c.get("field")
        op = c.get("operator")
        val = c.get("value")

        if not field:
            errors.append(f"Criterion #{idx}: Missing field definition.")
            continue
        if field not in FIELD_ALIASES:
            errors.append(f"Criterion #{idx}: Unknown profile field '{field}'.")
        if not op:
            errors.append(f"Criterion #{idx} ({field}): Missing operator.")
            continue
        if op not in ("eq", "neq", "lte", "lt", "gte", "gt", "in", "not_in", "contains"):
            errors.append(f"Criterion #{idx} ({field}): Unsupported operator '{op}'.")

        if val is None and op not in ("is_null", "not_null"):
            warnings.append(f"Criterion #{idx} ({field}): Threshold value is None.")

        # Duplicate detection
        rule_sig = (field, op, str(val), c.get("required", True))
        if rule_sig in seen_rules:
            dup_msg = f"Duplicate criterion detected: {field} {op} {val}"
            duplicates.append(dup_msg)
            warnings.append(dup_msg)
        seen_rules.add(rule_sig)

        if field not in field_rules:
            field_rules[field] = []
        field_rules[field].append(c)

    # Contradiction detection
    for field, rules in field_rules.items():
        # Conflicting equality (without 'when' clause)
        eq_vals = [r.get("value") for r in rules if r.get("operator") == "eq" and not r.get("when")]
        if len(set(eq_vals)) > 1:
            contra_msg = f"Contradiction on '{field}': Rule requires both '{eq_vals[0]}' and '{eq_vals[1]}' simultaneously."
            contradictions.append(contra_msg)
            errors.append(contra_msg)

        # Conflicting inequalities for numeric fields
        if field in ("annual_income", "marks_percentage", "attendance_percentage"):
            lte_vals = [r.get("value") for r in rules if r.get("operator") in ("lte", "lt") and isinstance(r.get("value"), (int, float))]
            gte_vals = [r.get("value") for r in rules if r.get("operator") in ("gte", "gt") and isinstance(r.get("value"), (int, float))]
            if lte_vals and gte_vals:
                min_lte = min(lte_vals)
                max_gte = max(gte_vals)
                if max_gte > min_lte:
                    contra_msg = f"Contradiction on '{field}': Minimum requirement ({max_gte}) is greater than maximum ceiling ({min_lte}). No applicant can satisfy both."
                    contradictions.append(contra_msg)
                    errors.append(contra_msg)

    is_valid = len(errors) == 0
    return {
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "duplicates": duplicates,
        "contradictions": contradictions
    }

