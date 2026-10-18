import time
from typing import Any, Dict, List, Optional, Set, Tuple
from .engine import compare

def build_scheme_decision_tree(scheme: Dict[str, Any]) -> Dict[str, Any]:
    """
    Constructs a decision tree representing the scheme's condition evaluation pathways.
    Branches on condition outcomes and conditional rules (e.g. professional vs non-professional).
    """
    nodes: Dict[str, Dict[str, Any]] = {}
    edges: List[Dict[str, str]] = []
    criteria = scheme.get("criteria", [])
    
    root_id = "dt_root"
    nodes[root_id] = {
        "id": root_id,
        "label": f"Start Evaluation: {scheme['name']}",
        "type": "root",
        "depth": 0
    }

    current_parent = root_id
    tree_edges: List[Dict[str, str]] = []

    for idx, c in enumerate(criteria, 1):
        cond_id = f"dt_cond_{idx}"
        pass_leaf = f"dt_pass_{idx}"
        fail_leaf = f"dt_fail_{idx}"
        
        nodes[cond_id] = {
            "id": cond_id,
            "label": f"Rule {idx}: {c.get('message', c['field'])}",
            "type": "condition",
            "field": c["field"],
            "operator": c["operator"],
            "expected": c.get("value"),
            "required": c.get("required", True),
            "when": c.get("when"),
            "depth": idx
        }
        tree_edges.append({"from": current_parent, "to": cond_id, "label": "next"})
        
        # Outcome branches
        nodes[fail_leaf] = {
            "id": fail_leaf,
            "label": f"Rule {idx} Fails (Ineligible Branch)",
            "type": "terminal_fail",
            "depth": idx + 1
        }
        tree_edges.append({"from": cond_id, "to": fail_leaf, "label": "fails"})
        
        current_parent = cond_id

    goal_id = "dt_goal"
    nodes[goal_id] = {
        "id": goal_id,
        "label": "All Conditions Satisfied (Potential Match)",
        "type": "terminal_success",
        "depth": len(criteria) + 1
    }
    tree_edges.append({"from": current_parent, "to": goal_id, "label": "passes"})

    # Build adjacency list
    adj: Dict[str, List[str]] = {n_id: [] for n_id in nodes}
    for e in tree_edges:
        adj[e["from"]].append(e["to"])

    return {"nodes": nodes, "edges": tree_edges, "adj": adj, "root_id": root_id}

def run_dfs(scheme: Dict[str, Any], student: Dict[str, Any]) -> Dict[str, Any]:
    """
    Algorithm 3: Depth-First Search (DFS) for exploring scholarship decision trees.
    Traverses condition branches with a visited set, records the exploration order,
    tracks backtracking upon reaching branch boundaries, and identifies the exact
    path taken by the student's profile.
    """
    start_time = time.perf_counter()
    dt = build_scheme_decision_tree(scheme)
    nodes = dt["nodes"]
    adj = dt["adj"]
    root_id = dt["root_id"]

    visited: Set[str] = set()
    recursion_stack: List[str] = []
    traversal_order: List[str] = []
    backtracks: List[Dict[str, str]] = []
    steps: List[Dict[str, Any]] = []
    path_taken: List[str] = [root_id]
    rule_evaluations: List[Dict[str, Any]] = []

    step_counter = 0
    max_stack_depth = 0
    edges_examined = 0

    def dfs_explore(u: str, parent: Optional[str] = None):
        nonlocal step_counter, max_stack_depth, edges_examined
        step_counter += 1
        visited.add(u)
        recursion_stack.append(u)
        traversal_order.append(u)

        if len(recursion_stack) > max_stack_depth:
            max_stack_depth = len(recursion_stack)

        node_info = nodes.get(u, {})
        steps.append({
            "step": step_counter,
            "action": f"Visited node '{node_info.get('label')}' (Depth {len(recursion_stack)} in stack)",
            "current_node": u,
            "node_type": node_info.get("type"),
            "parent": parent,
            "stack": list(recursion_stack),
            "stack_depth": len(recursion_stack),
            "visited_count": len(visited),
            "backtrack": False
        })

        # Evaluate condition if this is a condition node
        if node_info.get("type") == "condition":
            field = node_info.get("field")
            actual = student.get(field)
            op = node_info.get("operator")
            exp = node_info.get("expected")
            
            # Check conditional 'when'
            when_clause = node_info.get("when")
            applicable = True
            if when_clause:
                w_val = student.get(when_clause.get("field"))
                applicable = (w_val is not None and compare(w_val, when_clause.get("operator", "eq"), when_clause.get("value")))

            is_satisfied = False
            if not applicable:
                is_satisfied = True
                status_str = "Skipped (precondition not met)"
            elif actual is None:
                is_satisfied = not node_info.get("required", True)
                status_str = "Missing input"
            else:
                try:
                    is_satisfied = compare(actual, op, exp)
                    status_str = "Satisfied" if is_satisfied else "Violated"
                except Exception:
                    is_satisfied = False
                    status_str = "Evaluation error"

            rule_evaluations.append({
                "node_id": u,
                "field": field,
                "actual": actual,
                "expected": exp,
                "satisfied": is_satisfied,
                "status": status_str
            })

            if is_satisfied:
                path_taken.append(u)

        children = adj.get(u, [])
        for v in children:
            edges_examined += 1
            if v not in visited:
                dfs_explore(v, u)
                # When child exploration completes, backtrack to current
                step_counter += 1
                backtracks.append({"from": v, "to": u})
                steps.append({
                    "step": step_counter,
                    "action": f"Backtracking from '{nodes.get(v, {}).get('label')}' to '{node_info.get('label')}'",
                    "current_node": u,
                    "stack": list(recursion_stack),
                    "stack_depth": len(recursion_stack),
                    "visited_count": len(visited),
                    "backtrack": True
                })

        recursion_stack.pop()

    dfs_explore(root_id, None)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    failed_evals = [r for r in rule_evaluations if not r["satisfied"]]
    if failed_evals:
        overall_result = f"Ineligible (failed {len(failed_evals)} rule branch{'es' if len(failed_evals) > 1 else ''})"
    else:
        overall_result = "Potential Match (all explored condition branches satisfied)"

    explanation = (
        f"DFS systematically explored the scheme decision tree in depth-first order, "
        f"visiting {len(visited)} nodes, examining {edges_examined} edges, and recording {len(backtracks)} backtrack actions in {elapsed_ms}ms. "
        f"Maximum recursion stack depth reached was {max_stack_depth}. "
        f"DFS shows the sequential path of condition evaluations and alternatives. "
        f"Note: Final authoritative status ({overall_result}) is verified across all mandatory conditions."
    )

    return {
        "scheme_id": scheme["id"],
        "scheme_name": scheme["name"],
        "traversal_order": traversal_order,
        "path_taken": path_taken,
        "backtracks": backtracks,
        "steps": steps,
        "rule_evaluations": rule_evaluations,
        "tree_nodes": list(nodes.values()),
        "tree_edges": dt["edges"],
        "total_nodes_visited": len(visited),
        "edges_examined": edges_examined,
        "max_stack_depth": max_stack_depth,
        "traversal_duration_ms": elapsed_ms,
        "overall_result": overall_result,
        "explanation": explanation
    }

