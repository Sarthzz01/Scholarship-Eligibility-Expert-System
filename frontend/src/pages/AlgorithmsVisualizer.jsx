import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  GraduationCap,
  ListOrdered,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'
import { AStarRoadmap, BFSGraph, DFSTree, HillClimbingChart } from '../components/VisualGraphs'
import { API_BASE } from '../context/AuthContext'

export default function AlgorithmsVisualizer() {
  const [activeTab, setActiveTab] = useState('expert') // 'expert', 'bfs', 'dfs', 'hc', 'astar'
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Algorithm inputs
  const [studentContext, setStudentContext] = useState({
    state: 'Maharashtra',
    category: 'OBC',
    annual_income: 150000,
    marks_percentage: 82.0,
    course_level: 'Post-Matric',
    course_type: 'Professional',
    attendance_percentage: 80.0,
    cap_admission: true,
    receiving_other_scholarship: false,
    passed_previous_year: true,
    is_fresh_application: true,
    available_documents: ['Income Certificate', 'Mark Sheet', 'Domicile Certificate']
  })

  const [selectedSchemeId, setSelectedSchemeId] = useState(null)

  // Algorithm execution outputs
  const [expertOutput, setExpertOutput] = useState(null)
  const [bfsOutput, setBfsOutput] = useState(null)
  const [dfsOutput, setDfsOutput] = useState(null)
  const [hcOutput, setHcOutput] = useState(null)
  const [astarOutput, setAstarOutput] = useState(null)

  // Load schemes on boot
  useEffect(() => {
    async function fetchSchemes() {
      try {
        const res = await fetch(`${API_BASE}/schemes`)
        if (res.ok) {
          const data = await res.json()
          setSchemes(data)
          if (data.length > 0) setSelectedSchemeId(data[0].id)
        }
      } catch {
        setError('Backend is not reachable.')
      }
    }
    fetchSchemes()
  }, [])

  // 1. Run Expert System
  async function runExpertSystem() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: studentContext })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Evaluation failed')
      setExpertOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Run BFS
  async function runBFS() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/algorithms/bfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_state: studentContext.state,
          student_category: studentContext.category
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'BFS failed')
      setBfsOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. Run DFS
  async function runDFS() {
    if (!selectedSchemeId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/algorithms/dfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_id: selectedSchemeId,
          student: studentContext
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'DFS failed')
      setDfsOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 4. Run Hill Climbing
  async function runHillClimbing() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/algorithms/hill-climbing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentContext
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Hill Climbing failed')
      setHcOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 5. Run A* Search
  async function runAStar() {
    if (!selectedSchemeId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/algorithms/astar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_id: selectedSchemeId,
          student: studentContext,
          available_documents: studentContext.available_documents
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'A* search failed')
      setAstarOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Automatically trigger algorithm when switching tab if not yet loaded
  useEffect(() => {
    if (activeTab === 'expert' && !expertOutput) runExpertSystem()
    if (activeTab === 'bfs' && !bfsOutput) runBFS()
    if (activeTab === 'dfs' && !dfsOutput && selectedSchemeId) runDFS()
    if (activeTab === 'hc' && !hcOutput) runHillClimbing()
    if (activeTab === 'astar' && !astarOutput && selectedSchemeId) runAStar()
  }, [activeTab, selectedSchemeId])

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">CLASSICAL AI ARCHITECTURE</span>
            <h1>Artificial Intelligence Algorithms Laboratory</h1>
          </div>
          <div className="top-tag">
            <Sparkles size={16} /> 5 Classical AI Engines
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Algorithm Tabs */}
        <div className="algo-tabs-nav">
          <button
            className={`algo-tab-btn ${activeTab === 'expert' ? 'active' : ''}`}
            onClick={() => setActiveTab('expert')}
          >
            <BrainCircuit size={17} />
            <div>
              <strong>1. Rule-Based Expert System</strong>
              <small>Authoritative Forward Chaining</small>
            </div>
          </button>

          <button
            className={`algo-tab-btn ${activeTab === 'bfs' ? 'active' : ''}`}
            onClick={() => setActiveTab('bfs')}
          >
            <Network size={17} />
            <div>
              <strong>2. Breadth-First Search (BFS)</strong>
              <small>Knowledge Graph Traversal</small>
            </div>
          </button>

          <button
            className={`algo-tab-btn ${activeTab === 'dfs' ? 'active' : ''}`}
            onClick={() => setActiveTab('dfs')}
          >
            <GitBranch size={17} />
            <div>
              <strong>3. Depth-First Search (DFS)</strong>
              <small>Decision Tree & Backtracking</small>
            </div>
          </button>

          <button
            className={`algo-tab-btn ${activeTab === 'hc' ? 'active' : ''}`}
            onClick={() => setActiveTab('hc')}
          >
            <TrendingUp size={17} />
            <div>
              <strong>4. Hill Climbing</strong>
              <small>Permutation Ranking Optimization</small>
            </div>
          </button>

          <button
            className={`algo-tab-btn ${activeTab === 'astar' ? 'active' : ''}`}
            onClick={() => setActiveTab('astar')}
          >
            <ListOrdered size={17} />
            <div>
              <strong>5. A* Search Planner</strong>
              <small>Admissible Workflow Planning</small>
            </div>
          </button>
        </div>

        {/* Global Test Context Banner */}
        <section className="algo-context-bar">
          <div className="context-item">
            <span>State:</span> <strong>{studentContext.state}</strong>
          </div>
          <div className="context-item">
            <span>Category:</span> <strong>{studentContext.category}</strong>
          </div>
          <div className="context-item">
            <span>Income:</span> <strong>₹{studentContext.annual_income?.toLocaleString('en-IN')}</strong>
          </div>
          <div className="context-item">
            <span>Marks:</span> <strong>{studentContext.marks_percentage}%</strong>
          </div>
          <div className="context-item">
            <span>Attendance:</span> <strong>{studentContext.attendance_percentage}%</strong>
          </div>
          {(activeTab === 'dfs' || activeTab === 'astar') && (
            <div className="context-item scheme-picker">
              <span>Target Scheme:</span>
              <select
                value={selectedSchemeId || ''}
                onChange={e => setSelectedSchemeId(Number(e.target.value))}
              >
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* TAB 1: RULE-BASED EXPERT SYSTEM */}
        {activeTab === 'expert' && (
          <div className="tab-pane-fade">
            <div className="algo-info-card">
              <div className="info-header">
                <div>
                  <h3>Algorithm 1: Symbolic Rule-Based Expert System</h3>
                  <p>Authoritative forward-evaluation engine applying declarative IF–THEN criteria across scholarship facts.</p>
                </div>
                <button className="primary-button" onClick={runExpertSystem} disabled={loading}>
                  <Play size={15} /> {loading ? 'Evaluating...' : 'Execute Rule Engine'}
                </button>
              </div>

              <div className="algo-spec-grid">
                <div className="spec-box">
                  <strong>Input Data</strong>
                  <p>Applicant facts: Domicile, caste category, annual income, marks, course type, attendance, CAP status.</p>
                </div>
                <div className="spec-box">
                  <strong>Output Classification</strong>
                  <p><code>potential_match</code>, <code>ineligible</code>, or <code>needs_information</code> with condition breakdowns.</p>
                </div>
                <div className="spec-box">
                  <strong>Explanation Mechanism</strong>
                  <p>Evaluates mandatory and optional rules, generating explicit passed, failed, and missing reason strings.</p>
                </div>
              </div>
            </div>

            {expertOutput && (
              <div className="algo-results-wrapper">
                <h4>Execution Results ({expertOutput.results?.length} Schemes Evaluated)</h4>
                <div className="results-list">
                  {expertOutput.results?.map(r => (
                    <article className="result-card" key={r.scholarship_id}>
                      <div className="result-heading">
                        <div className={`result-icon ${r.status}`}>
                          {r.status === 'potential_match' ? <CheckCircle2 size={22} /> : r.status === 'ineligible' ? <XCircle size={22} /> : <CircleAlert size={22} />}
                        </div>
                        <div className="result-title">
                          <div className="title-line">
                            <h3>{r.scholarship_name}</h3>
                            <StatusPill status={r.status} />
                          </div>
                          <p>{r.summary}</p>
                        </div>
                      </div>

                      <div className="rule-columns">
                        {r.passed_conditions?.length > 0 && (
                          <div className="rule-group">
                            <h4 className="passed-label">Passed Rules ({r.passed_conditions.length})</h4>
                            {r.passed_conditions.map((c, i) => (
                              <div className="rule" key={`p${i}`}><CheckCircle2 size={14} /><span>{c.message}</span></div>
                            ))}
                          </div>
                        )}
                        {r.failed_conditions?.length > 0 && (
                          <div className="rule-group">
                            <h4 className="failed-label">Failed Rules ({r.failed_conditions.length})</h4>
                            {r.failed_conditions.map((c, i) => (
                              <div className="rule" key={`f${i}`}><XCircle size={14} /><span>{c.message}</span></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BREADTH-FIRST SEARCH (BFS) */}
        {activeTab === 'bfs' && (
          <div className="tab-pane-fade">
            <div className="algo-info-card">
              <div className="info-header">
                <div>
                  <h3>Algorithm 2: Breadth-First Search (BFS)</h3>
                  <p>Explores the multi-level scholarship knowledge graph level by level using a FIFO queue to discover candidate schemes.</p>
                </div>
                <button className="primary-button" onClick={runBFS} disabled={loading}>
                  <Play size={15} /> {loading ? 'Traversing...' : 'Execute BFS Traversal'}
                </button>
              </div>

              <div className="algo-spec-grid">
                <div className="spec-box">
                  <strong>Data Structure</strong>
                  <p>FIFO Queue (<code>collections.deque</code>) + Visited Set for cycle prevention.</p>
                </div>
                <div className="spec-box">
                  <strong>Knowledge Graph Hierarchy</strong>
                  <p>Level 0 (Root) → Level 1 (Jurisdiction) → Level 2 (Category) → Level 3 (Course Level) → Level 4 (Schemes).</p>
                </div>
                <div className="spec-box">
                  <strong>Discovery Integration</strong>
                  <p>BFS filters relevant candidates across the hierarchy before rule engine verification.</p>
                </div>
              </div>
            </div>

            {bfsOutput && (
              <>
                <div className="algo-results-wrapper">
                  <h4>Interactive Knowledge Graph &amp; Traversal Frontier</h4>
                  <BFSGraph
                    nodes={bfsOutput.nodes}
                    edges={bfsOutput.edges}
                    traversalOrder={bfsOutput.traversal_order}
                  />
                  <div className="algo-explanation-box">
                    <strong>Explanation:</strong> {bfsOutput.explanation}
                  </div>
                </div>

                <div className="steps-log-card">
                  <h4>BFS Step-by-Step FIFO Queue Trace ({bfsOutput.steps?.length} Steps)</h4>
                  <div className="log-table-container">
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Current Dequeued Node</th>
                          <th>Action &amp; Exploration Frontier</th>
                          <th>Queue State (FIFO)</th>
                          <th>Visited Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bfsOutput.steps?.map(st => (
                          <tr key={st.step}>
                            <td><code>#{st.step}</code></td>
                            <td><strong>{st.current_node}</strong></td>
                            <td>{st.action}</td>
                            <td><span className="queue-chip">[{st.queue?.slice(0, 3).join(', ')}{st.queue?.length > 3 ? '...' : ''}]</span></td>
                            <td>{st.visited_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: DEPTH-FIRST SEARCH (DFS) */}
        {activeTab === 'dfs' && (
          <div className="tab-pane-fade">
            <div className="algo-info-card">
              <div className="info-header">
                <div>
                  <h3>Algorithm 3: Depth-First Search (DFS)</h3>
                  <p>Systematically explores condition pathways in the scheme decision tree, recording explored paths and backtracking.</p>
                </div>
                <button className="primary-button" onClick={runDFS} disabled={loading}>
                  <Play size={15} /> {loading ? 'Exploring...' : 'Execute DFS Tree Search'}
                </button>
              </div>

              <div className="algo-spec-grid">
                <div className="spec-box">
                  <strong>Search Mechanism</strong>
                  <p>Recursive DFS with Visited Set and Backtrack Stack across condition branches.</p>
                </div>
                <div className="spec-box">
                  <strong>Alternative Branches</strong>
                  <p>Evaluates dependent conditions (e.g. CAP verification triggered for Professional courses).</p>
                </div>
                <div className="spec-box">
                  <strong>Authoritative Distinction</strong>
                  <p>DFS reveals tree search order; authoritative result requires all mandatory conditions.</p>
                </div>
              </div>
            </div>

            {dfsOutput && (
              <>
                <div className="algo-results-wrapper">
                  <h4>Decision Tree Traversal: {dfsOutput.scheme_name}</h4>
                  <DFSTree
                    treeNodes={dfsOutput.tree_nodes}
                    treeEdges={dfsOutput.tree_edges}
                    pathTaken={dfsOutput.path_taken}
                    backtracks={dfsOutput.backtracks}
                    ruleEvaluations={dfsOutput.rule_evaluations}
                  />
                  <div className="algo-explanation-box">
                    <strong>Explanation:</strong> {dfsOutput.explanation}
                  </div>
                </div>

                <div className="steps-log-card">
                  <h4>DFS Exploration &amp; Backtracking Trace ({dfsOutput.steps?.length} Steps)</h4>
                  <div className="log-table-container">
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Node ID</th>
                          <th>Action &amp; Traversal Event</th>
                          <th>Event Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dfsOutput.steps?.map(st => (
                          <tr key={st.step} className={st.backtrack ? 'backtrack-row' : ''}>
                            <td><code>#{st.step}</code></td>
                            <td><strong>{st.current_node}</strong></td>
                            <td>{st.action}</td>
                            <td>
                              <span className={`pill ${st.backtrack ? 'warn' : 'good'}`}>
                                {st.backtrack ? 'Backtrack' : 'Forward Visit'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: HILL CLIMBING */}
        {activeTab === 'hc' && (
          <div className="tab-pane-fade">
            <div className="algo-info-card">
              <div className="info-header">
                <div>
                  <h3>Algorithm 4: Steepest-Ascent Hill Climbing</h3>
                  <p>Optimizes ranking permutations of eligible scholarships by iteratively evaluating adjacent transpositions until a local optimum.</p>
                </div>
                <button className="primary-button" onClick={runHillClimbing} disabled={loading}>
                  <Play size={15} /> {loading ? 'Climbing...' : 'Execute Hill Climbing'}
                </button>
              </div>

              <div className="algo-spec-grid">
                <div className="spec-box">
                  <strong>Precondition</strong>
                  <p>Ineligible schemes are strictly filtered out; only <code>potential_match</code> schemes qualify for ranking.</p>
                </div>
                <div className="spec-box">
                  <strong>Objective Function</strong>
                  <p>Discounted Cumulative Utility: <code>Score = Σ u(s) / log2(rank + 1)</code></p>
                </div>
                <div className="spec-box">
                  <strong>Local Optima Limitation</strong>
                  <p>Terminates when no adjacent swap improves score. Greedy sort is displayed as a global comparison baseline.</p>
                </div>
              </div>
            </div>

            {hcOutput && hcOutput.status === 'success' && (
              <>
                <HillClimbingChart
                  steps={hcOutput.steps}
                  finalRanking={hcOutput.final_ranking}
                  baselineRanking={hcOutput.baseline_ranking}
                  weights={hcOutput.weights}
                />
                <div className="algo-explanation-box">
                  <strong>Explanation:</strong> {hcOutput.explanation}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: A* SEARCH APPLICATION PLANNER */}
        {activeTab === 'astar' && (
          <div className="tab-pane-fade">
            <div className="algo-info-card">
              <div className="info-header">
                <div>
                  <h3>Algorithm 5: A* Search Application Planner</h3>
                  <p>State-space planning algorithm that schedules application tasks to reach the submitted goal state with optimal cost.</p>
                </div>
                <button className="primary-button" onClick={runAStar} disabled={loading}>
                  <Play size={15} /> {loading ? 'Planning...' : 'Execute A* Planner'}
                </button>
              </div>

              <div className="algo-spec-grid">
                <div className="spec-box">
                  <strong>Cost Functions</strong>
                  <p><code>g(n)</code>: Cumulative task effort hours.<br /><code>h(n)</code>: Admissible remaining effort estimate.</p>
                </div>
                <div className="spec-box">
                  <strong>Admissibility Guarantee</strong>
                  <p><code>h(n) = Σ min_task_cost</code> never overestimates actual remaining cost, ensuring an optimal path.</p>
                </div>
                <div className="spec-box">
                  <strong>Unreachable Goals</strong>
                  <p>Correctly detects expired application deadlines or blocked prerequisites.</p>
                </div>
              </div>
            </div>

            {astarOutput && astarOutput.status === 'success' && (
              <>
                <AStarRoadmap
                  optimalPlan={astarOutput.optimal_plan}
                  exploredNodes={astarOutput.explored_nodes}
                  totalCostHours={astarOutput.total_cost_hours}
                  missingDocs={astarOutput.missing_documents}
                />
                <div className="algo-explanation-box">
                  <strong>Explanation:</strong> {astarOutput.explanation}
                </div>

                <div className="steps-log-card">
                  <h4>A* Priority Queue State Exploration Log</h4>
                  <div className="log-table-container">
                    <table className="log-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Current State Node</th>
                          <th>g(n) Path Cost</th>
                          <th>h(n) Heuristic</th>
                          <th>f(n) Total</th>
                          <th>Open Set Size</th>
                          <th>Closed Set Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {astarOutput.explored_nodes?.map(st => (
                          <tr key={st.step}>
                            <td><code>#{st.step}</code></td>
                            <td><strong>{st.current_task}</strong> ({st.completed_tasks_count} done)</td>
                            <td>{st.g_cost} hrs</td>
                            <td>{st.h_heuristic} hrs</td>
                            <td><strong>{st.f_total}</strong></td>
                            <td>{st.open_set_size}</td>
                            <td>{st.closed_set_size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {astarOutput && astarOutput.status === 'unreachable' && (
              <div className="error-banner">
                <CircleAlert size={18} />
                <span>{astarOutput.reason}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
