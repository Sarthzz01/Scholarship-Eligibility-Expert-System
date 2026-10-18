# Scholarship Eligibility Expert System & AI Control Center

An enterprise-grade, dual-experience AI system built with **FastAPI**, **React + Vite**, **SQLite**, and classical symbolic AI algorithms. The application strictly separates the **Student Discovery Portal** (transparent, actionable, personal application tracker, alerts, zero AI jargon) from the **Admin AI Control Center** (full technical inspection, forward & backward chaining inference, live SVG graph visualizations, and execution of classical AI algorithms).

---

## 🏛️ System Architecture: Dual Role Separation

The platform enforces an end-to-end separation of concerns at both the user interface and API layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SCHOLARSHIP ELIGIBILITY SYSTEM                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     STUDENT DISCOVERY PORTAL    │         │      ADMIN AI CONTROL CENTER    │
│  (Pure Guidance & Discovery)    │         │   (Protected Classical AI Hub)  │
├─────────────────────────────────┤         ├─────────────────────────────────┤
│ • No AI Jargon / Algorithms     │         │ • Forward-Chaining Rule Engine  │
│ • Section A: Eligible Schemes   │         │ • Backward-Chaining Goal Engine │
│ • Section B: Actionable Advice  │         │ • Rule Validation & Audit Logs  │
│ • Section C: Missing Info Alert │         │ • Breadth-First Search (BFS)    │
│ • Application Tracker (7 states)│         │ • Depth-First Search (DFS)      │
│ • Deadlines & Document Alerts   │         │ • Hill Climbing Ranking Engine  │
│ • Document Checklist & Vault    │         │ • A* Application Task Planner   │
│ • Evaluation History & Profile  │         │ • Academic Notes & Viva Guide   │
│ • Verified Government Portals   │         │ • Benchmark & 10 Test Cases     │
│ • Scheme Catalog & Bookmarks    │         │ • JSON / CSV / Printable Export │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 │                                           │
                 │ JWT (role="student")                      │ JWT (role="admin")
                 ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FASTAPI REST API & RBAC ENGINE                    │
│   • Argon2id Hashing  • PyJWT Tokens  • Server-Side Role Enforcement   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SQLITE DATABASE ENGINE                          │
│   • PRAGMA foreign_keys = ON  • Auto-Migrations  • Version Audit Logs  │
│   • Schemes  • Rules  • Profiles  • Evaluations  • Applications        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Role-Based Access Control (RBAC) Matrix

Server-side security is strictly enforced via FastAPI dependency injection (`require_student`, `require_admin`). Students attempting to access admin APIs receive an immediate HTTP `403 Forbidden`.

| Feature / Operation | Public Visitor | Student Role | Administrator Role | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **Browse Active Schemes** | ✅ | ✅ | ✅ | Public `GET /api/schemes` |
| **Run Eligibility Check** | ✅ | ✅ | ✅ | `POST /api/evaluate` |
| **Manage Student Profile** | ❌ | ✅ (Own) | ❌ | `GET/PUT /api/student/profile` (`require_student`) |
| **Student Application Tracker** | ❌ | ✅ (Own) | ❌ | `GET/POST/PATCH/DELETE /api/student/applications` |
| **Deadlines & Alerts Engine** | ❌ | ✅ (Own) | ❌ | `GET /api/student/notifications` (`require_student`) |
| **View Evaluation History** | ❌ | ✅ (Own) | ✅ (All Audits) | `GET /api/student/my-evaluations` / `/api/admin/evaluations` |
| **Rule Engine Simulation** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/rule-test` (`require_admin`) |
| **Backward Chaining Deduction** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/backward-chaining` (`require_admin`) |
| **Pre-Flight Rule Validation** | ❌ | ❌ (403) | ✅ | `POST /api/admin/rules/validate` (`require_admin`) |
| **BFS Knowledge Traversal** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/bfs` (`require_admin`) |
| **DFS Decision Tree Search** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/dfs` (`require_admin`) |
| **Hill Climbing Optimization** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/hill-climbing` (`require_admin`) |
| **A\* Task Roadmap Planning** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/astar` (`require_admin`) |
| **Benchmark & Test Suite** | ❌ | ❌ (403) | ✅ | `POST /api/algorithms/test-suite` (`require_admin`) |
| **Scheme CRUD & Soft-Archive** | ❌ | ❌ (403) | ✅ | `/api/schemes/*` & `/api/schemes/{id}/archive` |
| **Scheme Re-evaluation Trigger** | ❌ | ❌ (403) | ✅ | `POST /api/admin/schemes/{id}/recalculate` |
| **System Analytics & Metrics** | ❌ | ❌ (403) | ✅ | `GET /api/admin/stats` (`require_admin`) |

