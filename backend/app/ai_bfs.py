import time
from collections import deque
from typing import Any, Dict, List, Optional, Set, Tuple

def build_knowledge_graph(schemes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Constructs an explicit multi-level knowledge graph from active scholarships:
      Level 0: Root ('All Scholarships')
      Level 1: Jurisdictions ('State: Maharashtra', 'Central / All India')
      Level 2: Category buckets ('Category: OBC', 'Category: Merit / Open', etc.)
      Level 3: Education levels ('Post-Matric', 'Higher Education', etc.)
      Level 4: Leaf Scheme Nodes (Scheme #ID: Scheme Name)
    """
    if not schemes:
        return {"graph": {}, "nodes": {}, "edges": [], "available_start_nodes": []}

    graph: Dict[str, List[str]] = {}
    nodes: Dict[str, Dict[str, Any]] = {}
    edges: List[Dict[str, str]] = []

    root_id = "node:root"
    nodes[root_id] = {
        "id": root_id,
        "label": "All Scholarships",
        "type": "root",
        "level": 0
    }
    graph[root_id] = []

    jurisdictions_seen: Set[str] = set()
    categories_seen: Set[str] = set()
    levels_seen: Set[str] = set()

    for scheme in schemes:
        s_id = str(scheme["id"])
        s_state = scheme.get("state") or "All India"
        s_cat = scheme.get("category") or "All"
        s_level = scheme.get("course_level") or "Post-Matric"
        s_name = scheme["name"]

        # Scope node (Level 1)
        jur_id = f"jur:{s_state}"
        if jur_id not in jurisdictions_seen:
            jurisdictions_seen.add(jur_id)
            nodes[jur_id] = {
                "id": jur_id,
                "label": f"Scope: {s_state}",
                "type": "jurisdiction",
                "level": 1,
                "state": s_state
            }
            graph[root_id].append(jur_id)
            edges.append({"from": root_id, "to": jur_id})
            graph[jur_id] = []

        # Category node (Level 2)
        cat_id = f"cat:{s_state}:{s_cat}"
        if cat_id not in categories_seen:
            categories_seen.add(cat_id)
            nodes[cat_id] = {
                "id": cat_id,
                "label": f"Category: {s_cat}",
                "type": "category",
                "level": 2,
                "state": s_state,
                "category": s_cat
            }
            graph[jur_id].append(cat_id)
            edges.append({"from": jur_id, "to": cat_id})
            graph[cat_id] = []

        # Education level node (Level 3)
        edu_id = f"edu:{s_state}:{s_cat}:{s_level}"
        if edu_id not in levels_seen:
            levels_seen.add(edu_id)
            nodes[edu_id] = {
                "id": edu_id,
                "label": f"Level: {s_level}",
                "type": "course_level",
                "level": 3,
                "state": s_state,
                "category": s_cat,
                "course_level": s_level
            }
            graph[cat_id].append(edu_id)
            edges.append({"from": cat_id, "to": edu_id})
            graph[edu_id] = []

        # Leaf scheme node (Level 4)
        leaf_id = f"scheme:{s_id}"
        nodes[leaf_id] = {
            "id": leaf_id,
            "label": s_name,
            "type": "scheme",
            "level": 4,
            "scheme_id": scheme["id"],
            "state": s_state,
            "category": s_cat,
            "course_level": s_level,
            "is_official": scheme.get("is_official", False),
            "award_amount": scheme.get("award_amount", 50000)
        }
        graph[edu_id].append(leaf_id)
        edges.append({"from": edu_id, "to": leaf_id})
        graph[leaf_id] = []

    # Compile available starting nodes for interactive UI selection
    available_start_nodes = []
    for nid, node in nodes.items():
        if node["level"] < 4:
            available_start_nodes.append({
                "id": nid,
                "label": f"[L{node['level']}] {node['label']}",
                "type": node["type"],
                "level": node["level"]
            })
    available_start_nodes.sort(key=lambda x: (x["level"], x["label"]))

    return {
        "graph": graph,
        "nodes": nodes,
        "edges": edges,
        "available_start_nodes": available_start_nodes
    }

def is_node_compatible_with_profile(
    node: Dict[str, Any],
    student_state: str,
    student_category: str,
    course_level: str
) -> Tuple[bool, str]:
    """Evaluates whether a knowledge graph node matches the active student profile facts."""
    ntype = node.get("type")
    if ntype == "root":
        return True, "Root catalog node"

    if ntype == "jurisdiction":
        state = node.get("state", "All India")
        if state.lower() in ["all india", "central", "national", "all"] or state.lower() == student_state.lower():
            return True, f"State scope '{state}' matches applicant domicile '{student_state}'"
        return False, f"Pruned scope '{state}' (does not match applicant domicile '{student_state}')"

    if ntype == "category":
        cat = node.get("category", "All")
        if cat.lower() in ["all", "merit", "open", "general"] or cat.lower() == student_category.lower():
            return True, f"Category '{cat}' matches applicant category '{student_category}'"
        if student_category.lower() == "ews" and cat.lower() in ["open", "ebc", "ews"]:
            return True, f"EWS applicant eligible under category bucket '{cat}'"
        return False, f"Pruned category '{cat}' (does not match applicant category '{student_category}')"

    if ntype == "course_level":
        lvl = node.get("course_level", "Post-Matric")
        if lvl.lower() in ["all", "any"] or lvl.lower() == course_level.lower():
            return True, f"Course level '{lvl}' matches applicant education level '{course_level}'"
        return False, f"Pruned level '{lvl}' (does not match applicant course level '{course_level}')"

    return True, "Reachable leaf node"

def run_bfs(
    schemes: List[Dict[str, Any]],
    start_node_id: Optional[str] = None,
    student_state: str = "Maharashtra",
    student_category: str = "OBC",
    course_level: str = "Post-Matric",
    filter_by_profile: bool = False,
    custom_graph: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes Breadth-First Search (BFS) against the scholarship knowledge graph.
    Explores level-by-level using a FIFO queue to discover eligible schemes.
    Avoids cycles using a visited set and logs each step of execution.
    Supports starting from any node and optional profile-driven branch pruning.
    """
    start_time = time.perf_counter()
    kg = custom_graph if custom_graph else build_knowledge_graph(schemes)
    graph = kg["graph"]
    node_metadata = kg["nodes"]

    root_id = "node:root"
    if start_node_id and start_node_id in graph:
        root_id = start_node_id
    elif root_id not in graph and graph:
        root_id = next(iter(graph.keys()))

    if not graph or root_id not in graph:
        return {
            "start_node_id": root_id,
            "filter_by_profile": filter_by_profile,
            "student_state": student_state,
            "student_category": student_category,
            "course_level": course_level,
            "traversal_order": [],
            "steps": [],
            "discovered_schemes": [],
            "discovered_scheme_ids": [],
            "nodes": [],
            "edges": [],
            "available_start_nodes": [],
            "total_nodes_visited": 0,
            "edges_examined": 0,
            "max_queue_size": 0,
            "traversal_duration_ms": 0.0,
            "parent_map": {},
            "graph": {"graph": {}, "nodes": {}, "edges": [], "available_start_nodes": []},
            "explanation": "Knowledge base graph is empty. No nodes available for traversal."
        }

    queue: deque = deque([root_id])
    visited: Set[str] = {root_id}
    traversal_order: List[str] = []
    steps: List[Dict[str, Any]] = []
    discovered_scheme_ids: List[int] = []
    discovered_schemes: List[Dict[str, Any]] = []
    parent_map: Dict[str, Optional[str]] = {root_id: None}

    edges_examined = 0
    max_queue_size = len(queue)
    step_counter = 1

    root_node_info = node_metadata.get(root_id, {"id": root_id, "label": root_id, "type": "generic", "level": 0})

    # Record initial queue state (Step 1)
    steps.append({
        "step": step_counter,
        "action": f"Initialize FIFO queue with starting node '{root_node_info.get('label', root_id)}' (Level {root_node_info.get('level', 0)}). Mode: {'Profile-Filtered' if filter_by_profile else 'Full Catalog Traversal'}.",
        "current_node": root_id,
        "node_details": root_node_info,
        "newly_enqueued": [root_id],
        "pruned_nodes": [],
        "queue": list(queue),
        "queue_labels": [node_metadata.get(q, {}).get("label", q) for q in queue],
        "queue_details": [
            {
                "id": q,
                "label": node_metadata.get(q, {}).get("label", q),
                "level": node_metadata.get(q, {}).get("level", 0),
                "type": node_metadata.get(q, {}).get("type", "generic")
            }
            for q in queue
        ],
        "queue_size": len(queue),
        "visited_nodes": list(visited),
        "visited_count": len(visited),
        "discovered_scheme_ids": [],
        "discovered_schemes": [],
        "edges_examined": 0,
        "parent": None
    })

    while queue:
        current = queue.popleft()
        traversal_order.append(current)
        curr_node = node_metadata.get(current, {"id": current, "label": current, "type": "generic", "level": 0})

        # If it's a scheme leaf node, record discovery
        if curr_node.get("type") == "scheme":
            s_id = curr_node.get("scheme_id")
            if s_id is not None and s_id not in discovered_scheme_ids:
                discovered_scheme_ids.append(s_id)
                discovered_schemes.append({
                    "id": s_id,
                    "node_id": current,
                    "name": curr_node.get("label"),
                    "state": curr_node.get("state"),
                    "category": curr_node.get("category"),
                    "course_level": curr_node.get("course_level"),
                    "award_amount": curr_node.get("award_amount"),
                    "is_official": curr_node.get("is_official")
                })

        neighbors = graph.get(current, [])
        newly_enqueued = []
        pruned_nodes = []

        for nxt in neighbors:
            edges_examined += 1
            if nxt not in visited:
                nxt_node = node_metadata.get(nxt, {})
                if filter_by_profile:
                    is_ok, reason = is_node_compatible_with_profile(nxt_node, student_state, student_category, course_level)
                    if not is_ok:
                        pruned_nodes.append({"id": nxt, "label": nxt_node.get("label", nxt), "reason": reason})
                        continue

                visited.add(nxt)
                queue.append(nxt)
                newly_enqueued.append(nxt)
                parent_map[nxt] = current

        if len(queue) > max_queue_size:
            max_queue_size = len(queue)

        step_counter += 1
        action_parts = [
            f"Dequeued '{curr_node.get('label', current)}' (Level {curr_node.get('level', '?')}).",
            f"Examined {len(neighbors)} outgoing edges, enqueued {len(newly_enqueued)} unvisited children."
        ]
        if pruned_nodes:
            action_parts.append(f"Pruned {len(pruned_nodes)} non-matching branches ({', '.join(p['label'] for p in pruned_nodes)}).")
        if curr_node.get("type") == "scheme":
            action_parts.append(f"★ Discovered Level 4 Scheme leaf: '{curr_node.get('label')}' (Award ₹{curr_node.get('award_amount', 0):,}).")

        steps.append({
            "step": step_counter,
            "action": " ".join(action_parts),
            "current_node": current,
            "node_details": curr_node,
            "newly_enqueued": newly_enqueued,
            "pruned_nodes": pruned_nodes,
            "queue": list(queue),
            "queue_labels": [node_metadata.get(q, {}).get("label", q) for q in queue],
            "queue_details": [
                {
                    "id": q,
                    "label": node_metadata.get(q, {}).get("label", q),
                    "level": node_metadata.get(q, {}).get("level", 0),
                    "type": node_metadata.get(q, {}).get("type", "generic")
                }
                for q in queue
            ],
            "queue_size": len(queue),
            "visited_nodes": list(visited),
            "visited_count": len(visited),
            "discovered_scheme_ids": list(discovered_scheme_ids),
            "discovered_schemes": list(discovered_schemes),
            "edges_examined": edges_examined,
            "parent": parent_map.get(current)
        })

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    if filter_by_profile:
        explanation = (
            f"BFS executed profile-filtered traversal starting from '{root_node_info.get('label', root_id)}'. "
            f"Pruned incompatible state and social category branches, visited {len(visited)} matching nodes across "
            f"the knowledge hierarchy, examined {edges_examined} edges, and discovered {len(discovered_scheme_ids)} "
            f"candidate schemes matching State='{student_state}', Category='{student_category}', and Level='{course_level}' in {elapsed_ms}ms. "
            f"Peak queue frontier size was {max_queue_size} nodes."
        )
    else:
        explanation = (
            f"BFS fully traversed the scholarship knowledge base graph in level-by-level order (FIFO) starting from '{root_node_info.get('label', root_id)}'. "
            f"Visited {len(visited)} total nodes across 5 hierarchy levels, examined {edges_examined} edges, "
            f"and discovered {len(discovered_scheme_ids)} candidate scheme nodes for rule evaluation in {elapsed_ms}ms. "
            f"Maximum queue memory frontier was {max_queue_size} nodes."
        )

    return {
        "start_node_id": root_id,
        "filter_by_profile": filter_by_profile,
        "student_state": student_state,
        "student_category": student_category,
        "course_level": course_level,
        "traversal_order": traversal_order,
        "steps": steps,
        "discovered_scheme_ids": discovered_scheme_ids,
        "discovered_schemes": discovered_schemes,
        "nodes": list(node_metadata.values()),
        "edges": kg["edges"],
        "available_start_nodes": kg.get("available_start_nodes", []),
        "total_nodes_visited": len(visited),
        "edges_examined": edges_examined,
        "max_queue_size": max_queue_size,
        "traversal_duration_ms": elapsed_ms,
        "parent_map": parent_map,
        "explanation": explanation
    }

