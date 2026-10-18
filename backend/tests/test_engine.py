from app.engine import compare, evaluate_scheme

def test_compare_operators():
    assert compare(10, "eq", 10) is True
    assert compare(10, "neq", 20) is True
    assert compare(20, "lte", 25) is True
    assert compare(20, "gte", 15) is True
    assert compare(20, "gt", 10) is True
    assert compare(10, "lt", 20) is True
    assert compare("OBC", "in", ["OBC", "SC"]) is True
    assert compare("Open", "not_in", ["OBC", "SC"]) is True

def test_expert_system_fully_satisfied():
    scheme = {
        "id": 1,
        "name": "Test Scheme",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True}
        ]
    }
    student = {"state": "Maharashtra", "annual_income": 150000}
    res = evaluate_scheme(student, scheme)
    assert res["status"] == "potential_match"
    assert len(res["passed_conditions"]) == 2
    assert len(res["failed_conditions"]) == 0
    assert len(res["missing_information"]) == 0

def test_expert_system_failed_mandatory():
    scheme = {
        "id": 1,
        "name": "Test Scheme",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True}
        ]
    }
    student = {"state": "Gujarat", "annual_income": 300000}
    res = evaluate_scheme(student, scheme)
    assert res["status"] == "ineligible"
    assert len(res["failed_conditions"]) == 2

def test_expert_system_missing_information():
    scheme = {
        "id": 1,
        "name": "Test Scheme",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Attendance rule", "required": True}
        ]
    }
    student = {"state": "Maharashtra", "attendance_percentage": None}
    res = evaluate_scheme(student, scheme)
    assert res["status"] == "needs_information"
    assert len(res["missing_information"]) == 1

def test_expert_system_optional_condition():
    scheme = {
        "id": 1,
        "name": "Professional Scheme",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {
                "field": "cap_admission", "operator": "eq", "value": True,
                "message": "CAP rule", "required": False,
                "when": {"field": "course_type", "operator": "eq", "value": "Professional"}
            }
        ]
    }
    # When course_type is Non-Professional, cap_admission should be bypassed
    student = {"state": "Maharashtra", "course_type": "Non-Professional", "cap_admission": None}
    res = evaluate_scheme(student, scheme)
    assert res["status"] == "potential_match"

def test_backward_chaining_proven():
    from app.engine import run_backward_chaining
    scheme = {
        "id": 101,
        "name": "State OBC Scholarship",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "required": True},
            {"field": "category", "operator": "eq", "value": "OBC", "required": True},
            {"field": "annual_income", "operator": "lte", "value": 250000, "required": True}
        ]
    }
    student = {"state": "Maharashtra", "category": "OBC", "annual_income": 120000}
    res = run_backward_chaining(scheme, student)
    assert res["overall_status"] == "proven"
    assert res["counts"]["proven"] == 3
    assert res["counts"]["refuted"] == 0
    assert len(res["missing_facts_to_prove"]) == 0
    assert len(res["trace_steps"]) >= 4

def test_backward_chaining_refuted():
    from app.engine import run_backward_chaining
    scheme = {
        "id": 102,
        "name": "Low Income Scheme",
        "criteria": [
            {"field": "annual_income", "operator": "lte", "value": 150000, "required": True}
        ]
    }
    student = {"annual_income": 400000}
    res = run_backward_chaining(scheme, student)
    assert res["overall_status"] == "refuted"
    assert res["counts"]["refuted"] == 1

def test_backward_chaining_missing_info():
    from app.engine import run_backward_chaining
    scheme = {
        "id": 103,
        "name": "Income Verification Scheme",
        "criteria": [
            {"field": "annual_income", "operator": "lte", "value": 200000, "required": True}
        ]
    }
    student = {"annual_income": None}
    res = run_backward_chaining(scheme, student)
    assert res["overall_status"] == "unresolved"
    assert "annual_income" in res["missing_facts_to_prove"]

def test_rule_validation_contradiction():
    from app.engine import validate_scheme_rules
    # Contradictory equality: requires both Maharashtra and Delhi
    contra_crit = [
        {"field": "state", "operator": "eq", "value": "Maharashtra"},
        {"field": "state", "operator": "eq", "value": "Delhi"}
    ]
    res = validate_scheme_rules(contra_crit)
    assert res["is_valid"] is False
    assert len(res["contradictions"]) >= 1

    # Impossible numeric bounds: min marks 85% but max marks 70%
    contra_numeric = [
        {"field": "marks_percentage", "operator": "gte", "value": 85.0},
        {"field": "marks_percentage", "operator": "lte", "value": 70.0}
    ]
    res_num = validate_scheme_rules(contra_numeric)
    assert res_num["is_valid"] is False
    assert len(res_num["contradictions"]) >= 1

def test_rule_validation_duplicates():
    from app.engine import validate_scheme_rules
    dup_crit = [
        {"field": "annual_income", "operator": "lte", "value": 250000},
        {"field": "annual_income", "operator": "lte", "value": 250000}
    ]
    res = validate_scheme_rules(dup_crit)
    assert len(res["duplicates"]) >= 1

def test_rule_validation_clean():
    from app.engine import validate_scheme_rules
    clean_crit = [
        {"field": "state", "operator": "eq", "value": "Maharashtra"},
        {"field": "annual_income", "operator": "lte", "value": 800000},
        {"field": "attendance_percentage", "operator": "gte", "value": 75}
    ]
    res = validate_scheme_rules(clean_crit)
    assert res["is_valid"] is True
    assert len(res["errors"]) == 0

def test_expired_deadline_scheme():
    scheme = {
        "id": 999,
        "name": "Past Deadline Scheme",
        "deadline": "2020-01-01",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "required": True}
        ]
    }
    student = {"state": "Maharashtra"}
    res = evaluate_scheme(student, scheme)
    assert res["status"] == "closed_expired"
    assert res["is_expired"] is True