---

## 🧠 The Classical AI Algorithms (Admin Only)

All algorithms operate against live SQLite database records with genuine server-side execution traces and step-by-step playback controllers:

### 1. Rule-Based Expert System (Forward & Backward Chaining)
- **Forward Chaining:** Production rule engine matching student input facts against scheme eligibility antecedents via data-driven forward inference.
- **Backward Chaining (Goal-Directed Deduction):** Begins with top goal hypothesis `is_eligible(Student, Scholarship)`. It establishes subgoals for each condition, verifies working memory facts, produces a goal stack trace, and assigns definitive proof statuses:
  - `PROVEN`: All criteria satisfied.
  - `REFUTED`: One or more mandatory conditions failed.
  - `UNRESOLVED`: Missing profile facts required for goal proof.
  - `CLOSED_EXPIRED`: Scheme application deadline has passed.
- **Rule Identifier:** Each condition is deterministically assigned a unique rule code `R{scheme_id}_{idx}` (e.g., `R1_1`, `R1_2`).
- **Operators:** Supports `eq`, `neq`, `lte`, `gte`, `lt`, `gt`, `in`, `is_true`, and conditional `when` clauses.
- **Pre-Flight Rule Validation:** Analyzes criteria before saving, detecting contradictory numeric bounds (e.g. `income < 100000` AND `income > 200000`), conflicting equality checks, and duplicate rules.

### 2. Breadth-First Search (BFS)
- **Concept:** Explores the multi-level scholarship knowledge graph level-by-level using a FIFO queue.
- **Hierarchy:** `Root (KB) -> Scope (National/State) -> Category (OBC/SC/Open) -> Education Level -> Scheme Leaves`.
- **Visualizer Features:**
  - Interactive SVG Knowledge Graph with level indicators (L0 to L4).
  - Live FIFO Queue Viewer Ribbon displaying pending frontier nodes (`[Front -> ... -> Rear]`).
  - Active node pulsating glow, traversed edge animations, and node inspector on click.

### 3. Depth-First Search (DFS)
- **Concept:** Explores scholarship decision trees and prerequisite hierarchies using LIFO recursion with explicit backtracking.
- **Decision Tree Structure:**
  - Central condition spine: `Root -> Condition 1 -> Condition 2 -> ... -> Goal (Potential Match)`.
  - Right failure branches: `Fail Leaf 1`, `Fail Leaf 2` for branch boundaries.
- **Visualizer Features:**
  - Interactive SVG Decision Tree Graph matching BFS visual richness.
  - Live LIFO Recursion Stack Ribbon showing active call frames (`[Top -> Depth N -> Bottom]`).
  - Backtracking alerts and animated edge indicators when backtracking occurs.
  - View toggle: Interactive Tree Graph, Decision Cards Flow, or Split View.

### 4. Hill Climbing (Steepest-Ascent DCG Ranking Optimization)
- **Concept:** Local search algorithm that optimizes the presentation order of eligible schemes by exploring adjacent pairwise swaps $(S_i, S_{i+1})$ to maximize Discounted Cumulative Gain (DCG).
- **Objective Function:**
  $$\text{Score}(S) = w_1 \cdot \text{NormalizedAward} + w_2 \cdot \text{Urgency}(\text{DaysLeft}) + w_3 \cdot \text{DocumentReadiness} + w_4 \cdot \text{OfficialStatus}$$
  $$\text{DCG} = \sum_{i=1}^{K} \frac{2^{\text{Score}(S_i)} - 1}{\log_2(i + 1)}$$
- **Visualizer Features:**
  - Interactive optimization landscape timeline showing initial, candidate, and peak score progression.
  - Candidate Swap Inspector showing chosen swap vs rejected worse alternatives.
  - Real-time weight tuning sliders for $w_1$ (Award), $w_2$ (Deadline), $w_3$ (Documents), $w_4$ (Government Authority).
  - Side-by-side comparison with a baseline Greedy Sort (showing DCG delta and swap count).

### 5. A* Search (Application Task Planning)
- **Concept:** Computes the provably optimal, lowest-effort sequence of preparatory tasks (T1 to T7) needed to submit a verified application before the deadline.
- **Evaluation Function:**
  $$f(n) = g(n) + h(n)$$
  - $g(n)$: Cumulative effort expended across completed tasks (hours).
  - $h(n)$: Admissible heuristic calculating the remaining mandatory task effort ($h(n) \le h^*(n)$).
