from app.ai_bfs import build_knowledge_graph, run_bfs
from app.ai_dfs import build_scheme_decision_tree, run_dfs
from app.ai_hill_climbing import calculate_scheme_utility, run_hill_climbing
from app.ai_astar import run_astar_planner

def test_bfs_traversal():
    mock_schemes = [
        {
            "id": 1,
            "name": "State OBC Scheme",
            "state": "Maharashtra",
            "category": "OBC",
            "course_level": "Post-Matric",
            "award_amount": 50000,
            "is_official": True
        },
        {
            "id": 2,
            "name": "Central Merit Scheme",
            "state": "All India",
            "category": "All",
            "course_level": "Post-Matric",
            "award_amount": 20000,
            "is_official": True
        }
    ]
    res = run_bfs(mock_schemes)
    assert len(res["traversal_order"]) > 0
    assert res["traversal_order"][0] == "node:root"
    assert "scheme:1" in res["traversal_order"]
    assert "scheme:2" in res["traversal_order"]
    assert len(res["steps"]) > 0
    assert len(res["discovered_scheme_ids"]) == 2

def test_bfs_start_node_traversal():
    mock_schemes = [
        {"id": 1, "name": "Maharashtra Scheme", "state": "Maharashtra", "category": "OBC", "course_level": "Post-Matric"},
        {"id": 2, "name": "Central Scheme", "state": "All India", "category": "All", "course_level": "Post-Matric"}
    ]
    # Run BFS starting specifically from Maharashtra jurisdiction subtree
    res = run_bfs(mock_schemes, start_node_id="jur:Maharashtra")
    assert res["traversal_order"][0] == "jur:Maharashtra"
    assert 1 in res["discovered_scheme_ids"]
    assert 2 not in res["discovered_scheme_ids"]
    assert res["start_node_id"] == "jur:Maharashtra"

def test_bfs_profile_filtering():
    mock_schemes = [
        {"id": 1, "name": "Maharashtra OBC Scheme", "state": "Maharashtra", "category": "OBC", "course_level": "Post-Matric"},
        {"id": 2, "name": "Karnataka SC Scheme", "state": "Karnataka", "category": "SC", "course_level": "Post-Matric"},
        {"id": 3, "name": "All India Merit Scheme", "state": "All India", "category": "All", "course_level": "Post-Matric"}
    ]
    # Profile: Maharashtra resident, OBC
    res = run_bfs(mock_schemes, student_state="Maharashtra", student_category="OBC", filter_by_profile=True)
    assert 1 in res["discovered_scheme_ids"]
    assert 3 in res["discovered_scheme_ids"]
    assert 2 not in res["discovered_scheme_ids"] # Karnataka SC scheme pruned


def test_dfs_decision_tree():
    scheme = {
        "id": 1,
        "name": "Test Scheme",
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True}
        ]
    }
    student = {"state": "Maharashtra", "annual_income": 150000}
    res = run_dfs(scheme, student)
    assert res["scheme_id"] == 1
    assert len(res["traversal_order"]) > 0
    assert len(res["backtracks"]) > 0
    assert "dt_root" in res["path_taken"]
    assert "Potential Match" in res["overall_result"]

def test_hill_climbing_ranking():
    eligible_schemes = [
        {"id": 1, "name": "Scheme A", "award_amount": 20000, "deadline": "2026-12-01", "application_effort_hours": 6.0},
        {"id": 2, "name": "Scheme B", "award_amount": 70000, "deadline": "2026-11-20", "application_effort_hours": 3.0},
        {"id": 3, "name": "Scheme C", "award_amount": 40000, "deadline": "2026-12-15", "application_effort_hours": 4.0},
    ]
    student = {"marks_percentage": 85.0, "annual_income": 180000}
    res = run_hill_climbing(eligible_schemes, student)
    assert res["status"] == "success"
    assert res["final_score"] >= res["initial_score"]
    assert len(res["final_ranking"]) == 3
    # Scheme B has high award and low effort, should be top ranked
    assert res["final_ranking"][0]["scheme_id"] == 2

def test_astar_planner_optimal_path():
    scheme = {
        "id": 1,
        "name": "Test Scheme",
        "deadline": "2026-12-31",
        "required_documents": ["Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet"]
    }
    student = {
        "available_documents": ["Income Certificate", "Mark Sheet"]
    }
    res = run_astar_planner(scheme, student)
    assert res["status"] == "success"
    assert res["steps_count"] == 7
    assert res["total_cost_hours"] > 0
    # Missing documents should include Caste and Domicile
    assert "Caste Certificate" in res["missing_documents"]
    assert "Domicile Certificate" in res["missing_documents"]

def test_astar_planner_expired_deadline():
    scheme = {
        "id": 1,
        "name": "Past Scheme",
        "deadline": "2024-01-01",
        "required_documents": ["Income Certificate"]
    }
    student = {"available_documents": []}
    res = run_astar_planner(scheme, student)
    assert res["status"] == "unreachable"
    assert "expired" in res["reason"]

def test_academic_test_suite_all_pass():
    from app.test_suite_runner import run_academic_test_suite
    mock_schemes = [
        {
            "id": 1,
            "name": "Post Matric Scholarship to OBC Students (Maharashtra)",
            "state": "Maharashtra",
            "category": "OBC",
            "course_level": "Post-Matric",
            "award_amount": 45000,
            "is_official": True,
            "deadline": "2026-12-31",
            "required_documents": ["Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet"],
            "criteria": [
                {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
                {"field": "category", "operator": "eq", "value": "OBC", "message": "Category rule", "required": True},
                {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True},
                {"field": "attendance_percentage", "operator": "gte", "value": 75, "message": "Attendance rule", "required": True}
            ]
        },
        {
            "id": 2,
            "name": "Central Sector Scheme of Scholarships",
            "state": "All India",
            "category": "All",
            "course_level": "Post-Matric",
            "award_amount": 20000,
            "is_official": True,
            "deadline": "2026-12-31",
            "required_documents": ["Income Certificate", "Mark Sheet"],
            "criteria": [
                {"field": "annual_income", "operator": "lte", "value": 450000, "message": "Income rule", "required": True},
                {"field": "marks_percentage", "operator": "gte", "value": 80.0, "message": "Merit rule", "required": True}
            ]
        }
    ]
    test_results = run_academic_test_suite(mock_schemes)
    assert len(test_results) == 10
    passed_count = len([t for t in test_results if t["status"] == "PASS"])
    assert passed_count == 10, f"Expected 10 passes, got {passed_count}. Failed: {[t['name'] for t in test_results if t['status'] != 'PASS']}"

def test_evaluate_all_with_trace():
    from app.engine import evaluate_all_with_trace
    student = {
        "state": "Maharashtra",
        "category": "OBC",
        "annual_income": 150000,
        "marks_percentage": 82.0,
        "course_level": "Post-Matric",
        "course_type": "Professional",
        "attendance_percentage": 80.0,
        "cap_admission": True,
        "receiving_other_scholarship": False,
        "passed_previous_year": True
    }
    schemes = [
        {
            "id": 1,
            "name": "OBC Scheme",
            "state": "Maharashtra",
            "criteria": [
                {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
                {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True}
            ]
        }
    ]
    res = evaluate_all_with_trace(student, schemes)
    assert res["total_tested"] == 1
    assert len(res["trace_steps"]) > 0
    assert res["potential_matches"] == 1
    assert res["conditions_passed"] == 2

