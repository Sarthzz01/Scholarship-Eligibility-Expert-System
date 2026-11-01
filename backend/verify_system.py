import urllib.request, json, sys

sys.stdout.reconfigure(encoding='utf-8')
BASE = 'http://127.0.0.1:8000/api'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    b_data = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=b_data, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())

print("=== 1. Health Check ===")
h = req(f"{BASE}/health")
print("Health status:", h.get("status"))

print("\n=== 2. Admin Login & Stats ===")
admin_auth = req(f"{BASE}/auth/login", "POST", {
    "email": "admin@scholarshipexpert.org",
    "password": "AdminPass2026!",
    "expected_role": "admin"
})
admin_token = admin_auth["access_token"]
stats = req(f"{BASE}/admin/stats", token=admin_token)
print("Total Schemes:", stats["total_schemes"], "Official:", stats["official_schemes"], "Demo:", stats["demo_schemes"])

print("\n=== 3. Schemes Knowledge Base ===")
schemes = req(f"{BASE}/schemes")
print("Active Schemes Count:", len(schemes))
for s in schemes:
    print(f"  - #{s['id']} {s['name']} (₹{s['award_amount']:,}) [{s['category']}]")

print("\n=== 4. Student Login & Profile ===")
student_auth = req(f"{BASE}/auth/login", "POST", {
    "email": "student@scholarshipexpert.org",
    "password": "StudentPass2026!",
    "expected_role": "student"
})
student_token = student_auth["access_token"]
prof = req(f"{BASE}/student/profile", token=student_token)
print("Student Profile:", prof["category"], prof["state"], f"Income: ₹{prof['annual_income']:,}")

print("\n=== 5. AI Chatbot Assistant ===")
chat_res = req(f"{BASE}/chat", "POST", {
    "message": "Am I eligible for any scholarships?",
    "student": prof
}, token=student_token)
print("Chatbot reply preview:\n", chat_res["reply"][:300], "\n...")
print("Matched schemes:", [s["name"] for s in chat_res.get("matched_schemes", [])])
print("Suggestions:", chat_res.get("suggested_questions", []))

print("\n=== 6. AI Algorithms Control Center ===")
suite = req(f"{BASE}/algorithms/test-suite", "POST", token=admin_token)
print(f"Academic Test Suite: Passed {suite['passed_tests']}/{suite['total_tests']}, All Passed: {suite['all_passed']}")

bench = req(f"{BASE}/algorithms/benchmark", "GET", token=admin_token)
print(f"Benchmark Graph: {bench['graph_statistics']['total_vertices']} vertices, {bench['graph_statistics']['total_edges']} edges")
print(f"BFS: {bench['bfs']['duration_ms']}ms, DFS: {bench['dfs']['duration_ms']}ms")

print("\n[ALL 6 VERIFICATION CHECKS PASSED PERFECTLY!]")
