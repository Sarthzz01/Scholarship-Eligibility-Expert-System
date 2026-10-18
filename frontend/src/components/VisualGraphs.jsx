import { useState } from 'react'
import { ArrowRight, CheckCircle2, CircleAlert, CornerDownRight, Sparkles, XCircle } from 'lucide-react'

// --- Algorithm 2: BFS Knowledge Graph Visualization ---
export function BFSGraph({ nodes = [], edges = [], traversalOrder = [], activeStep = null }) {
  const [selectedNode, setSelectedNode] = useState(null)

  // Group nodes by level (0 to 4)
  const levels = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  nodes.forEach(n => {
    const lvl = n.level ?? 0
    if (levels[lvl]) levels[lvl].push(n)
  })

  // Canvas dimensions
  const width = 860
  const height = 480
  const levelY = { 0: 45, 1: 135, 2: 235, 3: 335, 4: 430 }

  // Compute (x, y) coordinates for each node
  const nodePositions = {}
  Object.keys(levels).forEach(lvl => {
    const lvlNodes = levels[lvl]
    const count = lvlNodes.length
    lvlNodes.forEach((node, idx) => {
      const x = count === 1 ? width / 2 : ((idx + 1) * width) / (count + 1)
      const y = levelY[lvl]
      nodePositions[node.id] = { x, y, node }
    })
  })

  return (
    <div className="algo-visualizer-container">
      <div className="graph-controls-header">
        <div className="graph-legend">
          <span className="legend-item"><span className="dot root-dot" /> Root</span>
          <span className="legend-item"><span className="dot jur-dot" /> Jurisdiction</span>
          <span className="legend-item"><span className="dot cat-dot" /> Category</span>
          <span className="legend-item"><span className="dot edu-dot" /> Level</span>
          <span className="legend-item"><span className="dot leaf-dot" /> Scheme Node</span>
        </div>
        <div className="traversal-counter">
          Level-by-Level FIFO Order: <strong>{traversalOrder.length} nodes traversed</strong>
        </div>
      </div>

      <div className="svg-canvas-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg">
          {/* Edges */}
          {edges.map((e, idx) => {
            const fromPos = nodePositions[e.from]
            const toPos = nodePositions[e.to]
            if (!fromPos || !toPos) return null
            return (
              <line
                key={`edge-${idx}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                className="graph-edge"
              />
            )
          })}

          {/* Nodes */}
          {Object.entries(nodePositions).map(([nodeId, pos]) => {
            const isTraversed = traversalOrder.includes(nodeId)
            const traversalIndex = traversalOrder.indexOf(nodeId)
            const isSelected = selectedNode?.id === nodeId
            const node = pos.node

            const colorClass =
              node.type === 'root' ? 'node-root' :
              node.type === 'jurisdiction' ? 'node-jur' :
              node.type === 'category' ? 'node-cat' :
              node.type === 'course_level' ? 'node-edu' : 'node-leaf'

            return (
              <g
                key={nodeId}
                className={`graph-node-group ${colorClass} ${isTraversed ? 'traversed' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedNode(node)}
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                <circle r={node.type === 'scheme' ? 14 : 16} className="node-circle" />
                {traversalIndex >= 0 && (
                  <text y={-20} className="node-order-badge">#{traversalIndex + 1}</text>
                )}
                <text y={4} className="node-icon-text">
                  {node.type === 'root' ? 'KB' : node.type === 'scheme' ? '★' : `${node.level}`}
                </text>
                <text y={28} className="node-label-text">
                  {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {selectedNode && (
        <div className="node-inspector-bar">
          <div>
            <strong>Selected Node: {selectedNode.label}</strong>
            <small>Hierarchy Level {selectedNode.level} · Type: {selectedNode.type}</small>
          </div>
          <button className="text-btn" onClick={() => setSelectedNode(null)}>Close</button>
        </div>
      )}
    </div>
  )
}

// --- Algorithm 3: DFS Decision Tree Visualization ---
export function DFSTree({ treeNodes = [], treeEdges = [], pathTaken = [], backtracks = [], ruleEvaluations = [] }) {
  return (
    <div className="algo-visualizer-container">
      <div className="decision-tree-layout">
        <div className="dt-flow">
          {treeNodes.map((node, idx) => {
            const isInPath = pathTaken.includes(node.id)
            const ruleEval = ruleEvaluations.find(r => r.node_id === node.id)
            const isBacktracked = backtracks.some(b => b.to === node.id)

            return (
              <div key={node.id} className={`dt-node-card ${node.type} ${isInPath ? 'active-path' : ''}`}>
                <div className="dt-node-header">
                  <span className="depth-badge">Depth {node.depth ?? idx}</span>
                  <span className="dt-type-tag">{node.type}</span>
                </div>
                <h4>{node.label}</h4>

                {node.type === 'condition' && (
                  <div className="dt-cond-body">
                    <div className="cond-detail">
                      <span>Field: <code>{node.field}</code></span>
                      <span>Operator: <code>{node.operator}</code></span>
                      <span>Expected: <code>{JSON.stringify(node.expected)}</code></span>
                    </div>
                    {ruleEval && (
                      <div className={`eval-pill ${ruleEval.satisfied ? 'pass' : 'fail'}`}>
                        {ruleEval.satisfied ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Actual: {JSON.stringify(ruleEval.actual)} ({ruleEval.status})</span>
                      </div>
                    )}
                  </div>
                )}

                {isBacktracked && (
                  <div className="backtrack-marker">
                    <CornerDownRight size={12} /> DFS Backtracked here to explore alternate branch
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Algorithm 4: Hill Climbing Chart ---
export function HillClimbingChart({ steps = [], finalRanking = [], baselineRanking = [], weights = {} }) {
  return (
    <div className="algo-visualizer-container">
      <div className="hc-dashboard-grid">
        {/* Progression Stepper */}
        <div className="hc-steps-card">
          <h4>Steepest Ascent Trajectory ({steps.length} Steps)</h4>
          <p className="subtext">Iteratively swapping adjacent pairs to maximize Discounted Cumulative Suitability.</p>
          <div className="step-timeline">
            {steps.map((st, idx) => (
              <div key={idx} className={`timeline-step ${st.terminated ? 'peak' : st.improved ? 'improved' : 'init'}`}>
                <div className="step-num">Step {st.iteration}</div>
                <div className="step-content">
                  <div className="step-score">
                    Objective Score: <strong>{st.score}</strong>
                    {st.improved && <span className="delta-pill">▲ Climbed</span>}
                    {st.terminated && <span className="delta-pill peak-pill">★ Local Optimum</span>}
                  </div>
                  <p className="step-action-desc">{st.action}</p>
                  <div className="state-permutation-chips">
                    {st.state_names?.map((name, sidx) => (
                      <span key={sidx} className="rank-chip">
                        #{sidx + 1} {name.length > 25 ? `${name.slice(0, 23)}…` : name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison with Greedy Sort */}
        <div className="hc-comparison-card">
          <h4>Final Suitability Ranking vs Baseline Sort</h4>
          <div className="rankings-columns">
            <div className="ranking-col">
              <h5>Hill Climbing Output</h5>
              {finalRanking.map((r, i) => (
                <div key={i} className="rank-item-card">
                  <span className="rank-pos">#{r.rank}</span>
                  <div>
                    <strong>{r.scheme_name}</strong>
                    <div className="metric-tags">
                      <span>Utility: {r.total_utility}</span>
                      <span>Amount: ₹{r.award_amount?.toLocaleString('en-IN')}</span>
                      <span>Effort: {r.effort_hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ranking-col baseline">
              <h5>Greedy Sorting Baseline</h5>
              {baselineRanking.map((r, i) => (
                <div key={i} className="rank-item-card">
                  <span className="rank-pos">#{r.rank}</span>
                  <div>
                    <strong>{r.scheme_name}</strong>
                    <div className="metric-tags">
                      <span>Utility: {r.total_utility}</span>
                      <span>Amount: ₹{r.award_amount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Algorithm 5: A* Search Roadmap ---
export function AStarRoadmap({ optimalPlan = [], exploredNodes = [], totalCostHours = 0, missingDocs = [] }) {
  return (
    <div className="algo-visualizer-container">
      <div className="astar-summary-bar">
        <div>
          <span>Optimal Path Found:</span>
          <strong>{optimalPlan.length} Sequential Stages</strong>
        </div>
        <div>
          <span>Total Path Cost g(n):</span>
          <strong>{totalCostHours} Hours Planned Effort</strong>
        </div>
        <div>
          <span>Admissible Heuristic:</span>
          <strong>h(n) = Σ min_cost (Consistent)</strong>
        </div>
      </div>

      {missingDocs.length > 0 && (
        <div className="missing-docs-alert">
          <CircleAlert size={16} />
          <span>Missing certificates identified ({missingDocs.length}): {missingDocs.join(', ')}. Dynamically scaled Task T4 effort.</span>
        </div>
      )}

      <div className="astar-stages-flow">
        {optimalPlan.map((stage, idx) => (
          <div key={idx} className="astar-stage-card">
            <div className="stage-marker">
              <span className="marker-num">{idx + 1}</span>
              {idx < optimalPlan.length - 1 && <span className="marker-line" />}
            </div>
            <div className="stage-content">
              <div className="stage-top">
                <span className="task-id-badge">{stage.task_id}</span>
                <span className="stage-cost">Effort: <strong>{stage.cost_hours} hrs</strong></span>
              </div>
              <h4>{stage.title}</h4>
              <p>{stage.description}</p>
              <div className="astar-f-pills">
                <span>g(n): {stage.cumulative_cost}h</span>
                <span>+</span>
                <span>h(n): {stage.heuristic_remaining}h</span>
                <span>=</span>
                <strong className="f-val">f(n): {stage.f_score}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
