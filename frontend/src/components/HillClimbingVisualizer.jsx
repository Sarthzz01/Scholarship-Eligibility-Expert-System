import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Minus,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
  XCircle,
  HelpCircle,
  BarChart3
} from 'lucide-react'
import StepController from './StepController'

export default function HillClimbingVisualizer({
  output,
  onRun,
  customWeights,
  onWeightsChange,
  loading = false
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showWeightSliders, setShowWeightSliders] = useState(false)
  const [activeTab, setActiveTab] = useState('chart') // 'chart' | 'matrix' | 'neighbors'

  if (!output) {
    return (
      <div className="algo-empty-placeholder">
        <TrendingUp size={32} />
        <h4>Steepest-Ascent Hill Climbing Ready</h4>
        <p>Optimize ranking permutations of eligible scholarships by iteratively evaluating adjacent transpositions to maximize multi-factor student utility.</p>
        <button type="button" className="primary-button" onClick={onRun} disabled={loading}>
          <Play size={16} /> {loading ? 'Climbing...' : 'Execute Hill Climbing'}
        </button>
      </div>
    )
  }

  if (output.status === 'empty') {
    return (
      <div className="algo-empty-placeholder">
        <XCircle size={32} />
        <h4>No Eligible Scholarships Found</h4>
        <p>{output.message}</p>
        <small>Adjust applicant test profile (e.g., lower income, match domicile) to generate candidate schemes eligible for ranking optimization.</small>
      </div>
    )
  }

  const steps = output.steps || []
  const activeStep = steps[currentStepIndex] || steps[0] || {}
  const finalRanking = output.final_ranking || []
  const baselineRanking = output.baseline_ranking || []
  const weights = output.weights || {}

  // --- SVG Chart Calculations ---
  const chartWidth = 860
  const chartHeight = 220
  const padding = { top: 30, right: 40, bottom: 40, left: 60 }

  const scores = steps.map(s => Number(s.score) || 0)
  const minScore = Math.floor(Math.min(...scores, Number(output.initial_score) || 0) * 0.95)
  const maxScore = Math.ceil(Math.max(...scores, Number(output.final_score) || 1) * 1.05)
  const scoreRange = Math.max(maxScore - minScore, 1)

  const stepCount = Math.max(steps.length - 1, 1)

  const getX = (idx) => padding.left + (idx / stepCount) * (chartWidth - padding.left - padding.right)
  const getY = (val) => chartHeight - padding.bottom - ((val - minScore) / scoreRange) * (chartHeight - padding.top - padding.bottom)

  const points = steps.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.score),
    step: s,
    idx
  }))

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = `${getX(0)},${chartHeight - padding.bottom} ${polylinePoints} ${getX(steps.length - 1)},${chartHeight - padding.bottom}`

  // Rank shift mapping
  const baselineRankMap = {}
  baselineRanking.forEach(r => {
    baselineRankMap[r.scheme_id] = r.rank
  })

  return (
    <div className="hc-visualizer-container">
      {/* Metrics Bar */}
      <div className="algo-metrics-strip">
        <div className="metric-box">
          <span className="metric-label">Initial DCG Score</span>
          <span className="metric-val">{output.initial_score || 0}</span>
          <small className="metric-sub">Starting Permutation</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Optimized Final Score</span>
          <span className="metric-val text-success">{output.final_score || 0}</span>
          <small className="metric-sub">Local Optimum Peak</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Improvement Achieved</span>
          <span className="metric-val text-primary">+{output.improvement_achieved || 0}</span>
          <small className="metric-sub">({output.improvement_percentage || 0}% Gain)</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Total Iterations</span>
          <span className="metric-val">{output.total_iterations || steps.length}</span>
          <small className="metric-sub">Ascent Cycles</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Neighbors Evaluated</span>
          <span className="metric-val text-warn">{output.total_neighbors_evaluated || 0}</span>
          <small className="metric-sub">Transpositions</small>
        </div>
        <div className="metric-box">
          <span className="metric-label">Execution Duration</span>
          <span className="metric-val">{output.execution_duration_ms || 0} ms</span>
          <small className="metric-sub">Combinatorial Search</small>
        </div>
      </div>

      {/* Configurable Multi-Factor Weights Banner */}
      <div className="weights-config-card">
        <div className="weights-card-top">
          <div className="weights-info">
            <span className="weights-title"><strong>Objective Utility Function:</strong> Discounted Cumulative Suitability (DCG)</span>
            <small>Score = Σ u(s) / log2(rank + 1) · Missing award data is strictly set to zero, never fabricated.</small>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowWeightSliders(!showWeightSliders)}
          >
            <Sliders size={14} /> {showWeightSliders ? 'Hide Weights' : 'Configure Weights'}
          </button>
        </div>

        {showWeightSliders && (
          <div className="weights-sliders-row">
            <div className="slider-item">
              <label>Award Amount: <strong>{Math.round((customWeights?.amount ?? weights.amount ?? 0.35) * 100)}%</strong></label>
              <input
                type="range"
                min="0.05"
                max="0.70"
                step="0.05"
                value={customWeights?.amount ?? weights.amount ?? 0.35}
                onChange={e => onWeightsChange('amount', Number(e.target.value))}
              />
            </div>
            <div className="slider-item">
              <label>Profile Match: <strong>{Math.round((customWeights?.profile_match ?? weights.profile_match ?? 0.25) * 100)}%</strong></label>
              <input
                type="range"
                min="0.05"
                max="0.70"
                step="0.05"
                value={customWeights?.profile_match ?? weights.profile_match ?? 0.25}
                onChange={e => onWeightsChange('profile_match', Number(e.target.value))}
              />
            </div>
            <div className="slider-item">
              <label>Deadline Urgency: <strong>{Math.round((customWeights?.deadline ?? weights.deadline ?? 0.20) * 100)}%</strong></label>
              <input
                type="range"
                min="0.05"
                max="0.70"
                step="0.05"
                value={customWeights?.deadline ?? weights.deadline ?? 0.20}
                onChange={e => onWeightsChange('deadline', Number(e.target.value))}
              />
            </div>
            <div className="slider-item">
              <label>Effort Burden: <strong>{Math.round((customWeights?.effort ?? weights.effort ?? 0.20) * 100)}%</strong></label>
              <input
                type="range"
                min="0.05"
                max="0.70"
                step="0.05"
                value={customWeights?.effort ?? weights.effort ?? 0.20}
                onChange={e => onWeightsChange('effort', Number(e.target.value))}
              />
            </div>
            <div className="apply-weights-btn-col">
              <button type="button" className="primary-button" onClick={onRun} disabled={loading}>
                Apply &amp; Re-optimize
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Landscape Progression & Candidate State at Current Step */}
      <div className="hc-landscape-card">
        <div className="landscape-header">
          <div>
            <h4>Iterative Search Landscape &amp; Candidate Permutations</h4>
            <p className="subtext">
              State at Step #{activeStep.iteration || 0}: Current Objective Score = <strong>{activeStep.score}</strong>
              {activeStep.improved && <span className="badge-improved">▲ Climbed</span>}
              {activeStep.terminated && <span className="badge-peak">★ {output.termination_reason || 'Local Optimum'}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <TrendingUp size={13} /> Ascent Chart
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              <BarChart3 size={13} /> Rank Comparison
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'neighbors' ? 'active' : ''}`}
              onClick={() => setActiveTab('neighbors')}
            >
              Neighbors ({activeStep.neighbors_evaluated?.length || 0})
            </button>
          </div>
        </div>

        {/* Current State Permutation Chips */}
        <div className="state-permutation-display">
          <span className="state-label">Ranking State Permutation at Step #{activeStep.iteration}:</span>
          <div className="state-chips">
            {activeStep.state_names?.map((name, sidx) => (
              <span key={sidx} className={`rank-chip ${sidx === 0 ? 'top-chip' : ''}`}>
                #{sidx + 1} {name}
              </span>
            ))}
          </div>
        </div>

        {/* SVG SCORE PROGRESSION LINE & AREA CHART */}
        {activeTab === 'chart' && (
          <div style={{ background: '#fafcff', border: '1px solid #eef2f8', borderRadius: '8px', padding: '12px 16px', margin: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#334155' }}>
                Objective Utility Ascent Function over Iterations
              </strong>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '2px', background: '#3b82f6', display: 'inline-block' }} /> DCG Curve
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Peak Optimum
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} /> Active Scrub Point
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="hcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, gi) => {
                const yVal = minScore + ratio * scoreRange
                const yPos = getY(yVal)
                return (
                  <g key={`grid-${gi}`}>
                    <line x1={padding.left} y1={yPos} x2={chartWidth - padding.right} y2={yPos} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x={padding.left - 8} y={yPos + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                      {yVal.toFixed(1)}
                    </text>
                  </g>
                )
              })}

              {/* Area Gradient Fill */}
              <polygon points={areaPoints} fill="url(#hcAreaGrad)" />

              {/* Line Stroke */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Current Step Vertical Marker */}
              {points[currentStepIndex] && (
                <g>
                  <line
                    x1={points[currentStepIndex].x}
                    y1={padding.top}
                    x2={points[currentStepIndex].x}
                    y2={chartHeight - padding.bottom}
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                </g>
              )}

              {/* Points on Curve */}
              {points.map((pt, pidx) => {
                const isCurrent = pidx === currentStepIndex
                const isPeak = pt.step.terminated
                return (
                  <g key={`pt-${pidx}`} style={{ cursor: 'pointer' }} onClick={() => setCurrentStepIndex(pidx)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? 7 : isPeak ? 6 : 4}
                      fill={isPeak ? '#ef4444' : isCurrent ? '#2563eb' : '#ffffff'}
                      stroke={isPeak ? '#991b1b' : isCurrent ? '#1d4ed8' : '#2563eb'}
                      strokeWidth={isCurrent || isPeak ? 2.5 : 2}
                    />
                    {/* Score Callout Label */}
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fontSize={isCurrent ? 11 : 9}
                      fontWeight={isCurrent ? 800 : 600}
                      fill={isCurrent ? '#1d4ed8' : '#64748b'}
                    >
                      {pt.step.score}
                    </text>
                    {/* X-Axis Iteration Label */}
                    <text
                      x={pt.x}
                      y={chartHeight - padding.bottom + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isCurrent ? 700 : 500}
                      fill={isCurrent ? '#1e293b' : '#94a3b8'}
                    >
                      Step #{pt.step.iteration}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}

        {/* Neighbors Evaluated & Rejected Alternatives Panel */}
        {activeTab === 'neighbors' && (
          <div className="neighbors-evaluation-panel" style={{ marginTop: '10px' }}>
            <h5>Neighborhood Search Space: Adjacent Swaps at Step #{activeStep.iteration}</h5>
            {activeStep.neighbors_evaluated?.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b' }}>No further improving adjacent swaps found. Local optimum achieved.</p>
            ) : (
              <div className="neighbors-grid">
                {activeStep.neighbors_evaluated?.map((n, nidx) => {
                  const isSelected = activeStep.chosen_swap &&
                    n.swap_indices[0] === activeStep.chosen_swap[0] &&
                    n.swap_indices[1] === activeStep.chosen_swap[1]

                  return (
                    <div key={nidx} className={`neighbor-item-card ${isSelected ? 'selected-neighbor' : 'rejected-neighbor'}`}>
                      <div className="neighbor-top">
                        <span className="swap-label">Swap Pos #{n.swap_indices[0] + 1} &amp; #{n.swap_indices[1] + 1}</span>
                        <span className={`delta-badge ${n.delta > 0 ? 'positive' : 'negative'}`}>
                          {n.delta > 0 ? `+${n.delta}` : n.delta}
                        </span>
                      </div>
                      <div className="swapped-schemes-text">
                        {n.swapped_names[0]} ↔ {n.swapped_names[1]}
                      </div>
                      <div className="neighbor-footer">
                        <span>Candidate Score: <strong>{n.score}</strong></span>
                        <span className={`verdict-tag ${isSelected ? 'chosen' : 'rejected'}`}>
                          {isSelected ? '✓ Chosen Next State' : '✗ Rejected Alternative'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Timeline Track Stepper */}
        <div className="hc-timeline-track">
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex
            return (
              <div
                key={idx}
                className={`timeline-step-node ${isCurrent ? 'active' : ''} ${st.terminated ? 'peak' : st.improved ? 'improved' : ''}`}
                onClick={() => setCurrentStepIndex(idx)}
              >
                <span className="node-iteration">Step {st.iteration}</span>
                <span className="node-score">{st.score}</span>
                {st.terminated && <span className="peak-star">★ Peak</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Controller */}
      <StepController
        totalSteps={steps.length}
        currentStep={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        stepDescription={activeStep.action || ''}
        logs={steps}
        logColumns={['Step', 'Action Taken', 'Objective Score', 'Neighbors Count', 'State']}
        renderLogRow={(st, idx, isActive) => (
          <tr
            key={idx}
            className={`${isActive ? 'active-step-row' : ''} ${st.terminated ? 'peak-row' : ''}`}
            onClick={() => setCurrentStepIndex(idx)}
          >
            <td><code>#{st.iteration}</code></td>
            <td>{st.action}</td>
            <td><strong>{st.score}</strong></td>
            <td>{st.neighbors_evaluated?.length || 0} adjacent swaps</td>
            <td><span className="state-chip-summary">{st.state_names?.join(' → ')}</span></td>
          </tr>
        )}
      />

      {/* Comparison: Hill Climbing vs Deterministic Greedy Sort */}
      <div className="hc-comparison-section">
        <div className="comparison-col">
          <div className="col-header">
            <h4>Hill Climbing Optimized Ranking</h4>
            <span className="score-pill">DCG Score: <strong>{output.final_score}</strong></span>
          </div>
          <div className="ranking-items-list">
            {finalRanking.map((r, i) => {
              const baseRank = baselineRankMap[r.scheme_id]
              const rankShift = baseRank ? baseRank - r.rank : 0

              return (
                <div key={i} className="ranking-item-card">
                  <span className="rank-number">#{r.rank}</span>
                  <div style={{ minWidth: '32px', textAlign: 'center' }}>
                    {rankShift > 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                        <ArrowUp size={14} /> +{rankShift}
                      </span>
                    ) : rankShift < 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                        <ArrowDown size={14} /> {rankShift}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                        <Minus size={14} />
                      </span>
                    )}
                  </div>
                  <div className="rank-info" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{r.scheme_name}</strong>
                      <span style={{ fontWeight: 700, color: '#166534', fontSize: '12px' }}>u(s) = {r.total_utility}</span>
                    </div>

                    {/* Proportional Component Utility Bars */}
                    <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#e2e8f0', margin: '6px 0', gap: '1px' }}>
                      <div style={{ width: `${(r.components?.amount_score || 0) * 100}%`, background: '#22c55e' }} title={`Benefit: ${r.components?.amount_score}`} />
                      <div style={{ width: `${(r.components?.profile_match_score || 0) * 100}%`, background: '#3b82f6' }} title={`Profile: ${r.components?.profile_match_score}`} />
                      <div style={{ width: `${(r.components?.deadline_score || 0) * 100}%`, background: '#f59e0b' }} title={`Deadline: ${r.components?.deadline_score}`} />
                      <div style={{ width: `${(r.components?.effort_score || 0) * 100}%`, background: '#8b5cf6' }} title={`Effort: ${r.components?.effort_score}`} />
                    </div>

                    <div className="utility-components-row">
                      <span className="u-tag" style={{ color: '#15803d' }}>₹{r.award_amount?.toLocaleString('en-IN')}</span>
                      <span className="u-tag">Profile: {r.components?.profile_match_score}</span>
                      <span className="u-tag">Deadline: {r.components?.deadline_score}</span>
                      <span className="u-tag">Effort: {r.effort_hours}h</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="comparison-col baseline-col">
          <div className="col-header">
            <h4>Greedy Sorting Baseline (Global Benchmark)</h4>
            <span className="score-pill baseline">DCG Score: <strong>{output.baseline_score}</strong></span>
          </div>
          <div className="ranking-items-list">
            {baselineRanking.map((r, i) => (
              <div key={i} className="ranking-item-card baseline-card">
                <span className="rank-number">#{r.rank}</span>
                <div className="rank-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{r.scheme_name}</strong>
                    <span style={{ fontWeight: 600, color: '#475569', fontSize: '12px' }}>u(s) = {r.total_utility}</span>
                  </div>
                  <div className="utility-components-row">
                    <span className="u-tag">₹{r.award_amount?.toLocaleString('en-IN')}</span>
                    <span className="u-tag">Effort: {r.effort_hours}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Explanation & Limitations */}
      <div className="algo-explanation-box">
        <strong>Academic Explanation &amp; Limitations:</strong> {output.explanation}
      </div>
    </div>
  )
}

