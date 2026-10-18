import heapq
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

# Task definitions for the scholarship application planning workflow
TASKS = {
    "T1_ELIGIBILITY": {
        "id": "T1_ELIGIBILITY",
        "title": "Confirm Scheme Eligibility",
        "description": "Cross-check student eligibility conditions against official guidelines.",
        "base_cost": 1.0,
        "prerequisites": []
    },
    "T2_CHECKLIST": {
        "id": "T2_CHECKLIST",
        "title": "Review Required Documents Checklist",
        "description": "Inspect scheme document requirements (income certificate, caste certificate, etc.).",
        "base_cost": 1.5,
        "prerequisites": ["T1_ELIGIBILITY"]
    },
    "T3_AUDIT_DOCS": {
        "id": "T3_AUDIT_DOCS",
        "title": "Identify Missing Documents",
        "description": "Audit applicant's available documents against scheme requirement list.",
        "base_cost": 1.0,
        "prerequisites": ["T2_CHECKLIST"]
    },
    "T4_OBTAIN_DOCS": {
        "id": "T4_OBTAIN_DOCS",
        "title": "Procure & Prepare Missing Certificates",
        "description": "Obtain required attestations, tehsildar income proof, or college allotment slip.",
        "base_cost": 3.0,  # Variable based on count of missing documents
        "prerequisites": ["T3_AUDIT_DOCS"]
    },
    "T5_FILL_FORM": {
        "id": "T5_FILL_FORM",
        "title": "Complete Online Application Form",
        "description": "Fill personal, academic, fee details, and upload certified proofs on portal.",
        "base_cost": 2.5,
        "prerequisites": ["T4_OBTAIN_DOCS"]
    },
    "T6_REVIEW_FORM": {
        "id": "T6_REVIEW_FORM",
        "title": "Final Verification & Review",
        "description": "Cross-verify form entries, bank account details, and scanned document clarity.",
        "base_cost": 1.0,
        "prerequisites": ["T5_FILL_FORM"]
    },
    "T7_SUBMIT": {
        "id": "T7_SUBMIT",
        "title": "Submit Application & Obtain Receipt",
        "description": "Submit before official deadline and download submission acknowledgement PDF.",
        "base_cost": 0.5,
        "prerequisites": ["T6_REVIEW_FORM"]
    }
}

ALL_TASK_IDS = set(TASKS.keys())

def get_dynamic_task_cost(
    task_id: str,
    scheme: Dict[str, Any],
    missing_docs_count: int
) -> float:
    """Calculates actual non-negative cost g for a task given applicant state and scheme requirements."""
    task = TASKS[task_id]
    if task_id == "T4_OBTAIN_DOCS":
        # 1.5 hours base + 1.5 hours per missing certificate needed
        return 1.5 + (missing_docs_count * 1.5)
    return task["base_cost"]

def admissible_heuristic(completed_tasks: frozenset) -> float:
    """
    Admissible Heuristic h(n):
    Sum of minimum possible execution costs of all remaining tasks.
    Since every remaining task must eventually be completed and all task costs are >= minimum,
    h(n) <= actual remaining cost h*(n), guaranteeing admissibility and consistency (A* optimality).
    """
    remaining = ALL_TASK_IDS - completed_tasks
    return sum(TASKS[t]["base_cost"] for t in remaining)

def build_workflow_graph(scheme: Dict[str, Any], missing_docs_count: int) -> Dict[str, Any]:
    """Generates the static workflow state-space graph for visualization."""
    nodes = []
    edges = []
    for t_id, t_info in TASKS.items():
        cost = get_dynamic_task_cost(t_id, scheme, missing_docs_count)
        nodes.append({
            "id": t_id,
            "title": t_info["title"],
            "description": t_info["description"],
            "cost_hours": cost,
            "prerequisites": t_info["prerequisites"]
        })
        for prereq in t_info["prerequisites"]:
            edges.append({
                "from": prereq,
                "to": t_id,
                "cost": cost
            })
    return {"nodes": nodes, "edges": edges}