- **Visualizer Features:**
  - Application Workflow Stages graph (T1 Profile to T7 Receipt) with prerequisite dependency validation.
  - Live Min-Heap Priority Queue (Open Set) inspectable at every planning step.
  - Detailed $f(n) = g(n) + h(n)$ cost breakdown card.
  - Detection of missing certificate bottlenecks and expired application deadlines.

---

## 📊 Algorithmic Complexity Comparison

| Algorithm | State Space Representation | Time Complexity | Space Complexity | Optimality Guarantee | Completeness |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rule-Based Forward** | Flat Rule Base (Antecedent $\to$ Consequent) | $O(R \cdot C)$ | $O(F)$ | Deterministic | Yes (Finite Rules) |
| **Rule-Based Backward** | Goal Decomposition & Working Memory Proof | $O(G \cdot C)$ | $O(D)$ Goal Stack | Goal Proof | Yes (Finite Rules) |
| **BFS Knowledge Traversal** | Hierarchical Knowledge Graph | $O(V + E)$ | $O(V)$ | Shortest Path (Unit Weights) | Yes (Finite Graph) |
| **DFS Decision Tree** | Condition Decision Tree | $O(V + E)$ | $O(d)$ | Not Guaranteed | Yes (No Cycles) |
| **Hill Climbing Ranking** | Permutation Space ($N!$ orderings) | $O(I \cdot N)$ | $O(N)$ | Local Optimum (Greedy) | No (Plateaus/Peaks) |
| **A\* Task Planner** | State-Space Transition Graph | $O(b^d)$ worst, $O(d)$ best | $O(b^d)$ | Optimal (with Admissible $h$) | Yes (Finite Costs) |

*Notation: $R$ = rules, $C$ = conditions per rule, $F$ = facts, $G$ = goals, $D$ = goal depth, $V$ = vertices, $E$ = edges, $d$ = tree depth, $b$ = branching factor, $I$ = iterations, $N$ = candidate schemes.*

---

## 🧪 10 Repeatable Academic Test Cases (TC01 – TC10)

Accessible in the **Benchmark & Test Suite** tab inside the Admin AI Control Center:

| Test ID | Test Name | Target Profile | Primary Evaluation Focus | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Full Match OBC Scholar | OBC, ₹1.2L, 82%, MH Domicile | Validates all mandatory premises pass | **PASS** (Potential Match) |
| **TC02** | Income Boundary Rejection | OBC, ₹1.51L, 85%, MH Domicile | Validates exact threshold boundary failure | **PASS** (Ineligible: Income) |
| **TC03** | Domicile Mismatch Rejection | OBC, ₹1.0L, 80%, UP Domicile | Validates prerequisite geographic filter | **PASS** (Ineligible: Domicile) |
| **TC04** | Category Mismatch Rejection | SC, ₹1.0L, 78%, MH Domicile | Validates category predicate filtering | **PASS** (Ineligible: Category) |
| **TC05** | Missing Input Fact Detection | OBC, ₹1.0L, NULL Marks | Validates 3-valued logic (Needs Info) | **PASS** (Needs Information) |
| **TC06** | Conditional When Branch | Professional Engineering, CAP Allotment | Validates conditional branch evaluation | **PASS** (CAP Evaluated) |
| **TC07** | BFS Multi-Level Traversal | Full Knowledge Graph | Validates FIFO order & level grouping | **PASS** (Discovered Leaves) |
| **TC08** | DFS Recursion & Backtrack | Multi-criteria scheme | Validates LIFO stack & backtrack events | **PASS** (Backtracks Logged) |
| **TC09** | Hill Climbing DCG Ascent | 3 Eligible Schemes | Validates $\Delta \text{DCG} \ge 0$ & local peak | **PASS** (DCG Monotonic) |
| **TC10** | A* Admissible Roadmap | Target Scheme with missing documents | Validates $f(n)=g(n)+h(n)$ & path | **PASS** (Optimal Plan) |

---

## 🎓 Viva Voce & Oral Defense Guide

Common examination questions and authoritative responses:

### Q1: Why use an Expert System rather than a Machine Learning model for scholarship eligibility?
> **Answer:** Scholarship eligibility is governed by statutory, legally binding rules published in government circulars (e.g., income cutoffs, domicile mandates, caste categories). Machine learning models are probabilistic, susceptible to statistical bias, and produce hallucinations or unexplainable black-box decisions. In contrast, an Expert System provides 100% deterministic, audit-compliant, and mathematically explainable inferences where every rejection is traceable to an exact rule violation.

