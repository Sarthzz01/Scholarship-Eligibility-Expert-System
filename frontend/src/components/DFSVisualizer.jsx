import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  CornerDownRight,
  GitBranch,
  Layers,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
  HelpCircle,
  ArrowDown,
  ArrowRight,
  Info
} from 'lucide-react'
import StepController from './StepController'

export default function DFSVisualizer({
  output,
  onRun,
  loading = false
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [viewMode, setViewMode] = useState('graph') // 'graph' | 'matrix' | 'cards' | 'both'

  if (!output) {
    return (
      <div className="algo-empty-placeholder">
        <GitBranch size={32} />
        <h4>DFS Decision Tree Search Ready</h4>
        <p>Explore how Depth-First Search plunges deep down condition branches, handles branch evaluations, and records backtracking when boundaries are reached.</p>
        <button type="button" className="primary-button" onClick={onRun} disabled={loading}>
          <Play size={16} /> {loading ? 'Searching...' : 'Execute DFS Tree Search'}
        </button>
      </div>
    )
  }

  const treeNodes = output.tree_nodes || []
  const treeEdges = output.tree_edges || []
  const steps = output.steps || []
  const activeStep = steps[currentStepIndex] || steps[0] || {}

  const activeStack = activeStep.stack || []
  const activeStackSet = new Set(activeStack)
  const isBacktrackingStep = Boolean(activeStep.backtrack)
  const currentNodeId = activeStep.current_node

  // Rule evaluations mapping
  const ruleEvals = output.rule_evaluations || []
  const traversalOrder = output.traversal_order || []

  // All visited nodes up to the current step
  const visitedUpToStep = new Set()
  for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
    if (steps[i].current_node) visitedUpToStep.add(steps[i].current_node)
  }

  // --- Graph Coordinate Layout for Decision Tree ---
  // Layout arranges:
  // - Root at top center (x = 300, y = 50)
  // - Conditions in a left spine (x = 300, y = 50 + idx * 85)
  // - Fail leaves in right column (x = 680, y = 50 + idx * 85)
  // - Goal leaf at bottom (x = 300, y = 50 + (condCount + 1) * 85)
  const condNodes = treeNodes.filter(n => n.type === 'condition')
  const condCount = condNodes.length || 1
  const width = 900
  const height = Math.max(500, 80 + (condCount + 2) * 85)

  const nodePositions = {}
  treeNodes.forEach(node => {
    if (node.type === 'root') {
      nodePositions[node.id] = { x: 300, y: 50, node }
    } else if (node.type === 'condition') {
      const cIdx = condNodes.findIndex(cn => cn.id === node.id)
      const idx = cIdx >= 0 ? cIdx + 1 : (node.depth || 1)
      nodePositions[node.id] = { x: 300, y: 50 + idx * 85, node }
    } else if (node.type === 'terminal_fail') {
      const parts = node.id.split('_')
      const idx = parseInt(parts[2], 10) || 1
      nodePositions[node.id] = { x: 680, y: 50 + idx * 85, node }
    } else if (node.type === 'terminal_success') {
      nodePositions[node.id] = { x: 300, y: 50 + (condCount + 1) * 85, node }
    } else {
      nodePositions[node.id] = { x: 450, y: 100, node }
    }
  })

  const selectedNode = selectedNodeId ? treeNodes.find(n => n.id === selectedNodeId) : null
  const selectedEval = selectedNode ? ruleEvals.find(r => r.node_id === selectedNode.id) : null

  return (
    <div className="dfs-visualizer-container">
      {/* Metrics Bar */}
      <div className="algo-metrics-strip">
        <div className="metric-box">
          <span className="metric-label">Nodes Visited</span>
          <span className="metric-val text-primary">{visitedUpToStep.size} / {treeNodes.length}</span>
          <small className="metric-sub">LIFO Explored</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Edges Examined</span>
          <span className="metric-val">{output.edges_examined || treeEdges.length}</span>
          <small className="metric-sub">Branch Transitions</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Current Stack Depth</span>
          <span className="metric-val text-warn">{activeStack.length}</span>
          <small className="metric-sub">Active Recursion</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Max Stack Depth</span>
          <span className="metric-val">{output.max_stack_depth || 0}</span>
          <small className="metric-sub">Peak Tree Depth</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Backtracking Events</span>
          <span className="metric-val text-danger">{output.backtracks?.length || 0}</span>
          <small className="metric-sub">Branch Reversals</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Search Duration</span>
          <span className="metric-val">{output.traversal_duration_ms || 0} ms</span>
          <small className="metric-sub">Depth-First Time</small>
        </div>
      </div>

      {/* Live LIFO Recursion Stack Ribbon */}
      <div className="lifo-stack-ribbon">
        <span className="stack-title"><strong>LIFO Recursion Stack:</strong> [Top Frame</span>
        {activeStack.length > 0 ? (
          <div className="stack-chips-scroll">
            {[...activeStack].reverse().map((sId, idx) => {
              const nodeInfo = treeNodes.find(n => n.id === sId) || { label: sId }
              return (
                <span
                  key={idx}
                  className={`stack-pill ${idx === 0 ? 'top-frame' : ''}`}
                  onClick={() => setSelectedNodeId(sId)}
                >
                  {idx === 0 && '⚡ '}Depth {activeStack.length - idx}: {nodeInfo.label?.length > 25 ? `${nodeInfo.label.slice(0, 23)}…` : nodeInfo.label}
                </span>
              )
            })}
          </div>
        ) : (
          <span className="stack-empty-text">Stack is currently empty (Traversal complete)</span>
        )}
        <span className="stack-title">→ Base]</span>
      </div>

      {/* Sequential Traversal Order Ribbon */}
      {traversalOrder.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', flexShrink: 0 }}>
            <strong>DFS Discovery Order:</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {traversalOrder.map((nodeId, idx) => {
              const node = treeNodes.find(n => n.id === nodeId) || { label: nodeId, type: 'condition' }
              const isCurrent = nodeId === currentNodeId
              const isVisited = visitedUpToStep.has(nodeId)
              return (
                <span
                  key={idx}
                  onClick={() => setSelectedNodeId(nodeId)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: isCurrent ? '#dbeafe' : isVisited ? '#f0fdf4' : '#f8fafc',
                    borderColor: isCurrent ? '#2563eb' : isVisited ? '#86efac' : '#cbd5e1',
                    color: isCurrent ? '#1d4ed8' : isVisited ? '#166534' : '#64748b'
                  }}
                  title={node.label}
                >
                  {idx + 1}. {node.label.length > 18 ? `${node.label.slice(0, 16)}…` : node.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Backtracking Live Callout Banner */}
      {isBacktrackingStep && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          borderLeft: '4px solid #ef4444',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '12px',
          color: '#991b1b',
          fontSize: '12px'
        }}>
          <CornerDownRight size={18} style={{ color: '#ef4444', transform: 'rotate(180deg)' }} />
          <div>
            <strong>Backtracking In Progress:</strong>
            <span> Reached boundary or terminal branch at <code>{activeStep.parent || 'child leaf'}</code>. Popping frame from call stack and retreating up to <code>{activeStep.current_node}</code>.</span>
          </div>
        </div>
      )}

      {/* View Toggle Bar */}
      <div className="table-controls-bar" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#1e293b' }}>
            Decision Tree: {output.scheme_name}
          </strong>
          <span className={`dt-outcome-badge ${output.overall_result?.includes('Potential') ? 'good' : 'bad'}`}>
            {output.overall_result}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            Interactive Tree Graph
          </button>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            Branch Matrix
          </button>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Decision Cards
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

      {/* Interactive SVG Tree Graph */}
      {(viewMode === 'graph' || viewMode === 'both') && (
        <div className="graph-canvas-card">
          <div className="graph-card-header">
            <div className="graph-legend">
              <span className="legend-item"><span className="legend-indicator unvisited" /> Unvisited</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#ede9fe', border: '1px solid #7c3aed' }} /> In Stack (LIFO)</span>
              <span className="legend-item"><span className="legend-indicator current" /> Current Visit</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#fee2e2', border: '1px solid #ef4444' }} /> Backtracking</span>
              <span className="legend-item"><span className="legend-indicator" style={{ background: '#dcfce7', border: '1px solid #10b981' }} /> Evaluated Passed</span>
            </div>

            <div className="level-indicators">
              <span style={{ color: '#16a34a', fontWeight: 600 }}>↓ Green Line: Satisfied (Pass)</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>→ Red Line: Violated (Fail)</span>
            </div>
          </div>

          {/* Interactive SVG Graph */}
          <div className="svg-canvas-wrapper">
            <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg">
              {/* Definitions for arrowheads */}
              <defs>
                <marker id="arrow-pass" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrow-fail" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                <marker id="arrow-default" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
              </defs>

              {/* Background Depth Guidelines */}
              {condNodes.map((cn, idx) => {
                const y = 50 + (idx + 1) * 85
                return (
                  <g key={`guideline-${idx}`} opacity="0.4">
                    <line x1="30" y1={y} x2={width - 30} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="35" y={y - 6} fill="#94a3b8" fontSize="10" fontWeight="600">
                      Rule Stage #{idx + 1}
                    </text>
                  </g>
                )
              })}

              {/* Directed Edges */}
              {treeEdges.map((e, idx) => {
                const fromPos = nodePositions[e.from]
                const toPos = nodePositions[e.to]
                if (!fromPos || !toPos) return null

                const isPassEdge = e.label === 'passes' || e.label === 'next'
                const isFailEdge = e.label === 'fails'

                const isTraversed = visitedUpToStep.has(e.from) && visitedUpToStep.has(e.to)
                const isCurrentEdge = (e.from === currentNodeId && activeStack.includes(e.to)) ||
                                     (e.to === currentNodeId && e.from === activeStep.parent)
                const isBacktrackEdge = isBacktrackingStep &&
                                       ((e.from === currentNodeId && e.to === activeStep.parent) ||
                                        (e.to === currentNodeId && e.from === activeStep.parent))

                // Midpoint for label
                const midX = (fromPos.x + toPos.x) / 2
                const midY = (fromPos.y + toPos.y) / 2

                const strokeColor = isBacktrackEdge ? '#ef4444' :
                                   isCurrentEdge ? '#2563eb' :
                                   isPassEdge ? (isTraversed ? '#10b981' : '#a7f3d0') :
                                   isFailEdge ? (isTraversed ? '#ef4444' : '#fecaca') : '#cbd5e1'

                const markerEnd = isPassEdge ? 'url(#arrow-pass)' : isFailEdge ? 'url(#arrow-fail)' : 'url(#arrow-default)'

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={strokeColor}
                      strokeWidth={isCurrentEdge || isBacktrackEdge ? 3.5 : isTraversed ? 2.5 : 1.5}
                      strokeDasharray={isFailEdge ? '5 4' : isBacktrackEdge ? '4 4' : undefined}
                      markerEnd={markerEnd}
                      className={isBacktrackEdge ? 'graph-edge backtrack-edge' : isCurrentEdge ? 'graph-edge active-edge' : 'graph-edge'}
                    />
                    {e.label && (
                      <g transform={`translate(${midX + (fromPos.x !== toPos.x ? 0 : 20)}, ${midY - 4})`}>
                        <rect
                          x={-28}
                          y={-10}
                          width={56}
                          height={16}
                          rx={3}
                          fill="#ffffff"
                          stroke={isPassEdge ? '#bbf7d0' : isFailEdge ? '#fecaca' : '#e2e8f0'}
                        />
                        <text
                          x={0}
                          y={2}
                          fontSize={9}
                          fontWeight={700}
                          fill={isPassEdge ? '#166534' : isFailEdge ? '#991b1b' : '#64748b'}
                          textAnchor="middle"
                        >
                          {e.label === 'passes' ? '✓ PASS' : e.label === 'fails' ? '✗ FAIL' : 'NEXT'}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Tree Nodes */}
              {Object.entries(nodePositions).map(([nodeId, pos]) => {
                const node = pos.node
                const isCurrent = nodeId === currentNodeId
                const isInStack = activeStackSet.has(nodeId)
                const isVisited = visitedUpToStep.has(nodeId)
                const isSelected = selectedNodeId === nodeId
                const isBacktrackedNow = isBacktrackingStep && isCurrent

                let stateClass = 'unvisited'
                if (isBacktrackedNow) stateClass = 'backtrack-node'
                else if (isCurrent) stateClass = 'current-node'
                else if (isInStack) stateClass = 'in-stack-node'
                else if (isVisited) stateClass = 'visited-node'

                if (node.type === 'terminal_fail') stateClass += ' terminal-fail'
                if (node.type === 'terminal_success') stateClass += ' terminal-success'

                // Display badge/icon text
                let iconText = 'C'
                if (node.type === 'root') iconText = 'KB'
                else if (node.type === 'terminal_fail') iconText = '✗'
                else if (node.type === 'terminal_success') iconText = '★'
                else if (node.type === 'condition') {
                  const parts = node.id.split('_')
                  iconText = `R${parts[2] || node.depth}`
                }

                return (
                  <g
                    key={nodeId}
                    className={`graph-node-group ${stateClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNodeId(nodeId)}
                    transform={`translate(${pos.x}, ${pos.y})`}
                  >
                    <circle
                      r={node.type === 'root' ? 20 : node.type === 'condition' ? 18 : 16}
                      className="node-circle"
                    />
                    <text y={4} className="node-icon-text">
                      {iconText}
                    </text>
                    <text
                      y={node.type === 'terminal_fail' ? 4 : 32}
                      x={node.type === 'terminal_fail' ? 26 : 0}
                      textAnchor={node.type === 'terminal_fail' ? 'start' : 'middle'}
                      className="node-label-text"
                    >
                      {node.label.length > 32 ? `${node.label.slice(0, 30)}…` : node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Selected Node Details Bar */}
          {selectedNode && (
            <div className="node-inspector-bar">
              <div>
                <strong>{selectedNode.label}</strong>
                <small>
                  Type: <code>{selectedNode.type}</code> · Depth: {selectedNode.depth} · Node ID: <code>{selectedNode.id}</code>
                  {selectedNode.field && ` · Field: ${selectedNode.field} (${selectedNode.operator} ${JSON.stringify(selectedNode.expected)})`}
                  {selectedEval && ` · Result: ${selectedEval.satisfied ? 'Satisfied' : 'Violated'} (Actual: ${JSON.stringify(selectedEval.actual)})`}
                </small>
              </div>
              <button type="button" className="text-btn" onClick={() => setSelectedNodeId(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Decision Matrix & Explored Branches View */}
      {(viewMode === 'matrix' || viewMode === 'both') && (
        <div className="decision-tree-card">
          <div className="dt-card-header">
            <div>
              <h4>Decision Tree Branches &amp; Applicant Evaluation Matrix</h4>
              <p className="subtext" style={{ margin: 0 }}>
                Verification results for each branch condition. If a rule fails, the DFS algorithm branches to a terminal failure node and records a backtrack action.
              </p>
            </div>
            <span className={`dt-outcome-badge ${output.overall_result?.includes('Potential') ? 'good' : 'bad'}`}>
              {output.overall_result}
            </span>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Rule</th>
                  <th>Condition Criteria</th>
                  <th>Student Fact (Actual)</th>
                  <th>Requirement</th>
                  <th>Branch Followed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {condNodes.map((cn, idx) => {
                  const ev = ruleEvals.find(r => r.node_id === cn.id)
                  const isPass = ev?.satisfied
                  return (
                    <tr key={cn.id} style={{ background: isPass ? '#f0fdf4' : ev ? '#fef2f2' : '#ffffff' }}>
                      <td><strong>R{idx + 1}</strong></td>
                      <td>
                        <strong>{cn.label}</strong>
                        <small style={{ display: 'block', color: '#64748b' }}>Field: <code>{cn.field}</code></small>
                      </td>
                      <td>
                        <code>{ev?.actual !== null && ev?.actual !== undefined ? JSON.stringify(ev.actual) : 'Not specified'}</code>
                      </td>
                      <td>
                        <code>{cn.operator} {JSON.stringify(cn.expected)}</code>
                      </td>
                      <td>
                        {isPass ? (
                          <span style={{ color: '#166534', fontWeight: 600, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowDown size={12} /> True Spine → Rule #{idx + 2}
                          </span>
                        ) : (
                          <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={12} /> False Leaf → Terminate
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isPass ? '#dcfce7' : '#fee2e2',
                          color: isPass ? '#166534' : '#991b1b',
                          border: `1px solid ${isPass ? '#86efac' : '#fecaca'}`
                        }}>
                          {isPass ? '✓ SATISFIED' : '✗ VIOLATED'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Tree Cards Flow */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <div className="decision-tree-card">
          <div className="dt-card-header">
            <div>
              <h4>Decision Tree Branches: {output.scheme_name}</h4>
              <p className="subtext">
                DFS explores condition branches depth-first until reaching a boundary, then backtracks to inspect alternative branches.
              </p>
            </div>
            <span className={`dt-outcome-badge ${output.overall_result?.includes('Potential') ? 'good' : 'bad'}`}>
              {output.overall_result}
            </span>
          </div>

          <div className="dt-nodes-flow">
            {treeNodes.map((node, idx) => {
              const isCurrent = node.id === currentNodeId
              const isInStack = activeStackSet.has(node.id)
              const isBacktrackedHere = isBacktrackingStep && isCurrent
              const ruleEval = ruleEvals.find(r => r.node_id === node.id)

              let cardState = 'unvisited'
              if (isCurrent) cardState = 'current'
              else if (isInStack) cardState = 'in-stack'

              return (
                <div
                  key={node.id}
                  className={`dt-node-card ${node.type} ${cardState} ${isBacktrackedHere ? 'backtracking-now' : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dt-node-header">
                    <span className="depth-badge">Depth {node.depth ?? idx}</span>
                    <span className="node-type-tag">{node.type}</span>
                    {isInStack && <span className="stack-status-badge">In Stack</span>}
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
                          <span>Actual: <code>{JSON.stringify(ruleEval.actual)}</code> ({ruleEval.status})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {node.type === 'terminal_success' && (
                    <div className="terminal-leaf pass-leaf">
                      <CheckCircle2 size={16} /> All mandatory conditions satisfied on this branch
                    </div>
                  )}

                  {node.type === 'terminal_fail' && (
                    <div className="terminal-leaf fail-leaf">
                      <XCircle size={16} /> Condition failed on this branch (Ineligible)
                    </div>
                  )}

                  {isBacktrackedHere && (
                    <div className="backtrack-alert">
                      <CornerDownRight size={13} /> Backtracking event: Returned from deeper child branch
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step Controller */}
      <StepController
        totalSteps={steps.length}
        currentStep={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        stepDescription={activeStep.action || ''}
        logs={steps}
        logColumns={['Step', 'Current Node', 'Action Taken', 'Stack Depth', 'Event Type']}
        renderLogRow={(st, idx, isActive) => (
          <tr
            key={idx}
            className={`${isActive ? 'active-step-row' : ''} ${st.backtrack ? 'backtrack-row' : ''}`}
            onClick={() => setCurrentStepIndex(idx)}
          >
            <td><code>#{st.step}</code></td>
            <td><strong>{st.current_node}</strong></td>
            <td>{st.action}</td>
            <td>Depth {st.stack_depth || st.stack?.length || 0}</td>
            <td>
              <span className={`pill ${st.backtrack ? 'warn' : 'good'}`}>
                {st.backtrack ? 'Backtrack' : 'Forward Visit'}
              </span>
            </td>
          </tr>
        )}
      />

      {/* Academic Distinction Callout */}
      <div className="algo-explanation-box">
        <strong>Academic Distinction:</strong> {output.explanation}
        <p className="note-text" style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
          <em>Viva Note:</em> DFS explores graph and tree connectivity in $O(V + E)$ time and $O(d)$ space bounded by maximum recursion depth. In classical expert systems, full eligibility requires satisfying all mandatory conditions simultaneously.
        </p>
      </div>
    </div>
  )
}

