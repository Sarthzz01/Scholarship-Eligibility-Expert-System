import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock,
  Layers,
  ListOrdered,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
  Network,
  LayoutGrid
} from 'lucide-react'
import StepController from './StepController'

export default function AStarVisualizer({
  output,
  onRun,
  loading = false
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [viewMode, setViewMode] = useState('graph') // 'graph' | 'cards' | 'both'
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  if (!output) {
    return (
      <div className="algo-empty-placeholder">
        <ListOrdered size={32} />
        <h4>A* Search Application Planner Ready</h4>
        <p>Formulate an optimal low-cost prerequisite workflow from initial unapplied state to submitted state using admissible heuristic search.</p>
        <button type="button" className="primary-button" onClick={onRun} disabled={loading}>
          <Play size={16} /> {loading ? 'Planning...' : 'Execute A* Planner'}
        </button>
      </div>
    )
  }

  if (output.status === 'unreachable') {
    return (
      <div className="algo-empty-placeholder error-state">
        <CircleAlert size={32} />
        <h4>Goal State Unreachable</h4>
        <p>{output.reason}</p>
        <div className="deadline-badge-callout">
          Official Deadline: <strong>{output.deadline}</strong> · Days Remaining: <strong>{output.days_left}</strong>
        </div>
        <small>A* pruned the search space because no valid transition exists to reach the goal state before the deadline.</small>
      </div>
    )
  }

  const exploredNodes = output.explored_nodes || []
  const optimalPlan = output.optimal_plan || []
  const activeStep = exploredNodes[currentStepIndex] || exploredNodes[0] || {}
  const missingDocs = output.missing_documents || []
  const availableDocs = output.available_documents || []
  const workflowGraph = output.workflow_graph || { nodes: [], edges: [] }

  const completedInStep = new Set(activeStep.completed_tasks || [])
  const currentTaskId = activeStep.current_task

  // --- SVG State-Space Graph Coordinates Layout ---
  const svgWidth = 960
  const svgHeight = 240
  const taskOrder = [
    'T1_ELIGIBILITY',
    'T2_CHECKLIST',
    'T3_AUDIT_DOCS',
    'T4_OBTAIN_DOCS',
    'T5_FILL_FORM',
    'T6_REVIEW_FORM',
    'T7_SUBMIT'
  ]

  const stagePositions = {}
  taskOrder.forEach((tId, idx) => {
    const x = 70 + (idx / (taskOrder.length - 1)) * (svgWidth - 140)
    // Alternate y slightly for visual rhythm
    const y = idx % 2 === 0 ? 110 : 130
    stagePositions[tId] = { x, y }
  })

  const selectedStage = selectedTaskId ? optimalPlan.find(p => p.task_id === selectedTaskId) : null

  return (
    <div className="astar-visualizer-container">
      {/* Metrics Bar */}
      <div className="algo-metrics-strip">
        <div className="metric-box">
          <span className="metric-label">Total Path Effort g(n)</span>
          <span className="metric-val text-primary">{output.total_cost_hours || 0} hrs</span>
          <small className="metric-sub">Optimal Solution Cost</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Sequential Stages</span>
          <span className="metric-val text-success">{output.steps_count || optimalPlan.length}</span>
          <small className="metric-sub">Milestones T1 to T7</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">States Explored</span>
          <span className="metric-val">{exploredNodes.length}</span>
          <small className="metric-sub">Closed Set Transitions</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Open Set (Frontier)</span>
          <span className="metric-val text-warn">{activeStep.open_set_size ?? 0}</span>
          <small className="metric-sub">Priority Queue Size</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Missing Certificates</span>
          <span className="metric-val text-danger">{missingDocs.length}</span>
          <small className="metric-sub">Scales Task T4 Effort</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Search Duration</span>
          <span className="metric-val">{output.search_duration_ms || 0} ms</span>
          <small className="metric-sub">Admissible A* Time</small>
        </div>
      </div>

      {/* Missing Documents Alert Banner */}
      {missingDocs.length > 0 ? (
        <div className="missing-docs-callout">
          <CircleAlert size={18} />
          <div>
            <strong>Missing Prerequisite Certificates Detected ({missingDocs.length}):</strong>
            <p>
              {missingDocs.join(', ')}. Task T4 ("Procure &amp; Prepare Missing Certificates") effort was dynamically scaled to {1.5 + missingDocs.length * 1.5} hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="all-docs-callout">
          <CheckCircle2 size={18} />
          <div>
            <strong>All Required Scheme Certificates Available!</strong>
            <p>Applicant possesses all mandated documents ({availableDocs.join(', ')}). Minimum preparation effort required.</p>
          </div>
        </div>
      )}

      {/* View Toggle Bar */}
      <div className="table-controls-bar" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#1e293b' }}>
            A* Plan: {output.scheme_name}
          </strong>
          <span className="deadline-tag">
            <Clock size={12} /> Deadline: <strong>{output.deadline}</strong> ({output.days_left}d left)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            <Network size={13} /> State-Space Directed Graph
          </button>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid size={13} /> Milestone Roadmap Cards
          </button>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
          >
            Split View
          </button>
        </div>
      </div>

      {/* INTERACTIVE SVG STATE-SPACE DIRECTED GRAPH */}
      {(viewMode === 'graph' || viewMode === 'both') && (
        <div className="graph-canvas-card" style={{ marginBottom: '16px' }}>
          <div className="graph-card-header">
            <div className="graph-legend">
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#dcfce7', border: '1px solid #10b981' }} /> Completed State</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#dbeafe', border: '2px solid #2563eb' }} /> Active Node</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }} /> Planned Milestone</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#10b981', width: '16px', height: '3px', borderRadius: '2px' }} /> Optimal Path</span>
            </div>
            <div className="level-indicators">
              <span>Heuristic: $f(n) = g(n) + h(n)$ · Admissible Minimum Effort</span>
            </div>
          </div>

          <div className="svg-canvas-wrapper">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="graph-svg">
              <defs>
                <marker id="astar-arrow-active" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="astar-arrow-default" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
              </defs>

              {/* Connecting Directed Edges */}
              {taskOrder.map((tId, idx) => {
                if (idx === 0) return null
                const prevId = taskOrder[idx - 1]
                const fromPos = stagePositions[prevId]
                const toPos = stagePositions[tId]
                if (!fromPos || !toPos) return null

                const stageInfo = optimalPlan.find(p => p.task_id === tId)
                const isTraversed = completedInStep.has(tId)
                const isCurrentTransition = tId === currentTaskId

                const midX = (fromPos.x + toPos.x) / 2
                const midY = (fromPos.y + toPos.y) / 2

                return (
                  <g key={`astar-edge-${idx}`}>
                    <line
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={isCurrentTransition ? '#2563eb' : isTraversed ? '#10b981' : '#cbd5e1'}
                      strokeWidth={isCurrentTransition ? 3.5 : isTraversed ? 3 : 1.5}
                      strokeDasharray={isCurrentTransition ? '4 3' : undefined}
                      markerEnd={isTraversed || isCurrentTransition ? 'url(#astar-arrow-active)' : 'url(#astar-arrow-default)'}
                    />
                    {/* Edge Cost Label */}
                    <g transform={`translate(${midX}, ${midY - 8})`}>
                      <rect x={-22} y={-9} width={44} height={15} rx={3} fill="#ffffff" stroke="#e2e8f0" />
                      <text x={0} y={2} fontSize={9} fontWeight={700} fill="#64748b" textAnchor="middle">
                        +{stageInfo?.cost_hours || 1}h
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* Task State Nodes */}
              {taskOrder.map((tId, idx) => {
                const pos = stagePositions[tId]
                if (!pos) return null

                const stageInfo = optimalPlan.find(p => p.task_id === tId)
                const isCurrent = tId === currentTaskId
                const isCompleted = completedInStep.has(tId)
                const isSelected = selectedTaskId === tId

                let nodeFill = '#ffffff'
                let nodeStroke = '#cbd5e1'
                let strokeWidth = 2

                if (isCurrent) {
                  nodeFill = '#dbeafe'
                  nodeStroke = '#2563eb'
                  strokeWidth = 3.5
                } else if (isCompleted) {
                  nodeFill = '#dcfce7'
                  nodeStroke = '#10b981'
                  strokeWidth = 2.5
                }

                return (
                  <g
                    key={`astar-node-${tId}`}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedTaskId(tId)}
                  >
                    {/* Outer pulse halo for active task */}
                    {isCurrent && (
                      <circle r={26} fill="#3b82f6" opacity="0.2">
                        <animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    <circle
                      r={20}
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={strokeWidth}
                    />

                    {/* Step Number */}
                    <text y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill={isCurrent ? '#1d4ed8' : isCompleted ? '#166534' : '#475569'}>
                      T{idx + 1}
                    </text>

                    {/* Title Label Below */}
                    <text y={34} textAnchor="middle" fontSize={10} fontWeight={600} fill="#1e293b">
                      {stageInfo?.title?.split(' ')[0] || tId}
                    </text>

                    {/* f(n) badge above */}
                    {stageInfo && (
                      <g transform="translate(0, -28)">
                        <rect x={-24} y={-8} width={48} height={14} rx={3} fill="#1e293b" />
                        <text x={0} y={3} textAnchor="middle" fontSize={8} fontWeight={700} fill="#ffffff">
                          f={stageInfo.f_score}h
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Node Inspector Bar */}
          {selectedStage && (
            <div className="node-inspector-bar">
              <div>
                <strong>#{selectedStage.step_number}: {selectedStage.title} ({selectedStage.task_id})</strong>
                <small>
                  Step Effort: <strong>{selectedStage.cost_hours}h</strong> · Path Cost g(n): <strong>{selectedStage.cumulative_cost}h</strong> · Heuristic h(n): <strong>{selectedStage.heuristic_remaining}h</strong> · Total f(n): <strong>{selectedStage.f_score}h</strong>
                </small>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#475569' }}>{selectedStage.description}</p>
              </div>
              <button type="button" className="text-btn" onClick={() => setSelectedTaskId(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* State-Space Roadmap Flow Visualization (Milestone Cards) */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <div className="workflow-roadmap-card">
          <div className="roadmap-header">
            <div>
              <h4>Optimal Application Roadmap: {output.scheme_name}</h4>
              <p className="subtext">
                Reconstructed optimal path through prerequisite state-space using parent pointers.
              </p>
            </div>
          </div>

          {/* Sequential Task Stages */}
          <div className="workflow-stages-grid">
            {optimalPlan.map((stage, idx) => {
              const isCurrent = stage.task_id === currentTaskId
              const isCompleted = completedInStep.has(stage.task_id)

              return (
                <div
                  key={idx}
                  className={`stage-step-card ${isCurrent ? 'stage-current' : isCompleted ? 'stage-completed' : 'stage-pending'}`}
                  onClick={() => setSelectedTaskId(stage.task_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stage-card-top">
                    <span className="step-num-badge">#{stage.step_number || idx + 1}</span>
                    <span className="task-id-tag">{stage.task_id}</span>
                    <span className="stage-effort-tag">{stage.cost_hours} hrs</span>
                  </div>

                  <h5>{stage.title}</h5>
                  <p>{stage.description}</p>

                  <div className="cost-breakdown-box">
                    <div className="f-formula">
                      <span className="g-val" title="Cost incurred from start to this node">
                        g(n): <strong>{stage.cumulative_cost}h</strong>
                      </span>
                      <span>+</span>
                      <span className="h-val" title="Admissible remaining cost estimate">
                        h(n): <strong>{stage.heuristic_remaining}h</strong>
                      </span>
                      <span>=</span>
                      <span className="f-val" title="Total estimated cost">
                        f(n): <strong>{stage.f_score}h</strong>
                      </span>
                    </div>
                  </div>

                  <div className="stage-status-indicator">
                    {isCurrent ? (
                      <span className="status-current"><span className="pulse-indicator" /> Current Active State</span>
                    ) : isCompleted ? (
                      <span className="status-done"><CheckCircle2 size={13} /> Completed</span>
                    ) : (
                      <span className="status-queued">Planned Milestone</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Priority Queue (Open Set) Inspector */}
      {activeStep.open_set_preview?.length > 0 && (
        <div className="open-set-card">
          <div className="open-set-header">
            <h5>Priority Queue (Open Set Frontier) at Step #{activeStep.step || 1}</h5>
            <small>Ordered by minimum f(n) = g(n) + h(n) in binary min-heap</small>
          </div>
          <div className="open-set-items">
            {activeStep.open_set_preview.map((item, pidx) => (
              <div key={pidx} className={`queue-entry-pill ${pidx === 0 ? 'min-f' : ''}`}>
                <span className="queue-rank">#{pidx + 1}</span>
                <span className="f-badge">f = {item.f_score}</span>
                <span className="gh-sub">(g: {item.g_score} + h: {item.h_score})</span>
                <span className="state-badge">{item.state_size} tasks done</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Controller */}
      <StepController
        totalSteps={exploredNodes.length}
        currentStep={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        stepDescription={activeStep.current_task ? `State: ${activeStep.current_task} (${activeStep.completed_tasks_count} tasks completed). g(n)=${activeStep.g_cost}h, h(n)=${activeStep.h_heuristic}h, f(n)=${activeStep.f_total}` : ''}
        logs={exploredNodes}
        logColumns={['Step', 'Current Task', 'g(n) Cost', 'h(n) Heuristic', 'f(n) Total', 'Open Set Size', 'Closed Set']}
        renderLogRow={(st, idx, isActive) => (
          <tr
            key={idx}
            className={isActive ? 'active-step-row' : ''}
            onClick={() => setCurrentStepIndex(idx)}
          >
            <td><code>#{st.step}</code></td>
            <td><strong>{st.current_task}</strong> ({st.completed_tasks_count} completed)</td>
            <td>{st.g_cost} hrs</td>
            <td>{st.h_heuristic} hrs</td>
            <td><strong>{st.f_total}</strong></td>
            <td>{st.open_set_size} in priority queue</td>
            <td>{st.closed_set_size} explored</td>
          </tr>
        )}
      />

      {/* Academic Explanation & Correctness Requirements */}
      <div className="algo-explanation-box">
        <strong>Academic Explanation &amp; Admissibility Guarantee:</strong> {output.explanation}
        <p className="note-text">
          <em>Disclaimer:</em> Planning costs represent estimated applicant preparation and administrative effort hours. These do not represent government sanction processing times or official DBT portal disbursement schedules.
        </p>
      </div>
    </div>
  )
}

