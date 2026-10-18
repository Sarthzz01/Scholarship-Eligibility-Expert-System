import pytest
from app.models import User, StudentProfileModel
from app.auth import hash_password

@pytest.fixture(autouse=True)
def seed_users(db_session):
    admin = User(
        email="admin@test.com",
        hashed_password=hash_password("adminpass123"),
        full_name="Test Admin",
        role="admin"
    )
    student1 = User(
        email="student1@test.com",
        hashed_password=hash_password("studentpass123"),
        full_name="Student One",
        role="student"
    )
    student2 = User(
        email="student2@test.com",
        hashed_password=hash_password("studentpass123"),
        full_name="Student Two",
        role="student"
    )
    db_session.add_all([admin, student1, student2])
    db_session.flush()

    db_session.add(StudentProfileModel(user_id=student1.id, state="Maharashtra", category="OBC"))
    db_session.add(StudentProfileModel(user_id=student2.id, state="Delhi", category="General"))
    db_session.flush()

def test_valid_student_login(client):
    res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "studentpass123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "student"

def test_invalid_password(client):
    res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_duplicate_student_registration(client):
    res = client.post("/api/auth/register", json={
        "email": "student1@test.com",
        "password": "newpassword123",
        "full_name": "Duplicate Student"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_successful_student_registration(client):
    res = client.post("/api/auth/register", json={
        "email": "newstudent@test.com",
        "password": "securepass123",
        "full_name": "New Student"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "student"

def test_unauthenticated_access_to_protected_endpoint(client):
    res = client.get("/api/student/profile")
    assert res.status_code == 401

def test_student_forbidden_from_admin_endpoint(client):
    login_res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "studentpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/stats", headers=headers)
    assert res.status_code == 403
    assert "Administrator privileges required" in res.json()["detail"]

def test_admin_can_access_admin_stats(client):
    login_res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "adminpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/stats", headers=headers)
    assert res.status_code == 200
    assert "total_schemes" in res.json()

def test_student_forbidden_from_algorithm_endpoints(client):
    login_res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "studentpass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Student tries to run BFS
    res_bfs = client.post("/api/algorithms/bfs", json={}, headers=headers)
    assert res_bfs.status_code == 403
    assert "Administrator privileges required" in res_bfs.json()["detail"]

    # Student tries to run Hill Climbing
    res_hc = client.post("/api/algorithms/hill-climbing", json={}, headers=headers)
    assert res_hc.status_code == 403

    # Student tries to run A* planner
    res_astar = client.post("/api/algorithms/astar", json={"scheme_id": 1}, headers=headers)
    assert res_astar.status_code == 403

def test_unauthenticated_forbidden_from_algorithms(client):
    res = client.post("/api/algorithms/bfs", json={})
    assert res.status_code == 401
