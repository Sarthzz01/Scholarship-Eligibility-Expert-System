import { useState, useMemo, useEffect } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FastForward,
  Filter,
  Layers,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react'
import StepController from './StepController'

export default function BFSVisualizer({
  output,
  onRun,
  loading = false,
  testProfile = {}
}) {
  const profile = (testProfile && typeof testProfile === 'object') ? testProfile : {}
  const profileState = profile.state || 'Maharashtra'
  const profileCategory = profile.category || 'OBC'
  const profileLevel = profile.course_level || 'Post-Matric'

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [startNodeId, setStartNodeId] = useState(output?.start_node_id || 'node:root')
  const [filterByProfile, setFilterByProfile] = useState(Boolean(output?.filter_by_profile))

  // Synchronize state whenever output from backend refreshes
  useEffect(() => {
    if (output?.start_node_id) {
      setStartNodeId(output.start_node_id)
    }
    if (output?.filter_by_profile !== undefined) {
      setFilterByProfile(Boolean(output.filter_by_profile))
    }
    setCurrentStepIndex(0)
    setSelectedNodeId(null)
  }, [output])

  if (!output) {
    if (loading) {
      return (
        <div className="algo-empty-placeholder">
          <div className="spinner" style={{ width: '38px', height: '38px', margin: '0 auto 14px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spinAnim 0.8s linear infinite' }} />
          <h4>Executing Breadth-First Search Traversal...</h4>
          <p>Constructing multi-level scholarship knowledge graph and exploring nodes level-by-level using a FIFO queue...</p>
        </div>
      )
    }

    return (
      <div className="algo-empty-placeholder">
        <Network size={36} />
        <h4>BFS Knowledge Graph Traversal Ready</h4>
        <p>Explore how Breadth-First Search systematically scans the scholarship hierarchy level-by-level using a FIFO queue frontier.</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => onRun({ start_node_id: 'node:root', filter_by_profile: false })}
          disabled={loading}
        >
          <Play size={16} /> {loading ? 'Traversing...' : 'Execute BFS Traversal from Root'}
        </button>
      </div>
    )
  }

  const safeNodes = Array.isArray(output.nodes) ? output.nodes : []
  const safeEdges = Array.isArray(output.edges) ? output.edges : []
  const safeSteps = Array.isArray(output.steps) ? output.steps : []
  const activeStep = safeSteps[currentStepIndex] || safeSteps[0] || {}

  // Active step details
  const currentNodeId = activeStep.current_node || null
  const queueSet = new Set(Array.isArray(activeStep.queue) ? activeStep.queue.map(q => (typeof q === 'object' && q !== null ? q.id : q)) : [])
  const visitedSet = new Set(Array.isArray(activeStep.visited_nodes) ? activeStep.visited_nodes : [])
  const newlyEnqueuedSet = new Set(Array.isArray(activeStep.newly_enqueued) ? activeStep.newly_enqueued : [])
  const prunedNodesList = Array.isArray(activeStep.pruned_nodes) ? activeStep.pruned_nodes : []

  // Dynamic candidate starting nodes for dropdown
  const availableStartNodes = useMemo(() => {
    if (Array.isArray(output.available_start_nodes) && output.available_start_nodes.length > 0) {
      return output.available_start_nodes
    }
    return safeNodes
      .filter(n => n && (n.level ?? 0) < 4)
      .map(n => ({
        id: n.id,
        label: `[L${n.level ?? 0}] ${n.label || n.id}`,
        level: n.level ?? 0,
        type: n.type || 'generic'
      }))
      .sort((a, b) => (a.level || 0) - (b.level || 0) || String(a.label || '').localeCompare(String(b.label || '')))
  }, [output.available_start_nodes, safeNodes])

  // Traversal order sequence up to active step
  const traversalOrder = useMemo(() => {
    const list = []
    for (let i = 0; i <= currentStepIndex && i < safeSteps.length; i++) {
      const cNode = safeSteps[i]?.current_node
      if (cNode && !list.includes(cNode)) {
        list.push(cNode)
      }
    }
    return list
  }, [currentStepIndex, safeSteps])

  // Canvas Layout Coordinates
  const width = 940
  const height = 480
  const levelY = { 0: 45, 1: 135, 2: 235, 3: 335, 4: 430 }

  // Group nodes by level (0 to 4)
  const levels = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  safeNodes.forEach(n => {
    if (!n) return
    const lvl = Math.min(4, Math.max(0, Number(n.level) || 0))
    levels[lvl].push(n)
  })

  // Compute node coordinates
  const nodePositions = {}
  Object.keys(levels).forEach(lvl => {
    const lvlNodes = levels[lvl]
    const count = lvlNodes.length
    lvlNodes.forEach((node, idx) => {
      const x = count === 1 ? width / 2 : ((idx + 1) * width) / (count + 1)
      const y = levelY[lvl] || 240
      nodePositions[node.id] = { x, y, node }
    })
  })

  const selectedNode = selectedNodeId ? safeNodes.find(n => n.id === selectedNodeId) : null
  const activeNodeObj = safeNodes.find(n => n.id === currentNodeId)
  const activeLevel = activeNodeObj?.level ?? 0

  // Discovered scheme leaf nodes at active step vs total
  const discoveredSchemes = useMemo(() => {
    return safeNodes.filter(n => n && n.type === 'scheme' && visitedSet.has(n.id))
  }, [safeNodes, visitedSet])

  const totalSchemesInGraph = useMemo(() => {
    return safeNodes.filter(n => n && n.type === 'scheme')
  }, [safeNodes])

  // Handlers
  function handleRunTraversal(customStartNode = startNodeId, customFilter = filterByProfile) {
    onRun({
      start_node_id: customStartNode,
      filter_by_profile: customFilter
    })
  }

  function handleJumpToFinal() {
    if (safeSteps.length > 0) {
      setCurrentStepIndex(safeSteps.length - 1)
    }
  }

  function handleTraverseFromSelected() {
    if (selectedNode) {
      setStartNodeId(selectedNode.id)
      handleRunTraversal(selectedNode.id, filterByProfile)
    }
  }

  return (
    <div className="bfs-visualizer-container">
      {/* Top Controls Bar with Start Node Selector & Mode Switch */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left Side: Starting Node & Filter Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>BFS Starting Node:</strong>
            <select
              value={startNodeId}
              onChange={e => setStartNodeId(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontWeight: 500,
                color: '#1e293b',
                maxWidth: '320px'
              }}
            >
              {availableStartNodes.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switch Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '3px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setFilterByProfile(false)}
              style={{
                border: 'none',
                background: !filterByProfile ? 'var(--primary)' : 'transparent',
                color: !filterByProfile ? '#ffffff' : '#64748b',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: !filterByProfile ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Traverse all levels and branches without filtering"
            >
              Full Catalog (All)
            </button>
            <button
              type="button"
              onClick={() => setFilterByProfile(true)}
              style={{
                border: 'none',
                background: filterByProfile ? 'var(--primary)' : 'transparent',
                color: filterByProfile ? '#ffffff' : '#64748b',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: filterByProfile ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={`Prune branches outside applicant scope (${profileState} / ${profileCategory})`}
            >
              <Filter size={12} /> Profile-Scoped
            </button>
          </div>

          {filterByProfile && (
            <span style={{ fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Filtering: {profileState} · {profileCategory} · {profileLevel}
            </span>
          )}
        </div>

        {/* Right Side: Action Trigger Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleJumpToFinal}
            disabled={loading || safeSteps.length <= 1 || currentStepIndex === safeSteps.length - 1}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Fast forward to final traversal state showing all reached nodes"
          >
            <FastForward size={14} /> Jump to Final State
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => handleRunTraversal(startNodeId, filterByProfile)}
            disabled={loading}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Play size={13} /> {loading ? 'Running Traversal...' : 'Execute BFS Traversal'}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="algo-metrics-strip">
        <div className="metric-box">
          <span className="metric-label">Nodes Visited</span>
          <span className="metric-val text-primary">{visitedSet.size} / {safeNodes.length}</span>
          <small className="metric-sub">FIFO Dequeued</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Edges Examined</span>
          <span className="metric-val">{activeStep.edges_examined || 0} / {safeEdges.length}</span>
          <small className="metric-sub">Graph Connections</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Current Queue Frontier</span>
          <span className="metric-val text-warn">{activeStep.queue_size ?? queueSet.size}</span>
          <small className="metric-sub">Pending Nodes</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Peak Queue Memory</span>
          <span className="metric-val">{output.max_queue_size || 0}</span>
          <small className="metric-sub">Max Frontier Size</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Schemes Discovered</span>
          <span className="metric-val text-success">{discoveredSchemes.length} / {totalSchemesInGraph.length}</span>
          <small className="metric-sub">Level 4 Leaves Reached</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Execution Time</span>
          <span className="metric-val">{output.traversal_duration_ms || 0} ms</span>
          <small className="metric-sub">FIFO Traversal Latency</small>
        </div>
      </div>

      {/* Graph Visualizer Canvas Card */}
      <div className="graph-canvas-card">
        <div className="graph-card-header">
          <div className="graph-legend">
            <span className="legend-item"><span className="legend-indicator unvisited" /> Unvisited</span>
            <span className="legend-item"><span className="legend-indicator in-queue" /> In Queue (FIFO)</span>
            <span className="legend-item"><span className="legend-indicator current" /> Current Dequeued</span>
            <span className="legend-item"><span className="legend-indicator visited" /> Fully Visited</span>
          </div>

          <div className="level-indicators">
            <span style={activeLevel === 0 ? { fontWeight: 700, color: 'var(--primary)' } : {}}>L0: Root</span>
            <span>→</span>
            <span style={activeLevel === 1 ? { fontWeight: 700, color: 'var(--primary)' } : {}}>L1: Scope</span>
            <span>→</span>
            <span style={activeLevel === 2 ? { fontWeight: 700, color: 'var(--primary)' } : {}}>L2: Category</span>
            <span>→</span>
            <span style={activeLevel === 3 ? { fontWeight: 700, color: 'var(--primary)' } : {}}>L3: Level</span>
            <span>→</span>
            <span style={activeLevel === 4 ? { fontWeight: 700, color: 'var(--primary)' } : {}}>L4: Scheme</span>
          </div>
        </div>

        {/* Live FIFO Queue Ribbon */}
        <div className="fifo-queue-ribbon">
          <span className="queue-title"><strong>FIFO Queue Frontier:</strong> [Head / Next Dequeue →</span>
          {Array.isArray(activeStep.queue) && activeStep.queue.length > 0 ? (
            <div className="queue-chips-scroll">
              {activeStep.queue.map((qItem, idx) => {
                const qId = typeof qItem === 'object' && qItem !== null ? qItem.id : qItem
                const found = safeNodes.find(n => n.id === qId)
                const qLabel = found?.label || (typeof qItem === 'object' && qItem !== null ? qItem.label : String(qItem || ''))
                const isJustEnqueued = newlyEnqueuedSet.has(qId)
                return (
                  <span
                    key={idx}
                    className={`queue-pill ${idx === 0 ? 'head' : ''} ${isJustEnqueued ? 'newly-added' : ''}`}
                    onClick={() => setSelectedNodeId(qId)}
                    title={`Click to inspect node: ${qLabel}`}
                  >
                    #{idx + 1} {qLabel.length > 22 ? `${qLabel.slice(0, 20)}…` : qLabel}
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="queue-empty-text">Queue is currently empty (Frontier exhausted or traversal complete)</span>
          )}
          <span className="queue-title">→ Tail / Enqueue]</span>
        </div>

        {/* Pruned Nodes Callout Ribbon (if branches were pruned in profile mode) */}
        {prunedNodesList.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '6px',
            marginBottom: '10px',
            fontSize: '12px',
            color: '#9f1239'
          }}>
            <Filter size={14} />
            <strong>Pruned Branches at this step ({prunedNodesList.length}):</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {prunedNodesList.map((pn, pidx) => (
                <span key={pidx} style={{ background: '#ffe4e6', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>
                  {typeof pn === 'object' && pn !== null ? `${pn.label || pn.id}: ${pn.reason || ''}` : String(pn)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Traversal Order Ribbon */}
        {traversalOrder.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            borderBottom: '1px solid #f1f5f9',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
              FIFO Dequeue Order ({traversalOrder.length}):
            </span>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {traversalOrder.map((tItem, idx) => {
                const tId = typeof tItem === 'object' && tItem !== null ? tItem.id : tItem
                const tNode = safeNodes.find(n => n.id === tId)
                const tLabel = tNode?.label || (typeof tItem === 'object' && tItem !== null ? tItem.label : String(tItem || ''))
                const isHead = tId === currentNodeId
                return (
                  <span
                    key={idx}
                    style={{
                      background: isHead ? 'var(--primary)' : '#e2e8f0',
                      color: isHead ? '#ffffff' : '#334155',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedNodeId(tId)}
                    title={`Step #${idx + 1}: ${tLabel}`}
                  >
                    {idx + 1}. {tLabel.length > 18 ? `${tLabel.slice(0, 16)}…` : tLabel}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Interactive SVG Knowledge Graph */}
        <div className="svg-canvas-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg">
            <defs>
              <linearGradient id="bfsEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Level Background Guidelines */}
            {[0, 1, 2, 3, 4].map(lvl => (
              <g key={`lvl-guide-${lvl}`}>
                <line
                  x1={30}
                  y1={levelY[lvl] || 240}
                  x2={width - 30}
                  y2={levelY[lvl] || 240}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text x={12} y={(levelY[lvl] || 240) + 4} fill="#94a3b8" fontSize="10" fontWeight="bold">
                  L{lvl}
                </text>
              </g>
            ))}

            {/* Edges */}
            {safeEdges.map((e, idx) => {
              const fromPos = nodePositions[e.from]
              const toPos = nodePositions[e.to]
              if (!fromPos || !toPos) return null

              const isTraversedEdge = visitedSet.has(e.from) && (visitedSet.has(e.to) || queueSet.has(e.to))
              const isCurrentEdge = e.from === currentNodeId

              return (
                <line
                  key={`edge-${idx}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  className={`graph-edge ${isTraversedEdge ? 'traversed' : ''} ${isCurrentEdge ? 'active-edge' : ''}`}
                  strokeWidth={isCurrentEdge ? 2.5 : isTraversedEdge ? 2 : 1.2}
                />
              )
            })}

            {/* Nodes */}
            {Object.entries(nodePositions).map(([nodeId, pos]) => {
              const node = pos?.node || {}
              const isCurrent = nodeId === currentNodeId
              const isInQueue = queueSet.has(nodeId)
              const isVisited = visitedSet.has(nodeId)
              const isSelected = selectedNodeId === nodeId
              const isStartNode = nodeId === (output.start_node_id || startNodeId)
              const nodeLabel = String(node.label || node.id || '')

              let stateClass = 'unvisited'
              if (isCurrent) stateClass = 'current-node'
              else if (isInQueue) stateClass = 'in-queue-node'
              else if (isVisited) stateClass = 'visited-node'

              return (
                <g
                  key={nodeId}
                  className={`graph-node-group ${stateClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedNodeId(nodeId)}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Start Node Outer Halo */}
                  {isStartNode && (
                    <circle
                      r={node.type === 'scheme' ? 22 : 25}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  )}

                  <circle
                    r={node.type === 'scheme' ? 16 : node.type === 'root' ? 20 : 16}
                    className="node-circle"
                  />
                  <text y={4} className="node-icon-text">
                    {node.type === 'root' ? 'KB' : node.type === 'scheme' ? '★' : `L${node.level ?? 0}`}
                  </text>
                  <text y={28} className="node-label-text">
                    {nodeLabel.length > 20 ? `${nodeLabel.slice(0, 18)}…` : nodeLabel}
                  </text>
                  {isStartNode && (
                    <text y={-22} fontSize="9" fontWeight="bold" fill="#8b5cf6" textAnchor="middle">
                      START
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Selected Node Details Bar & Actions */}
        {selectedNode && (
          <div className="node-inspector-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>{selectedNode.label || selectedNode.id}</strong>
              <small>
                Type: <code>{selectedNode.type}</code> · Level {selectedNode.level ?? 0} · Node ID: <code>{selectedNode.id}</code>
                {selectedNode.state && ` · Scope: ${selectedNode.state}`}
                {selectedNode.category && ` · Category: ${selectedNode.category}`}
                {selectedNode.course_level && ` · Level: ${selectedNode.course_level}`}
                {selectedNode.award_amount && ` · Benefit: ₹${Number(selectedNode.award_amount).toLocaleString('en-IN')}`}
              </small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(selectedNode.level ?? 0) < 4 && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleTraverseFromSelected}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  title="Run BFS starting exploration from this specific node"
                >
                  <Play size={11} /> Traverse BFS from this Node
                </button>
              )}
              <button
                type="button"
                className="text-btn"
                onClick={() => setSelectedNodeId(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discovered Schemes Showcase Panel */}
      <div className="notif-section-card" style={{ marginTop: '16px', marginBottom: '16px' }}>
        <div className="notif-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#16a34a' }} />
            <h4>Discovered Schemes via BFS Traversal ({discoveredSchemes.length} / {totalSchemesInGraph.length})</h4>
          </div>
          {discoveredSchemes.length < totalSchemesInGraph.length && (
            <button
              type="button"
              className="secondary-button"
              onClick={handleJumpToFinal}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              View All Discovered ({totalSchemesInGraph.length}) →
            </button>
          )}
        </div>

        {discoveredSchemes.length === 0 ? (
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Currently at Step {currentStepIndex + 1} (Level {activeLevel}). Use the Step Controller below to advance through the FIFO queue, or click <strong>Jump to Final State</strong> to instantly reveal all discovered candidate schemes.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {discoveredSchemes.map((sNode, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedNodeId(sNode.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#166534' }}>{sNode.label || sNode.name || `Scheme #${sNode.id}`}</strong>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    L4 Leaf
                  </span>
                </div>
                {sNode.award_amount && (
                  <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                    Benefit: ₹{Number(sNode.award_amount).toLocaleString('en-IN')}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  Discovered via BFS FIFO dequeuing from parent category and education nodes.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step Controller */}
      <StepController
        totalSteps={safeSteps.length}
        currentStep={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        stepDescription={activeStep.action || ''}
        logs={safeSteps}
        logColumns={['Step', 'Current Dequeued Node', 'Action Taken', 'Queue State', 'Visited']}
        renderLogRow={(st, idx, isActive) => (
          <tr
            key={idx}
            className={isActive ? 'active-step-row' : ''}
            onClick={() => setCurrentStepIndex(idx)}
          >
            <td><code>#{st?.step ?? idx + 1}</code></td>
            <td><strong>{String(st?.current_node || '')}</strong></td>
            <td>{String(st?.action || '')}</td>
            <td>
              <span className="queue-chip">
                [{Array.isArray(st?.queue) ? st.queue.slice(0, 3).map(q => (typeof q === 'object' && q !== null ? q.label || q.id : String(q || ''))).join(', ') : ''}
                {Array.isArray(st?.queue) && st.queue.length > 3 ? '...' : ''}]
              </span>
            </td>
            <td>{st?.visited_count ?? 0}</td>
          </tr>
        )}
      />

      {/* Academic Explanation Box */}
      <div className="algo-explanation-box">
        <strong>Academic Explanation &amp; Scholarship Use Case:</strong> {output.explanation}
        <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
          <em>Algorithmic Property:</em> BFS explores the scholarship opportunity graph breadth-wise level-by-level using a FIFO queue. It guarantees shallowest discovery order ($O(V + E)$ time, $O(V)$ space), filtering candidate schemes by jurisdiction and social category before detailed antecedent verification by the rule engine.
        </p>
      </div>
    </div>
  )
}