### Q2: What is the difference between Forward Chaining and Backward Chaining?
> **Answer:**
> - **Forward Chaining** is data-driven: it starts with known student facts in working memory and fires rules whose conditions match, deriving all matching scholarships.
> - **Backward Chaining** is goal-driven: it starts with the hypothesis `is_eligible(Student, Scholarship)` and works backwards, decomposing it into subgoals. It checks whether facts satisfy each prerequisite, identifying the exact missing or failing facts needed to prove the goal.

### Q3: What is the difference between BFS and DFS in this application?
> **Answer:** 
> - **BFS** explores the catalog *breadth-wise* level-by-level using a FIFO queue. It systematically categorizes schemes by jurisdiction, category, and level, guaranteeing discovery of schemes at the shallowest hierarchy depth.
> - **DFS** explores *depth-wise* down specific condition pathways using a LIFO recursion stack. When a branch fails or reaches a leaf, it triggers backtracking to explore alternatives. DFS requires less memory ($O(d)$ vs $O(b^d)$).

### Q4: Why is Hill Climbing used for scheme ranking rather than simple sorting?
> **Answer:** Simple sorting only considers an isolated attribute (e.g., award amount). However, student utility is multi-criteria, involving award value, approaching deadlines, and document availability. Hill Climbing optimizes the overall Discounted Cumulative Gain (DCG) of the recommendation list through iterative local swaps, trading off multiple weighted factors without needing exhaustive $O(N!)$ combinatorial search.

### Q5: How is the heuristic $h(n)$ in the A* Planner formulated, and is it admissible?
> **Answer:** The heuristic $h(n)$ estimates the remaining effort (in hours) to reach the application submission goal. It sums the base effort of all mandatory prerequisite tasks that have not yet been completed. Since it never overestimates the actual cost to complete these known remaining tasks ($h(n) \le h^*(n)$), the heuristic is strictly **admissible**, guaranteeing that the reconstructed plan is provably optimal.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Plain Vanilla CSS (no TailwindCSS), Lucide React Icons.
- **Backend:** Python 3.13 / 3.11+, FastAPI, SQLAlchemy, Argon2-cffi, PyJWT.
- **Database:** SQLite with foreign keys enforced (`PRAGMA foreign_keys = ON;`) and safe auto-migrations (`auto_migrate`).
- **Testing:** Pytest, AnyIO, FastAPI TestClient (41 automated tests, 100% pass rate).

---

## 🚀 Quickstart Guide (Windows PowerShell)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### 1. Set Up Backend

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Install dependencies
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Bootstrap database and create admin account
.\.venv\Scripts\python.exe create_admin.py

# Launch FastAPI server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- **Backend API:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`

### 2. Set Up Frontend

Open a **separate PowerShell window**:

```powershell
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

- **Frontend Portal:** `http://127.0.0.1:5173`

---

## 🔑 Default Credentials

| Role | Email | Password | Access URL |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@scholarshipexpert.org` | `AdminPass2026!` | `/admin/login` |
| **Student** | Self-register or use test account | `Password123!` | `/student/login` |

---

## 🧪 Automated Testing

Run the full pytest suite from the `backend` folder:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests -v
```

All 41 tests execute and pass:
- `tests/test_algorithms.py`: BFS, DFS, Hill Climbing, A* Search Planner, Benchmark comparator, and 10 Academic Test Cases.
- `tests/test_api.py`: Public endpoints, student endpoints, Application Tracker lifecycle, cross-student isolation, notifications, admin backward chaining, scheme archiving, recalculation, and admin RBAC enforcement.
- `tests/test_auth.py`: Token generation, Argon2id hashing, and 403 Forbidden checks.
- `tests/test_engine.py`: Forward-chaining expert system, backward-chaining goal proof, rule validation (contradictions/duplicates), and expired deadlines.

---

## 📄 Export & Audit Capabilities

From the Admin AI Control Center, examiners and administrators can export complete session audits:
1. **JSON Audit Log:** Full raw execution trace, including timestamps, graph structures, queue snapshots, and candidate deltas.
2. **CSV Schemes Export:** Tabular export of scheme evaluations, criteria fulfillment, and DCG scores.
3. **Printable Viva Summary:** Formal, print-formatted academic report suitable for examination portfolios.

---

## 🛡️ Academic Notice

This project was developed as a rigorous academic and practical demonstration of **Classical Symbolic Artificial Intelligence** in Expert Systems. Always verify formal scheme rules directly with the publishing government department before submitting binding scholarship applications.
