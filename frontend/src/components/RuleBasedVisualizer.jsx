import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle
} from 'lucide-react'
import StatusPill from './StatusPill'
import StepController from './StepController'
import { API_BASE, useAuth } from '../context/AuthContext'

export default function RuleBasedVisualizer({
  output,
  onRun,
  loading = false,
  schemes = [],
  testProfile = {}
}) {
  const { authFetch } = useAuth()
  const [inferenceMode, setInferenceMode] = useState('forward') // 'forward' | 'backward'
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState('ALL') // 'ALL', 'potential_match', 'ineligible', 'needs_information'

  // Backward Chaining state
  const [selectedSchemeIdForBC, setSelectedSchemeIdForBC] = useState(() => (schemes[0]?.id || 1))
  const [bcOutput, setBcOutput] = useState(null)
  const [bcLoading, setBcLoading] = useState(false)
  const [bcError, setBcError] = useState('')

  async function runBackwardChaining(targetId = selectedSchemeIdForBC) {
    setBcLoading(true)
    setBcError('')
    try {
      const res = await authFetch(`${API_BASE}/algorithms/backward-chaining`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheme_id: Number(targetId),
          student: testProfile
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Backward chaining proof failed')
      }
      setBcOutput(await res.json())
    } catch (err) {
      setBcError(err.message)
    } finally {
      setBcLoading(false)
    }
  }

  const traceSteps = output?.trace_steps || []
  const activeStep = traceSteps[currentStepIndex] || null

  const filteredResults = (output?.results || []).filter(r => {
    if (selectedSchemeFilter === 'ALL') return true
    return r.status === selectedSchemeFilter
  })

  return (
    <div className="rule-based-visualizer">
      {/* Inference Mode Switcher Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`filter-pill ${inferenceMode === 'forward' ? 'active' : ''}`}
            onClick={() => setInferenceMode('forward')}
          >
            <Sparkles size={14} /> Forward Chaining (Data-Driven Inference)
          </button>
          <button
            type="button"
            className={`filter-pill ${inferenceMode === 'backward' ? 'active' : ''}`}
            onClick={() => {
              setInferenceMode('backward')
              if (!bcOutput) runBackwardChaining(selectedSchemeIdForBC)
            }}
          >
            <Target size={14} /> Backward Chaining (Goal-Directed Deduction)
          </button>
        </div>
        {inferenceMode === 'forward' ? (
          <button type="button" className="small-action-btn" onClick={onRun} disabled={loading}>
            <Play size={13} /> {loading ? 'Evaluating...' : 'Re-run Forward Inference'}
          </button>
        ) : (
          <button type="button" className="small-action-btn" onClick={() => runBackwardChaining(selectedSchemeIdForBC)} disabled={bcLoading}>
            <Target size={13} /> {bcLoading ? 'Proving Goal...' : 'Execute Goal Proof'}
          </button>
        )}
      </div>

      {/* =========================================================================
          BACKWARD CHAINING VIEW
          ========================================================================= */}
      {inferenceMode === 'backward' && (
        <div className="tab-pane-fade">
          <div className="tab-intro-card" style={{ marginBottom: '16px' }}>
            <div className="intro-text">
              <h3>Goal-Directed Backward Chaining Engine</h3>
              <p>
                In backward chaining, the inference engine begins with a high-level goal hypothesis:
                <code>is_eligible(Student, Scholarship)</code>. It decomposes this hypothesis into subgoals
                corresponding to official criteria and searches working memory to prove each requirement.
              </p>
            </div>
            {schemes.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>Target Hypothesis:</span>
                <select
                  value={selectedSchemeIdForBC}
                  onChange={e => {
                    const newId = Number(e.target.value)
                    setSelectedSchemeIdForBC(newId)
                    runBackwardChaining(newId)
                  }}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.id}: {s.name} ({s.state})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {bcError && <div className="error-banner">{bcError}</div>}

          {bcLoading && (
            <div className="algo-empty-placeholder">
              <Clock size={32} />
              <h4>Proving Goal Stack...</h4>
              <p>Evaluating subgoals against student facts in working memory...</p>
            </div>
          )}

          {!bcLoading && bcOutput && (
            <div className="bc-goal-tree">
              {/* Top Goal Box */}
              <div className={`bc-top-goal-box ${bcOutput.proof_status}`}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Target size={18} style={{ color: bcOutput.proof_status === 'proven' ? '#16a34a' : bcOutput.proof_status === 'refuted' ? '#dc2626' : '#d97706' }} />
                    <strong style={{ fontSize: '16px', color: 'var(--text-heading)' }}>
                      Top Goal: {bcOutput.top_goal}
                    </strong>
                  </div>
                  <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {bcOutput.explanation}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`urgency-pill ${bcOutput.proof_status === 'proven' ? 'critical' : 'approaching'}`} style={{
                    background: bcOutput.proof_status === 'proven' ? '#dcfce7' : bcOutput.proof_status === 'refuted' ? '#fee2e2' : '#fef3c7',
                    color: bcOutput.proof_status === 'proven' ? '#166534' : bcOutput.proof_status === 'refuted' ? '#991b1b' : '#92400e',
                    border: '1px solid currentColor',
                    fontSize: '12px',
                    padding: '4px 12px'
                  }}>
                    {bcOutput.proof_status?.toUpperCase()}
                  </span>
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                    AY: {bcOutput.academic_year || '2024-25'} · v{bcOutput.rule_version || 1}
                  </small>
                </div>
              </div>

              {/* Missing facts warning */}
              {bcOutput.missing_facts?.length > 0 && (
                <div className="rule-validation-box invalid" style={{ margin: '10px 0' }}>
                  <CircleAlert size={16} />
                  <strong>Missing Facts in Working Memory:</strong>
                  <ul className="validation-issues-list">
                    {bcOutput.missing_facts.map((mf, i) => (
                      <li key={i}>{mf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subgoals Decomposition Tree */}
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-heading)' }}>
                  Subgoal Proof Hierarchy ({bcOutput.subgoals?.length || 0} Criteria)
                </h4>
                <div className="bc-subgoals-list">
                  {bcOutput.subgoals?.map((sg, idx) => (
                    <div key={idx} className={`bc-subgoal-node ${sg.status}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-heading)' }}>
                          Subgoal #{idx + 1}: <code>{sg.goal}</code>
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: sg.status === 'proven' ? '#dcfce7' : sg.status === 'refuted' ? '#fee2e2' : '#fef3c7',
                          color: sg.status === 'proven' ? '#166534' : sg.status === 'refuted' ? '#991b1b' : '#92400e'
                        }}>
                          {sg.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Fact Value: <strong>{sg.student_value !== null ? JSON.stringify(sg.student_value) : 'UNSPECIFIED'}</strong> · Required: <strong>{JSON.stringify(sg.required_value)}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{sg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal Stack Trace Table */}
              {bcOutput.goal_stack_trace?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', margin: '0 0 10px', color: 'var(--text-heading)' }}>
                    Backward Chaining Goal Stack Trace ({bcOutput.goal_stack_trace.length} Execution Steps)
                  </h4>
                  <table className="bc-goal-stack-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Step</th>
                        <th>Goal Stack Element</th>
                        <th>Resolution Action</th>
                        <th>Working Memory Evaluation</th>
                        <th style={{ width: '100px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bcOutput.goal_stack_trace.map(st => (
                        <tr key={st.step}>
                          <td><code>#{st.step}</code></td>
                          <td><strong>{st.goal}</strong></td>
                          <td>{st.action}</td>
                          <td>{st.result}</td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: st.status === 'proven' ? '#dcfce7' : st.status === 'refuted' ? '#fee2e2' : '#fef3c7',
                              color: st.status === 'proven' ? '#166534' : st.status === 'refuted' ? '#991b1b' : '#92400e'
                            }}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          FORWARD CHAINING VIEW
          ========================================================================= */}
      {inferenceMode === 'forward' && !output && (
        <div className="algo-empty-placeholder">
          <Sparkles size={32} />
          <h4>Inference Engine Ready</h4>
          <p>Configure test applicant parameters above and click "Run Rule Simulation" to execute symbolic forward chaining inference.</p>
          <button type="button" className="primary-button" onClick={onRun} disabled={loading}>
            <Play size={16} /> {loading ? 'Evaluating...' : 'Run Rule Simulation'}
          </button>
        </div>
      )}

      {inferenceMode === 'forward' && output && (
        <div className="tab-pane-fade">
          {/* Top Evaluation Metrics Strip */}
          <div className="algo-metrics-strip">
            <div className="metric-box">
              <span className="metric-label">Schemes Evaluated</span>
              <span className="metric-val">{output.total_schemes_evaluated || output.total_tested || 0}</span>
              <small className="metric-sub">Active Knowledge Base</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Rules Evaluated</span>
              <span className="metric-val text-primary">{output.total_rules_evaluated || 0}</span>
              <small className="metric-sub">Declarative Criteria</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Conditions Satisfied</span>
              <span className="metric-val text-success">{output.conditions_passed || 0}</span>
              <small className="metric-sub">Green Validated</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Conditions Failed</span>
              <span className="metric-val text-danger">{output.conditions_failed || 0}</span>
              <small className="metric-sub">Red Ineligible</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Missing Information</span>
              <span className="metric-val text-warn">{output.conditions_missing || 0}</span>
              <small className="metric-sub">Amber Incomplete</small>
            </div>
            <div className="metric-box">
              <span className="metric-label">Execution Duration</span>
              <span className="metric-val">{output.execution_duration_ms || 0} ms</span>
              <small className="metric-sub">Inference Engine</small>
            </div>
          </div>

          {/* Decision Tree / Rule Evaluation Flow Diagram */}
          <div className="inference-flow-card">
            <div className="flow-card-header">
              <h4>Symbolic Decision Flow &amp; Inference Pipeline</h4>
              <span className="flow-legend">
                <span className="legend-chip satisfied"><span className="chip-dot" /> Satisfied (Green)</span>
                <span className="legend-chip failed"><span className="chip-dot" /> Failed (Red)</span>
                <span className="legend-chip needs-info"><span className="chip-dot" /> Missing Info (Amber)</span>
                <span className="legend-chip skipped"><span className="chip-dot" /> Skipped / N/A (Grey)</span>
              </span>
            </div>

            <div className="inference-flow-diagram">
              <div className="flow-node flow-start">
                <div className="node-badge">STAGE 1</div>
                <strong>Applicant Facts</strong>
                <small>Assert Working Memory</small>
              </div>
              <ArrowRight className="flow-arrow" size={20} />

              <div className="flow-node flow-schemes">
                <div className="node-badge">STAGE 2</div>
                <strong>Applicable Schemes</strong>
                <small>{output.total_schemes_evaluated} Candidate Sets</small>
              </div>
              <ArrowRight className="flow-arrow" size={20} />

              <div className={`flow-node flow-eval ${activeStep?.type === 'rule_evaluation' ? 'pulse-active' : ''}`}>
                <div className="node-badge">STAGE 3</div>
                <strong>Rule Conditions</strong>
                <small>{activeStep?.current_rule?.rule_id || 'Evaluating Rules'}</small>
              </div>
              <ArrowRight className="flow-arrow" size={20} />

              <div className="flow-node flow-engine">
                <div className="node-badge">STAGE 4</div>
                <strong>Logic Inference</strong>
                <small>compare(actual, op, exp)</small>
              </div>
              <ArrowRight className="flow-arrow" size={20} />

              <div className="flow-node flow-outcome">
                <div className="node-badge">STAGE 5</div>
                <strong>Final Classification</strong>
                <small>{output.potential_matches || 0} Potential Matches</small>
              </div>
            </div>
          </div>

          {/* Step Controller for interactive stepping */}
          <StepController
            totalSteps={traceSteps.length}
            currentStep={currentStepIndex}
            onStepChange={setCurrentStepIndex}
            stepDescription={activeStep ? `${activeStep.title} — ${activeStep.description}` : ''}
            logs={traceSteps}
            logColumns={['Step', 'Type', 'Target Scheme / Rule', 'Visual State', 'Action & Description']}
            renderLogRow={(st, idx, isActive) => (
              <tr
                key={idx}
                className={`${isActive ? 'active-step-row' : ''} ${st.visual_state || ''}`}
                onClick={() => setCurrentStepIndex(idx)}
              >
                <td><code>#{st.step}</code></td>
                <td><span className="log-type-tag">{st.type}</span></td>
                <td><strong>{st.current_rule?.rule_id || st.target_scheme || 'Facts'}</strong></td>
                <td>
                  <span className={`pill-state ${st.visual_state}`}>
                    {st.visual_state}
                  </span>
                </td>
                <td>{st.description}</td>
              </tr>
            )}
          />

          {/* Results Header and Filter Tabs */}
          <div className="results-panel-header">
            <div>
              <h4>Knowledge-Base Scheme Evaluations ({filteredResults.length} Schemes)</h4>
              <p className="subtext">
                Mandatory condition verification results. A scholarship requires all mandatory conditions to pass to qualify as a Preliminary Match.
              </p>
            </div>

            <div className="status-filter-pills">
              <button
                type="button"
                className={`filter-pill ${selectedSchemeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedSchemeFilter('ALL')}
              >
                All ({output.results?.length || 0})
              </button>
              <button
                type="button"
                className={`filter-pill good ${selectedSchemeFilter === 'potential_match' ? 'active' : ''}`}
                onClick={() => setSelectedSchemeFilter('potential_match')}
              >
                Matches ({output.potential_matches || 0})
              </button>
              <button
                type="button"
                className={`filter-pill bad ${selectedSchemeFilter === 'ineligible' ? 'active' : ''}`}
                onClick={() => setSelectedSchemeFilter('ineligible')}
              >
                Ineligible ({output.ineligible || 0})
              </button>
              <button
                type="button"
                className={`filter-pill warn ${selectedSchemeFilter === 'needs_information' ? 'active' : ''}`}
                onClick={() => setSelectedSchemeFilter('needs_information')}
              >
                Incomplete ({output.needs_information || 0})
              </button>
            </div>
          </div>

          {/* Schemes Results Cards */}
          <div className="scheme-results-grid">
            {filteredResults.map(scheme => (
              <article className={`scheme-eval-card status-${scheme.status}`} key={scheme.scholarship_id}>
                <div className="card-top">
                  <div className="scheme-title-col">
                    <div className="meta-row">
                      <span className="scheme-id-tag">ID #{scheme.scholarship_id}</span>
                      {scheme.is_official && (
                        <span className="official-source-tag">
                          <ShieldCheck size={13} /> Official Government Scheme
                        </span>
                      )}
                      <span className="award-tag">₹{scheme.award_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <h3>{scheme.scholarship_name}</h3>
                  </div>
                  <StatusPill status={scheme.status} />
                </div>

                <p className="scheme-summary-text">{scheme.summary}</p>

                {/* Conditions Section */}
                <div className="conditions-breakdown">
                  {/* Passed Conditions (Green) */}
                  {scheme.passed_conditions?.length > 0 && (
                    <div className="cond-group group-passed">
                      <h5><CheckCircle2 size={15} /> Satisfied Conditions ({scheme.passed_conditions.length})</h5>
                      <div className="cond-items-list">
                        {scheme.passed_conditions.map((c, i) => (
                          <div className="cond-row pass-row" key={`p_${i}`}>
                            <span className="cond-rule-id">{c.rule_id || `R${i + 1}`}</span>
                            <div className="cond-text">
                              <strong>{c.message}</strong>
                              <span className="cond-comparison">
                                <code>{c.field}</code>: Actual <code>{JSON.stringify(c.actual)}</code> {c.operator} Expected <code>{JSON.stringify(c.expected)}</code>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Conditions (Red) */}
                  {scheme.failed_conditions?.length > 0 && (
                    <div className="cond-group group-failed">
                      <h5><XCircle size={15} /> Failed Mandatory Conditions ({scheme.failed_conditions.length})</h5>
                      <div className="cond-items-list">
                        {scheme.failed_conditions.map((c, i) => (
                          <div className="cond-row fail-row" key={`f_${i}`}>
                            <span className="cond-rule-id">{c.rule_id || `R${i + 1}`}</span>
                            <div className="cond-text">
                              <strong>{c.message}</strong>
                              <span className="cond-comparison">
                                <code>{c.field}</code>: Actual <code>{JSON.stringify(c.actual)}</code> does not satisfy {c.operator} Expected <code>{JSON.stringify(c.expected)}</code>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Information (Amber) */}
                  {scheme.missing_information?.length > 0 && (
                    <div className="cond-group group-missing">
                      <h5><CircleAlert size={15} /> Missing Required Information ({scheme.missing_information.length})</h5>
                      <div className="cond-items-list">
                        {scheme.missing_information.map((c, i) => (
                          <div className="cond-row missing-row" key={`m_${i}`}>
                            <span className="cond-rule-id">{c.rule_id || `R${i + 1}`}</span>
                            <div className="cond-text">
                              <strong>{c.message}</strong>
                              <span className="cond-comparison">
                                Required field <code>{c.field}</code> was omitted from applicant inputs.
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped / Precondition Not Met (Grey) */}
                  {scheme.skipped_conditions?.length > 0 && (
                    <div className="cond-group group-skipped">
                      <h5><HelpCircle size={15} /> Conditional Rules Skipped ({scheme.skipped_conditions.length})</h5>
                      <div className="cond-items-list">
                        {scheme.skipped_conditions.map((c, i) => (
                          <div className="cond-row skip-row" key={`s_${i}`}>
                            <span className="cond-rule-id">{c.rule_id || `R${i + 1}`}</span>
                            <div className="cond-text">
                              <span>{c.message}</span>
                              <small className="skip-reason">{c.reason}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Metadata Footer */}
                <div className="scheme-card-footer">
                  <div className="meta-left">
                    {scheme.source_url ? (
                      <a
                        href={scheme.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="source-link"
                      >
                        <ExternalLink size={13} /> Official Portal Guidelines
                      </a>
                    ) : (
                      <span className="no-source">Internal Demonstrator</span>
                    )}
                    {scheme.source_verified_on && (
                      <span className="verified-date">
                        Verified: <strong>{scheme.source_verified_on}</strong>
                      </span>
                    )}
                  </div>
                  <span className="duration-tag">
                    <Clock size={12} /> {scheme.evaluation_duration_ms || 0}ms
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
