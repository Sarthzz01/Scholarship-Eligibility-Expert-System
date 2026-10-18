import json
import pytest
from app.models import User, Scholarship
from app.auth import hash_password

@pytest.fixture(autouse=True)
def seed_api_data(db_session):
    admin = User(
        email="admin_api@test.com",
        hashed_password=hash_password("adminpass123"),
        full_name="Admin User",
        role="admin"
    )
    student = User(
        email="student_api@test.com",
        hashed_password=hash_password("studentpass123"),
        full_name="Student User",
        role="student"
    )
    scheme = Scholarship(
        name="Test MahaDBT Scheme",
        state="Maharashtra",
        is_official=True,
        is_active=True,
        criteria_json=json.dumps([
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule", "required": True},
            {"field": "annual_income", "operator": "lte", "value": 250000, "message": "Income rule", "required": True}
        ]),
        deadline="2026-12-15",
        award_amount=45000
    )
    db_session.add_all([admin, student, scheme])
    db_session.flush()

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_list_schemes_public(client):
    res = client.get("/api/schemes")
    assert res.status_code == 200
    assert len(res.json()) >= 1

def test_evaluate_public(client):
    payload = {
        "student": {
            "state": "Maharashtra",
            "category": "OBC",
            "annual_income": 150000,
            "marks_percentage": 85.0,
            "course_level": "Post-Matric",
            "course_type": "Professional",
            "attendance_percentage": 80.0,
            "cap_admission": True,
            "receiving_other_scholarship": False,
            "passed_previous_year": True,
            "is_fresh_application": True
        }
    }
    res = client.post("/api/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "evaluation_id" in data
    assert len(data["results"]) >= 1
    assert data["results"][0]["status"] == "potential_match"
    # Check actionable guidance structure
    assert "student_guidance" in data
    assert "eligible_schemes" in data["student_guidance"]
    assert "requires_action_schemes" in data["student_guidance"]
    assert "needs_information_schemes" in data["student_guidance"]

def test_admin_can_execute_all_algorithms(client):
    login_res = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # BFS
    res_bfs = client.post("/api/algorithms/bfs", json={}, headers=headers)
    assert res_bfs.status_code == 200
    assert "traversal_order" in res_bfs.json()

    # Hill Climbing
    res_hc = client.post("/api/algorithms/hill-climbing", json={}, headers=headers)
    assert res_hc.status_code == 200

    # Rule test simulation
    res_rt = client.post("/api/algorithms/rule-test", json={
        "student": {
            "state": "Maharashtra", "category": "OBC", "annual_income": 150000,
            "marks_percentage": 85, "course_level": "Post-Matric", "course_type": "Professional",
            "attendance_percentage": 80, "cap_admission": True, "receiving_other_scholarship": False,
            "passed_previous_year": True, "is_fresh_application": True
        }
    }, headers=headers)
    assert res_rt.status_code == 200
    login_res = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "name": "New Research Fellowship",
        "description": "Fellowship for research scholars",
        "state": "All India",
        "source_url": "https://scholarships.gov.in/fellowship",
        "source_verified_on": "2026-10-10",
        "is_official": True,
        "is_active": True,
        "criteria": [
            {"field": "course_level", "operator": "eq", "value": "PhD", "message": "Must be pursuing PhD", "required": True}
        ],
        "notes": "Admin created test scheme",
        "deadline": "2026-12-31",
        "award_amount": 80000,
        "category": "All",
        "course_level": "PhD",
        "required_documents": ["Research Proposal", "Admission Letter"],
        "application_effort_hours": 6.0
    }
    create_res = client.post("/api/schemes", json=create_payload, headers=headers)
    assert create_res.status_code == 200
    created_id = create_res.json()["id"]

    # Student cannot delete scheme
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    stud_token = login_stud.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}
    del_forbidden = client.delete(f"/api/schemes/{created_id}", headers=stud_headers)
    assert del_forbidden.status_code == 403

    # Admin deletes scheme
    del_res = client.delete(f"/api/schemes/{created_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

def test_admin_ai_summary_and_benchmark(client):
    login_res = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # AI Summary
    summary_res = client.get("/api/admin/ai-summary", headers=headers)
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert "total_schemes" in data
    assert "total_rules" in data
    assert data["db_connected"] is True

    # Benchmark BFS vs DFS
    bench_res = client.get("/api/algorithms/benchmark", headers=headers)
    assert bench_res.status_code == 200
    bench_data = bench_res.json()
    assert "bfs" in bench_data
    assert "dfs" in bench_data
    assert "graph_statistics" in bench_data
    assert bench_data["bfs"]["nodes_visited"] > 0
    assert bench_data["dfs"]["nodes_visited"] > 0

    # Test Suite Runner
    suite_res = client.post("/api/algorithms/test-suite", headers=headers)
    assert suite_res.status_code == 200
    suite_data = suite_res.json()
    assert suite_data["total_tests"] == 10
    assert suite_data["passed_tests"] == 10

def test_student_forbidden_from_algorithm_endpoints(client):
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    token = login_stud.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Student cannot run benchmark
    res_b = client.get("/api/algorithms/benchmark", headers=headers)
    assert res_b.status_code == 403

    # Student cannot run test suite
    res_t = client.post("/api/algorithms/test-suite", headers=headers)
    assert res_t.status_code == 403

    # Student cannot get AI summary
    res_s = client.get("/api/admin/ai-summary", headers=headers)
    assert res_s.status_code == 403

def test_student_application_tracker_lifecycle(client):
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    token = login_stud.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Track scholarship as interested
    track_res = client.post("/api/student/applications", json={
        "scholarship_id": 1,
        "status": "interested",
        "notes": "Plan to apply next week"
    }, headers=headers)
    assert track_res.status_code == 200
    app_id = track_res.json()["id"]
    assert track_res.json()["status"] == "interested"

    # 2. List applications
    list_res = client.get("/api/student/applications", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert list_res.json()[0]["id"] == app_id

    # 3. Transition status to 'preparing_documents'
    patch_res = client.patch(f"/api/student/applications/{app_id}", json={
        "status": "preparing_documents",
        "notes": "Collecting income certificate from Tehsil"
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "preparing_documents"

    # 4. Delete application tracking
    del_res = client.delete(f"/api/student/applications/{app_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

def test_cross_student_application_isolation(client, db_session):
    from app.models import User
    from app.auth import hash_password
    other_student = User(
        email="other_student@test.com",
        hashed_password=hash_password("otherpass123"),
        full_name="Other Student",
        role="student"
    )
    db_session.add(other_student)
    db_session.flush()

    # Student 1 creates application
    login_s1 = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    token1 = login_s1.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}
    app_res = client.post("/api/student/applications", json={"scholarship_id": 1, "status": "interested"}, headers=h1)
    app_id = app_res.json()["id"]

    # Student 2 tries to modify or delete Student 1's application
    login_s2 = client.post("/api/auth/login", json={"email": "other_student@test.com", "password": "otherpass123"})
    token2 = login_s2.json()["access_token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    patch_forbidden = client.patch(f"/api/student/applications/{app_id}", json={"status": "submitted"}, headers=h2)
    assert patch_forbidden.status_code == 403

    del_forbidden = client.delete(f"/api/student/applications/{app_id}", headers=h2)
    assert del_forbidden.status_code == 403

def test_student_notifications(client):
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    token = login_stud.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/student/notifications", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "approaching_deadlines" in data
    assert "missing_documents_alerts" in data
    assert "profile_warnings" in data

def test_admin_backward_chaining(client):
    login_admin = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    token_admin = login_admin.json()["access_token"]
    h_admin = {"Authorization": f"Bearer {token_admin}"}

    # Admin runs backward chaining
    res = client.post("/api/algorithms/backward-chaining", json={
        "scheme_id": 1,
        "student": {
            "state": "Maharashtra", "category": "OBC", "annual_income": 120000,
            "marks_percentage": 82, "course_level": "Post-Matric", "course_type": "Professional",
            "attendance_percentage": 80, "cap_admission": True, "receiving_other_scholarship": False,
            "passed_previous_year": True, "is_fresh_application": True
        }
    }, headers=h_admin)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] == "proven"
    assert "subgoals" in data
    assert len(data["subgoals"]) >= 1

    # Student cannot run backward chaining
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    h_stud = {"Authorization": f"Bearer {login_stud.json()['access_token']}"}
    res_forbidden = client.post("/api/algorithms/backward-chaining", json={"scheme_id": 1}, headers=h_stud)
    assert res_forbidden.status_code == 403

def test_admin_scheme_archive_and_recalculate(client):
    login_admin = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    token = login_admin.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Archive scheme
    arch_res = client.post("/api/schemes/1/archive", headers=headers)
    assert arch_res.status_code == 200
    assert arch_res.json()["is_archived"] is True

    # Audit log check
    audit_res = client.get("/api/admin/schemes/1/audit-log", headers=headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1
    assert audit_res.json()[0]["action"] == "archive"

    # Unarchive scheme
    unarch_res = client.post("/api/schemes/1/archive", headers=headers)
    assert unarch_res.status_code == 200
    assert unarch_res.json()["is_archived"] is False

    # Recalculate scheme
    recalc_res = client.post("/api/admin/schemes/1/recalculate", headers=headers)
    assert recalc_res.status_code == 200
    assert "students_recalculated" in recalc_res.json()

def test_rule_validation_endpoint(client):
    login_admin = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    headers = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

    # Contradictory criteria
    res = client.post("/api/admin/rules/validate", json={
        "criteria": [
            {"field": "state", "operator": "eq", "value": "Maharashtra", "message": "State rule"},
            {"field": "state", "operator": "eq", "value": "Delhi", "message": "State rule"}
        ]
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["is_valid"] is False
    assert len(res.json()["contradictions"]) >= 1

def test_evaluations_history_protected(client):
    # Unauthenticated -> 401
    res_unauth = client.get("/api/evaluations")
    assert res_unauth.status_code == 401

    # Student -> 403
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    h_stud = {"Authorization": f"Bearer {login_stud.json()['access_token']}"}
    res_stud = client.get("/api/evaluations", headers=h_stud)
    assert res_stud.status_code == 403

    # Admin -> 200
    login_admin = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    h_admin = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}
    res_admin = client.get("/api/evaluations", headers=h_admin)
    assert res_admin.status_code == 200

def test_admin_registered_students_endpoint(client):
    # Unauthenticated -> 401
    res_unauth = client.get("/api/admin/registered-students")
    assert res_unauth.status_code == 401

    # Student -> 403
    login_stud = client.post("/api/auth/login", json={"email": "student_api@test.com", "password": "studentpass123"})
    h_stud = {"Authorization": f"Bearer {login_stud.json()['access_token']}"}
    res_stud = client.get("/api/admin/registered-students", headers=h_stud)
    assert res_stud.status_code == 403

    # Admin -> 200 and returns student list with profile
    login_admin = client.post("/api/auth/login", json={"email": "admin_api@test.com", "password": "adminpass123"})
    h_admin = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}
    res_admin = client.get("/api/admin/registered-students", headers=h_admin)
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    found = next((s for s in data if s["email"] == "student_api@test.com"), None)
    assert found is not None
    assert "profile" in found
    assert found["profile"]["state"] is not None