def run_dfs_graph(custom_graph: Dict[str, Any], start_node: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes general Depth-First Search on an arbitrary graph (e.g. for benchmarking or test fixtures).
    Prevents infinite loops on cycles using visited set and recursion stack.
    """
    start_time = time.perf_counter()
    graph = custom_graph["graph"]
    node_metadata = custom_graph["nodes"]

    root_id = start_node or "node:root"
    if root_id not in graph and graph:
        root_id = next(iter(graph.keys()))

    if not graph or root_id not in graph:
        return {
            "traversal_order": [],
            "steps": [],
            "total_nodes_visited": 0,
            "edges_examined": 0,
            "max_stack_depth": 0,
            "backtracks_count": 0,
            "traversal_duration_ms": 0.0,
            "explanation": "Graph is empty."
        }

    visited: Set[str] = set()
    stack: List[str] = []
    traversal_order: List[str] = []
    steps: List[Dict[str, Any]] = []
    backtracks: List[Dict[str, str]] = []

    step_counter = 0
    max_stack_depth = 0
    edges_examined = 0

    def explore(u: str, parent: Optional[str] = None):
        nonlocal step_counter, max_stack_depth, edges_examined
        step_counter += 1
        visited.add(u)
        stack.append(u)
        traversal_order.append(u)

        if len(stack) > max_stack_depth:
            max_stack_depth = len(stack)

        curr_label = node_metadata.get(u, {}).get("label", u)
        steps.append({
            "step": step_counter,
            "action": f"DFS visited node '{curr_label}' (Stack depth {len(stack)})",
            "current_node": u,
            "stack": list(stack),
            "stack_depth": len(stack),
            "visited_count": len(visited),
            "backtrack": False
        })

        for v in graph.get(u, []):
            edges_examined += 1
            if v not in visited:
                explore(v, u)
                step_counter += 1
                backtracks.append({"from": v, "to": u})
                steps.append({
                    "step": step_counter,
                    "action": f"Backtracking from '{node_metadata.get(v, {}).get('label', v)}' to '{curr_label}'",
                    "current_node": u,
                    "stack": list(stack),
                    "stack_depth": len(stack),
                    "visited_count": len(visited),
                    "backtrack": True
                })

        stack.pop()

    explore(root_id, None)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    return {
        "traversal_order": traversal_order,
        "steps": steps,
        "nodes": list(node_metadata.values()),
        "edges": custom_graph.get("edges", []),
        "total_nodes_visited": len(visited),
        "edges_examined": edges_examined,
        "max_stack_depth": max_stack_depth,
        "backtracks_count": len(backtracks),
        "traversal_duration_ms": elapsed_ms,
        "explanation": f"DFS traversed {len(visited)} nodes with {len(backtracks)} backtracks and max stack depth {max_stack_depth} in {elapsed_ms}ms."
    }