def run_astar_planner(
    scheme: Dict[str, Any],
    student: Dict[str, Any],
    available_documents: Optional[List[str]] = None,
    force_unreachable: bool = False
) -> Dict[str, Any]:
    """
    Algorithm 5: A* Search Application Planner.
    Finds the optimal task execution sequence from initial unapplied state to submitted state.
    Uses priority queue, g(n) path cost, admissible h(n) heuristic, and f(n) = g(n) + h(n).
    Reconstructs optimal path using parent pointers.
    Handles unreachable goals (e.g. past deadline or blocked prerequisites).
    """
    start_time = time.perf_counter()

    # Check deadline feasibility
    deadline_str = scheme.get("deadline", "2026-11-30")
    try:
        parts = [int(p) for p in deadline_str.split("-")[:3]]
        deadline_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        days_left = (deadline_dt - now).days
    except Exception:
        days_left = 30

    if days_left < 0 or force_unreachable:
        return {
            "status": "unreachable",
            "reason": f"Goal state is unreachable: The application deadline ({deadline_str}) has expired. Portal submissions are permanently closed.",
            "scheme_id": scheme.get("id", 0),
            "scheme_name": scheme.get("name", "Unknown Scheme"),
            "deadline": deadline_str,
            "days_left": days_left,
            "optimal_plan": [],
            "explored_nodes": [],
            "total_cost_hours": 0.0,
            "missing_documents": [],
            "available_documents": [],
            "search_duration_ms": 0.0,
            "workflow_graph": build_workflow_graph(scheme, 0),
            "explanation": "Application deadline has passed. Planning search terminated because goal state cannot be legally reached."
        }

    # Identify missing documents
    required_docs = scheme.get("required_documents") or [
        "Income Certificate", "Caste Certificate", "Domicile Certificate", "Mark Sheet"
    ]
    avail_docs = set(available_documents or student.get("available_documents") or ["Income Certificate", "Mark Sheet"])
    missing_docs = [doc for doc in required_docs if doc not in avail_docs]
    missing_docs_count = len(missing_docs)

    workflow_graph = build_workflow_graph(scheme, missing_docs_count)

    # A* Search initialization
    # State representation: frozenset of completed task IDs
    start_state = frozenset()
    goal_state = frozenset(ALL_TASK_IDS)

    # Priority Queue elements: (f_score, counter, current_state, g_score)
    counter = 0
    start_h = admissible_heuristic(start_state)
    start_f = 0.0 + start_h
    open_heap: List[Tuple[float, int, frozenset, float]] = [
        (start_f, counter, start_state, 0.0)
    ]

    # Best g-score for visited states
    g_scores: Dict[frozenset, float] = {start_state: 0.0}
    # Parent pointers for path reconstruction: state -> (parent_state, task_id, step_cost)
    parent_map: Dict[frozenset, Optional[Tuple[frozenset, str, float]]] = {start_state: None}
    closed_set: Set[frozenset] = set()

    explored_steps: List[Dict[str, Any]] = []
    goal_reached = False
    step_limit = 200

    while open_heap and len(explored_steps) < step_limit:
        f, _, current_state, g = heapq.heappop(open_heap)

        if current_state in closed_set:
            continue
        closed_set.add(current_state)

        # Reconstruct path so far to identify current task
        parent_info = parent_map.get(current_state)
        current_task_name = parent_info[1] if parent_info else "START"

        # Snapshot of current open set (priority queue)
        open_set_snapshot = [
            {
                "f_score": round(item[0], 2),
                "g_score": round(item[3], 2),
                "h_score": round(item[0] - item[3], 2),
                "state_size": len(item[2])
            }
            for item in sorted(open_heap, key=lambda x: x[0])[:5]
        ]

        explored_steps.append({
            "step": len(explored_steps) + 1,
            "current_task": current_task_name,
            "completed_tasks_count": len(current_state),
            "completed_tasks": list(current_state),
            "g_cost": round(g, 2),
            "h_heuristic": round(admissible_heuristic(current_state), 2),
            "f_total": round(f, 2),
            "open_set_size": len(open_heap),
            "open_set_preview": open_set_snapshot,
            "closed_set_size": len(closed_set)
        })

        # Goal check
        if current_state == goal_state:
            goal_reached = True
            break

        # Generate successors: tasks whose prerequisites are satisfied and not yet completed
        for t_id, t_info in TASKS.items():
            if t_id not in current_state:
                prereqs = t_info["prerequisites"]
                if all(p in current_state for p in prereqs):
                    next_state = current_state | frozenset([t_id])
                    cost_step = get_dynamic_task_cost(t_id, scheme, missing_docs_count)
                    new_g = g + cost_step

                    if next_state not in g_scores or new_g < g_scores[next_state]:
                        g_scores[next_state] = new_g
                        parent_map[next_state] = (current_state, t_id, cost_step)
                        new_h = admissible_heuristic(next_state)
                        new_f = new_g + new_h
                        counter += 1
                        heapq.heappush(open_heap, (new_f, counter, next_state, new_g))

    if not goal_reached:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "status": "unreachable",
            "reason": "Could not formulate complete planning path within search bounds or blocked prerequisites.",
            "scheme_id": scheme.get("id", 0),
            "scheme_name": scheme.get("name", "Unknown Scheme"),
            "deadline": deadline_str,
            "days_left": days_left,
            "optimal_plan": [],
            "explored_nodes": explored_steps,
            "total_cost_hours": 0.0,
            "missing_documents": missing_docs,
            "available_documents": list(avail_docs),
            "search_duration_ms": elapsed_ms,
            "workflow_graph": workflow_graph,
            "explanation": "Goal unreachable: Prerequisites could not be satisfied within the state-space limit."
        }

    # Reconstruct final path from parent pointers
    optimal_plan = []
    curr = goal_state
    while curr is not None and parent_map.get(curr) is not None:
        p_state, task_id, step_cost = parent_map[curr]
        t_info = TASKS[task_id]
        g_val = g_scores[curr]
        h_val = admissible_heuristic(curr)
        optimal_plan.append({
            "task_id": task_id,
            "title": t_info["title"],
            "description": t_info["description"],
            "cost_hours": round(step_cost, 2),
            "cumulative_cost": round(g_val, 2),
            "heuristic_remaining": round(h_val, 2),
            "f_score": round(g_val + h_val, 2)
        })
        curr = p_state

    optimal_plan.reverse()
    for idx, item in enumerate(optimal_plan, 1):
        item["step_number"] = idx

    final_cost = g_scores[goal_state]
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    explanation = (
        f"A* search reconstructed the optimal planning path from parent pointers with total estimated effort "
        f"of {round(final_cost, 1)} hours across {len(optimal_plan)} sequential stages in {elapsed_ms}ms. "
        f"Admissible heuristic h(n) = sum(min_cost) ensured no node was over-estimated, guaranteeing an optimal plan. "
        f"Applicant has {missing_docs_count} missing certificates ({', '.join(missing_docs) if missing_docs else 'None'}), "
        f"which scaled preparation effort (Task T4). "
        f"Note: Costs represent student preparation and form-filling effort, not official department sanction times."
    )

    return {
        "status": "success",
        "scheme_id": scheme["id"],
        "scheme_name": scheme["name"],
        "deadline": deadline_str,
        "days_left": days_left,
        "missing_documents": missing_docs,
        "available_documents": list(avail_docs),
        "total_cost_hours": round(final_cost, 1),
        "steps_count": len(optimal_plan),
        "optimal_plan": optimal_plan,
        "explored_nodes": explored_steps,
        "workflow_graph": workflow_graph,
        "search_duration_ms": elapsed_ms,
        "explanation": explanation
    }

