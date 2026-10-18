import { useState } from 'react'
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  GitBranch,
  Layers,
  ListOrdered,
  Network,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export default function AcademicNotes() {
  const [openAlgorithm, setOpenAlgorithm] = useState('expert')

  const algorithms = [
    {
      id: 'expert',
      num: 1,
      title: 'Symbolic Rule-Based Expert System',
      icon: <BrainCircuit size={18} />,
      purpose: 'Authoritative eligibility determination using declarative IF-THEN rules.',
      problem: 'Determining whether a student satisfies statutory eligibility criteria across multi-jurisdictional government schemes without opaque black-box machine learning.',
      input: 'Student assertion facts: {state, category, annual_income, marks_percentage, course_level, course_type, attendance_percentage, cap_admission, receiving_other_scholarship, passed_previous_year}.',
      output: 'Tri-state classification (potential_match, ineligible, needs_information) with explicit condition audit trails (passed, failed, missing, skipped).',
      pseudocode: `FUNCTION evaluate_scheme(student_facts, scheme_rules):
    passed = [], failed = [], missing = []
    FOR EACH rule in scheme_rules:
        IF rule.has_condition("when"):
            IF NOT test_condition(student_facts, rule.when):
                CONTINUE  // Conditional rule skipped
        field = rule.field
        actual_val = student_facts.get(field)
        IF actual_val IS NULL:
            IF rule.required:
                missing.append(rule)
            CONTINUE
        IF compare(actual_val, rule.operator, rule.expected_val):
            passed.append(rule)
        ELSE:
            failed.append(rule)

    IF failed IS NOT EMPTY:
        RETURN Status("ineligible", failed_count=len(failed))
    ELSE IF missing IS NOT EMPTY:
        RETURN Status("needs_information", missing_count=len(missing))
    ELSE:
        RETURN Status("potential_match", verified_count=len(passed))`,
      timeComplexity: 'O(S × C), where S is the number of active scholarship schemes in the knowledge base and C is the average number of rule conditions per scheme. Evaluation of primitive comparison operators (eq, lte, gte, in) is O(1).',
      spaceComplexity: 'O(C) auxiliary working memory per scheme to store partitioned condition lists (passed, failed, missing), and O(S × C) for the aggregate evaluation response.',
      whySuitable: 'Government scholarship eligibility mandates 100% deterministic, explainable, and verifiable logic. Symbolic forward-chaining rules eliminate hallucinations and provide unambiguous legal auditability.',
      limitations: 'Rules must be explicitly codified by domain experts; cannot handle fuzzy or uncodified exceptions automatically without human rule authoring.'
    },
    {
      id: 'bfs',
      num: 2,
      title: 'Breadth-First Search (BFS) Knowledge Discovery',
      icon: <Network size={18} />,
      purpose: 'Hierarchical exploration of the scholarship knowledge graph level-by-level.',
      problem: 'Discovering candidate scholarship schemes organized in a deep jurisdiction and category ontology without getting stuck in deep branches.',
      input: 'Root node of knowledge graph (Level 0), edge relationships, and student query filters (Jurisdiction, Category).',
      output: 'FIFO traversal order, list of discovered scheme leaf nodes, frontier queue states at each step.',
      pseudocode: `FUNCTION breadth_first_search(graph, root_node):
    queue = FIFO_Queue()
    visited = Set()
    traversal_order = []
    discovered_schemes = []

    queue.enqueue(root_node)
    visited.add(root_node)

    WHILE queue IS NOT EMPTY:
        current = queue.dequeue()
        traversal_order.append(current)

        IF current.type == "scheme":
            discovered_schemes.append(current.scheme_id)

        FOR EACH neighbor in graph.adj[current]:
            IF neighbor NOT IN visited:
                visited.add(neighbor)
                queue.enqueue(neighbor)

    RETURN traversal_order, discovered_schemes`,
      timeComplexity: 'O(V + E) using an adjacency-list representation, where V is total graph vertices (root + scopes + categories + course levels + leaf schemes) and E is the total directed taxonomy edges.',
      spaceComplexity: 'O(V) for the visited set and FIFO queue memory frontier. In the worst case (a wide tree), queue holds the maximum breadth of a level O(B^d).',
      whySuitable: 'Guarantees discovery of all schemes at the shallowest ontological distance first, ensuring uniform multi-level catalog scanning before deep rule evaluation.',
      limitations: 'BFS only traverses the ontological structure; it does not perform semantic condition evaluation or suitability scoring by itself.'
    },
    {
      id: 'dfs',
      num: 3,
      title: 'Depth-First Search (DFS) Decision Tree Traversal',
      icon: <GitBranch size={18} />,
      purpose: 'Deep condition pathway exploration and backtracking across alternative rule branches.',
      problem: 'Evaluating sequential and mutually exclusive condition branches (e.g., CAP admission mandatory only for professional courses) and recording decision backtrack points.',
      input: 'Scheme decision tree root node, criteria nodes, applicant facts.',
      output: 'Exploration order, active branch path, backtracking stack trace, branch condition outcomes.',
      pseudocode: `FUNCTION depth_first_search(node, parent, visited, stack, backtracks):
    visited.add(node)
    stack.push(node)
    record_step(node, stack_depth=len(stack))

    IF node.type == "condition":
        evaluate_rule_condition(node)

    FOR EACH child in graph.children[node]:
        IF child NOT IN visited:
            depth_first_search(child, node, visited, stack, backtracks)
            // Backtrack upon returning from subtree
            backtracks.append((from=child, to=node))
            record_backtrack(child, node)

    stack.pop()`,
      timeComplexity: 'O(V + E) using adjacency list, where V is total decision nodes (criteria conditions + terminal leaves) and E is outcome transitions.',
      spaceComplexity: 'O(D) where D is maximum tree depth (proportional to rule count). This represents peak LIFO recursion stack memory, which is significantly smaller than BFS queue width.',
      whySuitable: 'Natural match for sequential rule evaluation pipelines and hierarchical dependency validation with minimal memory overhead.',
      limitations: 'A DFS path that reaches one positive leaf does not guarantee overall scheme sanction because ALL mandatory conditions must pass under expert system rules.'
    },
    {
      id: 'hc',
      num: 4,
      title: 'Steepest-Ascent Hill Climbing Ranking Optimization',
      icon: <TrendingUp size={18} />,
      purpose: 'Local search optimization of ranking permutations for eligible scholarships.',
      problem: 'Finding an optimal presentation ranking permutation of multiple eligible scholarships that maximizes multi-factor student utility.',
      input: 'Set of scholarships that passed mandatory eligibility (precondition), student profile, multi-factor weight coefficients.',
      output: 'Optimized ranking permutation, trajectory score progression, final local optimum, greedy sort comparison baseline.',
      pseudocode: `FUNCTION steepest_ascent_hill_climbing(eligible_schemes, student, weights):
    // Pre-condition: ineligible schemes are filtered out
    utilities = compute_utilities(eligible_schemes, student, weights)
    current_state = initial_permutation(eligible_schemes)
    current_score = evaluate_dcg_score(current_state, utilities)

    WHILE TRUE:
        best_neighbor = NULL
        best_neighbor_score = current_score

        FOR i FROM 0 TO len(current_state) - 2:
            neighbor = swap(current_state, i, i + 1)
            score = evaluate_dcg_score(neighbor, utilities)
            IF score > best_neighbor_score:
                best_neighbor = neighbor
                best_neighbor_score = score

        // If no adjacent swap strictly climbs, local peak reached
        IF best_neighbor IS NULL OR best_neighbor_score <= current_score:
            BREAK  // Local optimum attained

        current_state = best_neighbor
        current_score = best_neighbor_score

    RETURN current_state, current_score`,
      timeComplexity: 'O(I × N × U), where I is total ascent iterations, N is the number of eligible schemes (generating N-1 adjacent neighbors per iteration), and U is the cost of scoring each permutation.',
      spaceComplexity: 'O(N) to store candidate permutations and neighbor states.',
      whySuitable: 'Models ranking as combinatorial state-space search over discrete permutations. Demonstrates local search heuristics vs global sorting baselines.',
      limitations: 'Vulnerable to local optima, ridges, and plateaus without stochastic restarts or simulated annealing. In practice, greedy sorting by linear utility u(s) is optimal for independent schemes.'
    },
    {
      id: 'astar',
      num: 5,
      title: 'A* Search Application Planner',
      icon: <ListOrdered size={18} />,
      purpose: 'Optimal prerequisite workflow task planning from unapplied to submitted state.',
      problem: 'Finding the lowest-cost, prerequisite-compliant task sequence to complete all documentation, attestation, form-filling, and portal submission tasks.',
      input: 'Task state-space graph (T1 to T7), scheme document requirements, applicant missing documents list.',
      output: 'Optimal task execution plan, total effort hours, open priority queue state, admissible heuristic derivation.',
      pseudocode: `FUNCTION a_star_planner(scheme, missing_documents):
    start_state = Set()
    goal_state = All_Tasks
    open_heap = MinPriorityQueue()
    g_scores = {start_state: 0.0}
    parent_map = {}

    h_start = sum(min_cost(t) for t in goal_state)
    open_heap.insert(priority=0.0 + h_start, state=start_state, g=0.0)

    WHILE open_heap IS NOT EMPTY:
        current_state, g = open_heap.pop_min()

        IF current_state == goal_state:
            RETURN reconstruct_path(parent_map, goal_state)

        FOR EACH task IN All_Tasks - current_state:
            IF prerequisites_satisfied(task, current_state):
                next_state = current_state + {task}
                cost = dynamic_task_cost(task, missing_documents)
                tentative_g = g + cost

                IF tentative_g < g_scores.get(next_state, INF):
                    g_scores[next_state] = tentative_g
                    parent_map[next_state] = (current_state, task, cost)
                    h = sum(min_cost(t) for t in All_Tasks - next_state)
                    f = tentative_g + h
                    open_heap.insert(priority=f, state=next_state, g=tentative_g)`,
      timeComplexity: 'O(b^d) worst-case state transitions, where b is branching factor (available unblocked tasks) and d is depth. With a consistent admissible heuristic h(n), effective branching factor is close to 1.',
      spaceComplexity: 'O(b^d) storing all open set frontier states in binary min-heap and closed set entries.',
      whySuitable: 'Guarantees minimal-effort prerequisite sequence. The admissible heuristic h(n) = sum(min_task_costs) never overestimates remaining cost (h(n) <= h*(n)), ensuring provably optimal path.',
      limitations: 'High memory usage if state-space explodes with dozens of concurrent independent tasks; requires pre-definition of prerequisite dependency graphs.'
    }
  ]

  return (
    <div className="academic-notes-section">
      <div className="academic-header">
        <div>
          <span className="eyebrow">ACADEMIC &amp; VIVA DEFENSE REFERENCE</span>
          <h3>Classical AI Algorithms Theoretical Documentation</h3>
          <p>
            Complete theoretical breakdown, pseudocode, time &amp; space complexity proofs, suitability justifications, and cross-algorithm comparative matrix for college submission and oral examination.
          </p>
        </div>
      </div>

      {/* Cross-Algorithm Comparison Matrix */}
      <div className="comparison-matrix-card">
        <h4>Classical AI Algorithms Comparison Matrix</h4>
        <div className="matrix-table-container">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Paradigm</th>
                <th>Primary Data Structure</th>
                <th>Time Complexity</th>
                <th>Space Complexity</th>
                <th>Optimality</th>
                <th>Role in Application</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Rule-Based Expert System</strong></td>
                <td>Forward Chaining Symbolic Inference</td>
                <td>Declarative Rule Base &amp; Fact Memory</td>
                <td><code>O(S × C)</code></td>
                <td><code>O(C)</code></td>
                <td>Deterministic 100%</td>
                <td>Authoritative eligibility verification &amp; statutory compliance</td>
              </tr>
              <tr>
                <td><strong>2. Breadth-First Search (BFS)</strong></td>
                <td>Uninformed Level-by-Level Graph Search</td>
                <td>FIFO Queue (<code>deque</code>) + Visited Set</td>
                <td><code>O(V + E)</code></td>
                <td><code>O(V)</code></td>
                <td>Shortest Path (Unweighted)</td>
                <td>Hierarchical taxonomy &amp; scholarship discovery</td>
              </tr>
              <tr>
                <td><strong>3. Depth-First Search (DFS)</strong></td>
                <td>Uninformed Deep Branch Exploration</td>
                <td>LIFO Stack (Call Stack / Recursion)</td>
                <td><code>O(V + E)</code></td>
                <td><code>O(D)</code></td>
                <td>No</td>
                <td>Decision tree pathway inspection &amp; backtracking</td>
              </tr>
              <tr>
                <td><strong>4. Hill Climbing</strong></td>
                <td>Heuristic Local Search (Steepest Ascent)</td>
                <td>Permutation Array + Pairwise Swaps</td>
                <td><code>O(I × N × U)</code></td>
                <td><code>O(N)</code></td>
                <td>Local Optimum Only</td>
                <td>Multi-factor ranking optimization of eligible schemes</td>
              </tr>
              <tr>
                <td><strong>5. A* Search Planner</strong></td>
                <td>Informed Best-First State-Space Planning</td>
                <td>Binary Min-Heap Priority Queue</td>
                <td><code>O(b^d)</code></td>
                <td><code>O(b^d)</code></td>
                <td>Optimal (Admissible h)</td>
                <td>Minimal-cost prerequisite task roadmap synthesis</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Accordion List for Each Algorithm */}
      <div className="algorithm-accordion-list">
        {algorithms.map(algo => {
          const isOpen = openAlgorithm === algo.id
          return (
            <div key={algo.id} className={`accordion-card ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => setOpenAlgorithm(isOpen ? null : algo.id)}
              >
                <div className="accordion-title-col">
                  <span className="algo-badge">{algo.icon} Algorithm {algo.num}</span>
                  <h4>{algo.title}</h4>
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen && (
                <div className="accordion-body">
                  <div className="algo-meta-grid">
                    <div className="meta-block">
                      <strong>Purpose in Project:</strong>
                      <p>{algo.purpose}</p>
                    </div>
                    <div className="meta-block">
                      <strong>Problem Solved:</strong>
                      <p>{algo.problem}</p>
                    </div>
                    <div className="meta-block">
                      <strong>Formal Input:</strong>
                      <p><code>{algo.input}</code></p>
                    </div>
                    <div className="meta-block">
                      <strong>Formal Output:</strong>
                      <p>{algo.output}</p>
                    </div>
                  </div>

                  <div className="code-block-section">
                    <div className="code-header">
                      <span><Code2 size={14} /> Formal Pseudocode: {algo.title}</span>
                    </div>
                    <pre className="pseudocode-display"><code>{algo.pseudocode}</code></pre>
                  </div>

                  <div className="complexity-analysis-grid">
                    <div className="complexity-box">
                      <h5>Time Complexity: <code>{algo.timeComplexity.split(' ')[0]}</code></h5>
                      <p>{algo.timeComplexity}</p>
                    </div>
                    <div className="complexity-box">
                      <h5>Space Complexity: <code>{algo.spaceComplexity.split(' ')[0]}</code></h5>
                      <p>{algo.spaceComplexity}</p>
                    </div>
                  </div>

                  <div className="justification-section">
                    <div className="just-box suitable">
                      <h5>Why This Algorithm is Suitable:</h5>
                      <p>{algo.whySuitable}</p>
                    </div>
                    <div className="just-box limitations">
                      <h5>Known Theoretical Limitations:</h5>
                      <p>{algo.limitations}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
