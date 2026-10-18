import math
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_WEIGHTS = {
    "amount": 0.35,        # Financial benefit (award amount)
    "profile_match": 0.25, # Academic & income need alignment
    "deadline": 0.20,      # Application urgency & feasibility window
    "effort": 0.20         # Time & documentation burden
}

def calculate_scheme_utility(
    scheme: Dict[str, Any],
    student: Dict[str, Any],
    weights: Dict[str, float]
) -> Dict[str, Any]:
    """
    Computes normalized multi-factor suitability utility u(s) in [0, 1] for an eligible scheme.
    Missing Data Policy:
      - Award amount: defaults to 0 if None; normalized against ₹1,00,000 benchmark.
      - Academic marks: defaults to neutral 60.0% if missing, never fabricated.
      - Annual income: defaults to 3,00,000 if missing.
      - Deadline: if unparseable, marks as 30-day default window.
      - Effort hours: defaults to 4.0 hours standard.
    """
    # 1. Amount utility (normalized against ₹1,00,000 benchmark)
    raw_amount = scheme.get("award_amount")
    award_amount = raw_amount if raw_amount is not None else 0
    u_amount = min(award_amount / 100000.0, 1.0)

    # 2. Profile match (academic marks + income need)
    raw_marks = student.get("marks_percentage")
    marks = raw_marks if raw_marks is not None else 60.0
    u_marks = min(max(marks / 100.0, 0.0), 1.0)
    
    raw_income = student.get("annual_income")
    income = raw_income if raw_income is not None else 300000
    # Lower income has higher financial need
    u_need = max(0.0, 1.0 - min(income / 800000.0, 1.0))
    u_match = (u_marks * 0.6) + (u_need * 0.4)

    # 3. Deadline feasibility
    deadline_str = scheme.get("deadline", "2026-11-30")
    try:
        parts = [int(p) for p in deadline_str.split("-")[:3]]
        deadline_dt = datetime(parts[0], parts[1], parts[2], tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        days_left = (deadline_dt - now).days
    except Exception:
        days_left = 30

    if days_left < 0:
        u_deadline = 0.05  # Expired or critically overdue
    elif days_left <= 5:
        u_deadline = 0.45  # Extremely tight window
    elif 6 <= days_left <= 45:
        u_deadline = 1.0   # Optimal active window
    else:
        u_deadline = 0.85  # Long timeline

    # 4. Effort efficiency (lower hours = higher utility)
    effort_hours = scheme.get("application_effort_hours") or 4.0
    u_effort = max(0.0, 1.0 - min(effort_hours / 10.0, 1.0))

    # Weighted utility
    total_utility = (
        weights["amount"] * u_amount +
        weights["profile_match"] * u_match +
        weights["deadline"] * u_deadline +
        weights["effort"] * u_effort
    )

    return {
        "scheme_id": scheme["id"],
        "scheme_name": scheme["name"],
        "total_utility": round(total_utility, 4),
        "components": {
            "amount_score": round(u_amount, 3),
            "profile_match_score": round(u_match, 3),
            "deadline_score": round(u_deadline, 3),
            "effort_score": round(u_effort, 3)
        },
        "award_amount": award_amount,
        "deadline": deadline_str,
        "days_left": days_left,
        "effort_hours": effort_hours
    }

def state_ranking_score(state: List[int], utilities: Dict[int, float]) -> float:
    """
    Evaluates the objective function of a ranking permutation.
    Uses Discounted Cumulative Suitability (DCG) where top positions receive highest weight:
    Score = sum( utility(state[i]) / log2(i + 2) )
    """
    total = 0.0
    for i, s_id in enumerate(state):
        u = utilities.get(s_id, 0.0)
        discount = math.log2(i + 2)
        total += u / discount
    return total

def run_hill_climbing(
    eligible_schemes: List[Dict[str, Any]],
    student: Dict[str, Any],
    custom_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Algorithm 4: Steepest-Ascent Hill Climbing to optimize ranking of eligible scholarships.
    Enforces precondition: Ineligible schemes are filtered out before optimization.
    Search state: Ordering permutation of eligible schemes.
    Neighborhood: Adjacent transpositions (swaps of items at i and i+1).
    Terminates when no neighbor improves the discounted suitability score.
    """
    start_time = time.perf_counter()
    weights = DEFAULT_WEIGHTS.copy()
    if custom_weights:
        weights.update(custom_weights)

    if not eligible_schemes:
        return {
            "status": "empty",
            "message": "No eligible scholarships to rank. Applicant failed mandatory conditions or none evaluated.",
            "steps": [],
            "final_ranking": [],
            "baseline_ranking": [],
            "weights": weights,
            "total_iterations": 0,
            "total_neighbors_evaluated": 0,
            "initial_score": 0.0,
            "final_score": 0.0,
            "improvement_achieved": 0.0,
            "improvement_percentage": 0.0,
            "termination_reason": "No eligible candidate schemes to optimize.",
            "execution_duration_ms": 0.0,
            "explanation": "No eligible schemes found for this student profile to rank."
        }

    # Pre-calculate utility for each eligible scheme
    scheme_map = {s["id"]: s for s in eligible_schemes}
    scheme_evals = {
        s["id"]: calculate_scheme_utility(s, student, weights)
        for s in eligible_schemes
    }
    utilities = {s_id: data["total_utility"] for s_id, data in scheme_evals.items()}

    # Baseline: Simple greedy sort by utility descending
    sorted_baseline_ids = sorted(utilities.keys(), key=lambda x: utilities[x], reverse=True)
    baseline_score = state_ranking_score(sorted_baseline_ids, utilities)
    baseline_ranking = [
        {**scheme_evals[s_id], "rank": idx + 1}
        for idx, s_id in enumerate(sorted_baseline_ids)
    ]

    # Initial state: Arbitrary / reverse / arrival order to demonstrate optimization search
    initial_state = list(reversed(sorted_baseline_ids)) if len(sorted_baseline_ids) > 1 else list(sorted_baseline_ids)
    current_state = list(initial_state)
    current_score = state_ranking_score(current_state, utilities)

    steps: List[Dict[str, Any]] = []
    iteration = 0
    max_iterations = 50
    total_neighbors_evaluated = 0

    steps.append({
        "iteration": 0,
        "action": "Initial Candidate State generated (Reverse/Arrival Order)",
        "state": list(current_state),
        "state_names": [scheme_map[sid]["name"] for sid in current_state],
        "score": round(current_score, 4),
        "improved": False,
        "terminated": len(current_state) <= 1,
        "chosen_swap": None,
        "rejected_neighbors": []
    })

    termination_reason = "Local optimum reached"

    while iteration < max_iterations and len(current_state) > 1:
        iteration += 1
        best_neighbor = None
        best_neighbor_score = current_score
        best_swap = None
        neighbors_evaluated = []
        rejected_neighbors = []

        # Generate neighborhood: adjacent swaps
        for i in range(len(current_state) - 1):
            total_neighbors_evaluated += 1
            neighbor = list(current_state)
            neighbor[i], neighbor[i + 1] = neighbor[i + 1], neighbor[i]
            n_score = state_ranking_score(neighbor, utilities)
            delta = n_score - current_score

            n_record = {
                "swap_indices": [i, i + 1],
                "swapped_names": [scheme_map[current_state[i]]["name"], scheme_map[current_state[i + 1]]["name"]],
                "score": round(n_score, 4),
                "delta": round(delta, 4)
            }
            neighbors_evaluated.append(n_record)

            if n_score > best_neighbor_score + 1e-6:
                if best_neighbor is not None:
                    # Previous best is now rejected
                    rejected_neighbors.append({
                        "swapped_names": [scheme_map[current_state[best_swap[0]]]["name"], scheme_map[current_state[best_swap[1]]]["name"]],
                        "score": round(best_neighbor_score, 4),
                        "reason": f"Superseded by higher climbing swap (+{round(delta, 4)})"
                    })
                best_neighbor_score = n_score
                best_neighbor = neighbor
                best_swap = (i, i + 1)
            else:
                rejected_neighbors.append({
                    "swapped_names": n_record["swapped_names"],
                    "score": round(n_score, 4),
                    "reason": "Lower or equal objective score than current state" if delta <= 0 else "Lower climb than best neighbor"
                })

        # If no neighbor strictly improves the objective function, we have peaked
        if best_neighbor is None or best_neighbor_score <= current_score + 1e-6:
            termination_reason = f"Peak reached at iteration {iteration}: No neighboring transposition yields positive gradient."
            steps.append({
                "iteration": iteration,
                "action": f"Local optimum reached at iteration {iteration}. No adjacent swap improves objective score.",
                "state": list(current_state),
                "state_names": [scheme_map[sid]["name"] for sid in current_state],
                "score": round(current_score, 4),
                "neighbors_count": len(neighbors_evaluated),
                "neighbors_evaluated": neighbors_evaluated,
                "rejected_neighbors": rejected_neighbors,
                "chosen_swap": None,
                "terminated": True
            })
            break

        # Move to best neighbor
        current_state = best_neighbor
        current_score = best_neighbor_score
        steps.append({
            "iteration": iteration,
            "action": f"Swapped positions {best_swap[0]+1} and {best_swap[1]+1} to climb score from {round(steps[-1]['score'], 4)} to {round(current_score, 4)}",
            "state": list(current_state),
            "state_names": [scheme_map[sid]["name"] for sid in current_state],
            "score": round(current_score, 4),
            "improved": True,
            "chosen_swap": best_swap,
            "neighbors_evaluated": neighbors_evaluated,
            "rejected_neighbors": rejected_neighbors,
            "terminated": False
        })

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    final_ranking = [
        {**scheme_evals[s_id], "rank": idx + 1}
        for idx, s_id in enumerate(current_state)
    ]

    initial_score = steps[0]["score"]
    final_score = round(current_score, 4)
    improvement = round(final_score - initial_score, 4)
    improvement_pct = round((improvement / initial_score * 100), 2) if initial_score > 0 else 0.0

    explanation = (
        f"Hill Climbing evaluated {len(eligible_schemes)} eligible schemes over {iteration} iterations "
        f"examining {total_neighbors_evaluated} neighborhood transpositions in {elapsed_ms}ms. "
        f"Objective score climbed from {initial_score} to {final_score} (+{improvement}, {improvement_pct}% gain). "
        f"Termination condition: {termination_reason}. "
        f"Theoretical limitation: Standard steepest-ascent hill climbing is greedy and cannot escape local optima or plateaus. "
        f"Unlike ordinary list sorting (which is O(N log N) deterministic ordering), Hill Climbing treats ranking as a discrete combinatorial state-space search."
    )

    return {
        "status": "success",
        "weights": weights,
        "initial_state": steps[0]["state"],
        "initial_score": initial_score,
        "final_state": current_state,
        "final_score": final_score,
        "improvement_achieved": improvement,
        "improvement_percentage": improvement_pct,
        "total_iterations": iteration,
        "total_neighbors_evaluated": total_neighbors_evaluated,
        "termination_reason": termination_reason,
        "execution_duration_ms": elapsed_ms,
        "steps": steps,
        "final_ranking": final_ranking,
        "baseline_ranking": baseline_ranking,
        "baseline_score": round(baseline_score, 4),
        "explanation": explanation
    }

