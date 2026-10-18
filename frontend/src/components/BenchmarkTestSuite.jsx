import { useState } from 'react'
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  GitBranch,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  TestTube,
  XCircle
} from 'lucide-react'
import { API_BASE, useAuth } from '../context/AuthContext'

export default function BenchmarkTestSuite() {
  const { authFetch } = useAuth()
  const [activeTab, setActiveTab] = useState('tests') // 'tests' or 'benchmark'
  const [suiteLoading, setSuiteLoading] = useState(false)
  const [benchLoading, setBenchLoading] = useState(false)
  const [suiteResults, setSuiteResults] = useState(null)
  const [benchResults, setBenchResults] = useState(null)
  const [error, setError] = useState('')

  // 1. Run 10 Academic Test Cases
  async function runTestSuite() {
    setSuiteLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE}/algorithms/test-suite`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Test suite execution failed')
      setSuiteResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSuiteLoading(false)
    }
  }

  // 2. Run Head-to-Head BFS vs DFS Benchmark
  async function runBenchmark() {
    setBenchLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE}/algorithms/benchmark`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Benchmark execution failed')
      setBenchResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBenchLoading(false)
    }
  }

  return (
    <div className="benchmark-test-suite-container">
      <div className="bench-top-nav">
        <div className="bench-tabs">
          <button
            type="button"
            className={`bench-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <TestTube size={16} /> 10 Academic Repeatable Test Cases
          </button>
          <button
            type="button"
            className={`bench-tab-btn ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => setActiveTab('benchmark')}
          >
            <BarChart3 size={16} /> Live Head-to-Head Benchmark (BFS vs DFS)
          </button>
        </div>

        {activeTab === 'tests' ? (
          <button
            type="button"
            className="primary-button"
            onClick={runTestSuite}
            disabled={suiteLoading}
          >
            <Play size={15} /> {suiteLoading ? 'Executing Test Suite...' : 'Run All 10 Test Cases'}
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={runBenchmark}
            disabled={benchLoading}
          >
            <Flame size={15} /> {benchLoading ? 'Benchmarking Graph...' : 'Execute BFS vs DFS Benchmark'}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* VIEW 1: REPEATABLE TEST CASES */}
      {activeTab === 'tests' && (
        <div className="test-cases-view">
          {suiteResults && (
            <div className="suite-summary-banner">
              <div className="summary-score">
                <span className={`pass-badge ${suiteResults.all_passed ? 'all-pass' : 'some-fail'}`}>
                  {suiteResults.all_passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}
                </span>
                <strong>{suiteResults.passed_tests} / {suiteResults.total_tests} Tests Passed (100% Deterministic)</strong>
              </div>
              <p className="summary-desc">
                Automated regression &amp; viva verification test suite executed directly on backend algorithm engines.
              </p>
            </div>
          )}

          <div className="test-cards-list">
            {(suiteResults?.tests || defaultTestCases).map((test, idx) => (
              <div key={idx} className={`test-card status-${test.status || 'READY'}`}>
                <div className="test-header">
                  <div className="test-id-col">
                    <span className="test-id-tag">{test.test_id}</span>
                    <span className="algo-tag">{test.algorithm}</span>
                  </div>
                  <span className={`test-status-pill ${test.status === 'PASS' ? 'pass' : test.status === 'FAIL' ? 'fail' : 'ready'}`}>
                    {test.status === 'PASS' ? <CheckCircle2 size={13} /> : test.status === 'FAIL' ? <XCircle size={13} /> : null}
                    {test.status || 'Ready to Run'}
                  </span>
                </div>

                <h4>{test.name}</h4>
                <p className="test-description">{test.description}</p>

                <div className="test-details-grid">
                  <div className="detail-box">
                    <strong>Expected Result:</strong>
                    <span>{test.expected}</span>
                  </div>
                  <div className="detail-box">
                    <strong>Actual Result:</strong>
                    <span className={test.status === 'PASS' ? 'text-success' : ''}>
                      {test.actual || 'Run test suite to verify actual output.'}
                    </span>
                  </div>
                </div>

                {test.duration_ms !== undefined && (
                  <div className="test-footer">
                    <span><Clock size={12} /> Execution Duration: <strong>{test.duration_ms} ms</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE GRAPH BENCHMARK */}
      {activeTab === 'benchmark' && (
        <div className="benchmark-view">
          {!benchResults ? (
            <div className="algo-empty-placeholder">
              <BarChart3 size={32} />
              <h4>Head-to-Head Graph Traversal Benchmark</h4>
              <p>Compare BFS and DFS performance metrics on the identical SQLite scholarship knowledge graph.</p>
              <button type="button" className="primary-button" onClick={runBenchmark} disabled={benchLoading}>
                <Play size={16} /> {benchLoading ? 'Executing Benchmark...' : 'Run Graph Benchmark'}
              </button>
            </div>
          ) : (
            <div className="benchmark-dashboard">
              {/* Graph Stats Header */}
              <div className="graph-stats-strip">
                <div>
                  <span className="stat-label">Knowledge Graph Vertices (V)</span>
                  <span className="stat-val">{benchResults.graph_statistics?.total_vertices} Nodes</span>
                </div>
                <div>
                  <span className="stat-label">Knowledge Graph Edges (E)</span>
                  <span className="stat-val">{benchResults.graph_statistics?.total_edges} Directed Edges</span>
                </div>
                <div>
                  <span className="stat-label">Taxonomy Depth</span>
                  <span className="stat-val">{benchResults.graph_statistics?.hierarchy_levels} Levels</span>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="benchmark-comparison-grid">
                {/* BFS Card */}
                <div className="bench-card bfs-card">
                  <div className="bench-card-top">
                    <Network size={20} />
                    <h4>Breadth-First Search (BFS)</h4>
                    <span className="badge-fifo">FIFO Queue Frontier</span>
                  </div>
                  <div className="bench-metrics-table">
                    <div className="metric-row">
                      <span>Execution Duration:</span>
                      <strong>{benchResults.bfs?.duration_ms} ms</strong>
                    </div>
                    <div className="metric-row">
                      <span>Nodes Visited:</span>
                      <strong>{benchResults.bfs?.nodes_visited} / {benchResults.graph_statistics?.total_vertices}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Edges Examined:</span>
                      <strong>{benchResults.bfs?.edges_examined} / {benchResults.graph_statistics?.total_edges}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Max Frontier Queue Size:</span>
                      <strong className="text-warn">{benchResults.bfs?.max_queue_size} nodes</strong>
                    </div>
                  </div>
                  <div className="traversal-sample-box">
                    <small>Traversal Order Sample:</small>
                    <code>{benchResults.bfs?.traversal_order_sample?.join(' → ')}…</code>
                  </div>
                </div>

                {/* DFS Card */}
                <div className="bench-card dfs-card">
                  <div className="bench-card-top">
                    <GitBranch size={20} />
                    <h4>Depth-First Search (DFS)</h4>
                    <span className="badge-lifo">LIFO Stack Frontier</span>
                  </div>
                  <div className="bench-metrics-table">
                    <div className="metric-row">
                      <span>Execution Duration:</span>
                      <strong>{benchResults.dfs?.duration_ms} ms</strong>
                    </div>
                    <div className="metric-row">
                      <span>Nodes Visited:</span>
                      <strong>{benchResults.dfs?.nodes_visited} / {benchResults.graph_statistics?.total_vertices}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Edges Examined:</span>
                      <strong>{benchResults.dfs?.edges_examined} / {benchResults.graph_statistics?.total_edges}</strong>
                    </div>
                    <div className="metric-row">
                      <span>Max Recursion Stack Depth:</span>
                      <strong className="text-primary">{benchResults.dfs?.max_stack_depth} frames</strong>
                    </div>
                    <div className="metric-row">
                      <span>Backtracking Operations:</span>
                      <strong className="text-danger">{benchResults.dfs?.backtracks_count} events</strong>
                    </div>
                  </div>
                  <div className="traversal-sample-box">
                    <small>Traversal Order Sample:</small>
                    <code>{benchResults.dfs?.traversal_order_sample?.join(' → ')}…</code>
                  </div>
                </div>
              </div>

              {/* Benchmark Scientific Observation */}
              <div className="algo-explanation-box">
                <strong>Empirical Observation &amp; Analysis:</strong> {benchResults.analysis}
                <p className="note-text">
                  <em>Academic Note:</em> Execution times are measured directly on the local server without simulated delays. Minor timing variance between runs is normal due to OS thread preemption and SQLite memory caching. Both algorithms correctly complete in O(V + E) time.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const defaultTestCases = [
  {
    test_id: "TC01",
    name: "Valid Eligibility Profile Evaluation",
    algorithm: "1. Rule-Based Expert System",
    description: "Submits a student profile satisfying all mandatory criteria (domicile, income <= 2.5L, category OBC, attendance >= 75%).",
    expected: "Classification: potential_match (All mandatory conditions pass)"
  },
  {
    test_id: "TC02",
    name: "Failed Mandatory Condition Enforcement",
    algorithm: "1. Rule-Based Expert System",
    description: "Submits applicant with family income ₹9,00,000 against a ₹2,50,000 ceiling. System must strictly disqualify.",
    expected: "Classification: ineligible (Mandatory annual_income rule failed)"
  },
  {
    test_id: "TC03",
    name: "Missing Required Information Handling",
    algorithm: "1. Rule-Based Expert System",
    description: "Submits applicant profile with annual_income omitted (None). Must flag incomplete rather than false pass or instant failure.",
    expected: "Classification: needs_information (Requires applicant clarification)"
  },
  {
    test_id: "TC04",
    name: "Multiple Co-existing Scholarship Matching",
    algorithm: "1. Rule-Based Expert System",
    description: "High-merit applicant with low income qualifies simultaneously for both Central Sector Merit and State EBC schemes.",
    expected: ">= 2 schemes classified as potential_match"
  },
  {
    test_id: "TC05",
    name: "Empty Knowledge Base Boundary Traversal",
    algorithm: "2. Breadth-First Search (BFS)",
    description: "Executes BFS graph discovery when zero scholarship schemes are seeded in knowledge memory.",
    expected: "0 nodes traversed; returns empty graph object without unhandled exception"
  },
  {
    test_id: "TC06",
    name: "Cyclic Graph Cycle-Prevention Verification",
    algorithm: "2. Breadth-First Search (BFS)",
    description: "Tests traversal over an engineered graph fixture containing a directed cycle A -> B -> C -> A.",
    expected: "Exactly 4 unique nodes visited; cycle detected and pruned by visited set"
  },
  {
    test_id: "TC07",
    name: "Disconnected Graph Component Isolation",
    algorithm: "3. Depth-First Search (DFS)",
    description: "Tests DFS exploration on a disjoint graph containing unreachable sub-islands.",
    expected: "3 nodes visited in reachable component; isolated island remains unvisited"
  },
  {
    test_id: "TC08",
    name: "Hill Climbing Local Optimum Ascent",
    algorithm: "4. Steepest-Ascent Hill Climbing",
    description: "Executes steepest-ascent pairwise swaps on inverted permutation of 3 eligible schemes until positive gradient terminates.",
    expected: "Final DCG score > initial score; highest utility scheme climbed to #1 rank"
  },
  {
    test_id: "TC09",
    name: "A* Search Optimal Application Roadmap",
    algorithm: "5. A* Search Planner",
    description: "Formulates optimal prerequisite task plan using admissible heuristic h(n) = sum(min_cost).",
    expected: "status: success, 7 sequential stages from T1 to T7, non-negative total cost"
  },
  {
    test_id: "TC10",
    name: "A* Search Unreachable Goal Pruning",
    algorithm: "5. A* Search Planner",
    description: "Invokes A* planner on a scholarship scheme whose application submission deadline is in the past.",
    expected: "status: unreachable; detects portal closed boundary and halts planning"
  }
]
