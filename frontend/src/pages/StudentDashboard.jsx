import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpenCheck,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  History,
  Info,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react'
import { useAuth, API_BASE } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'

const ALL_DOCUMENTS = [
  'Income Certificate',
  'Caste Certificate',
  'Domicile Certificate',
  'Mark Sheet',
  'Fee Receipt',
  'CAP Allotment Letter',
  'College Bonafide Certificate'
]

export default function StudentDashboard() {
  const { user, authFetch } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  // Student Profile state
  const [profile, setProfile] = useState({
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

  // Schemes & Guidance evaluation results
  const [schemes, setSchemes] = useState([])
  const [evaluationGuidance, setEvaluationGuidance] = useState(null)
  const [evalHistory, setEvalHistory] = useState([])

  // Application Tracker & Notifications state
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState({
    approaching_deadlines: [],
    missing_documents_alerts: [],
    profile_warnings: [],
    total_notifications: 0
  })
  const [appStatusFilter, setAppStatusFilter] = useState('all')
  const [trackingSuccessMsg, setTrackingSuccessMsg] = useState('')
  const [activeNoteEditId, setActiveNoteEditId] = useState(null)
  const [tempNoteText, setTempNoteText] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSavedMsg, setProfileSavedMsg] = useState('')
  const [error, setError] = useState('')

  function switchTab(newTab) {
    setSearchParams({ tab: newTab })
  }

  // Load initial student data
  async function loadData() {
    try {
      const [profRes, schemesRes, histRes, appsRes, notifRes] = await Promise.all([
        authFetch(`${API_BASE}/student/profile`),
        fetch(`${API_BASE}/schemes`),
        authFetch(`${API_BASE}/student/my-evaluations`),
        authFetch(`${API_BASE}/student/applications`),
        authFetch(`${API_BASE}/student/notifications`)
      ])

      if (profRes.ok) {
        const profData = await profRes.json()
        setProfile(prev => ({
          ...prev,
          ...profData,
          available_documents: profData.available_documents || prev.available_documents
        }))
      }

      if (schemesRes.ok) {
        setSchemes(await schemesRes.json())
      }

      if (histRes.ok) {
        const histData = await histRes.json()
        setEvalHistory(histData)
        if (histData.length > 0 && histData[0].guidance) {
          setEvaluationGuidance(histData[0].guidance)
        }
      }

      if (appsRes.ok) {
        setApplications(await appsRes.json())
      }

      if (notifRes.ok) {
        setNotifications(await notifRes.json())
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to scholarship service.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate profile completeness %
  const completeness = useMemo(() => {
    let score = 0
    if (profile.state) score += 15
    if (profile.category) score += 15
    if (profile.annual_income !== null && profile.annual_income !== '') score += 15
    if (profile.marks_percentage) score += 15
    if (profile.course_level) score += 15
    if (profile.attendance_percentage) score += 15
    if (profile.available_documents?.length > 0) score += 10
    return Math.min(score, 100)
  }, [profile])

  function updateField(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function toggleDocument(doc) {
    const docs = [...(profile.available_documents || [])]
    const idx = docs.indexOf(doc)
    if (idx >= 0) docs.splice(idx, 1)
    else docs.push(doc)
    updateField('available_documents', docs)
  }

  // Save profile to backend
  async function handleSaveProfile(e) {
    if (e) e.preventDefault()
    setSavingProfile(true)
    setProfileSavedMsg('')
    try {
      const res = await authFetch(`${API_BASE}/student/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (!res.ok) throw new Error('Failed to update profile')
      setProfileSavedMsg('Profile successfully updated!')
      setTimeout(() => setProfileSavedMsg(''), 3000)
      // Refresh notifications as completeness might have changed
      const notifRes = await authFetch(`${API_BASE}/student/notifications`)
      if (notifRes.ok) setNotifications(await notifRes.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  // Run Eligibility Assessment
  async function handleRunEligibility(e) {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: profile })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Evaluation failed')

      if (data.student_guidance) {
        setEvaluationGuidance(data.student_guidance)
      }

      // Refresh private evaluation history
      const histRes = await authFetch(`${API_BASE}/student/my-evaluations`)
      if (histRes.ok) setEvalHistory(await histRes.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Application Tracker Handlers
  async function handleTrackScheme(scholarshipId, defaultStatus = 'interested') {
    try {
      const res = await authFetch(`${API_BASE}/student/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          status: defaultStatus
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || 'Failed to track scholarship')
      }
      setTrackingSuccessMsg('Scholarship added to your Application Tracker!')
      setTimeout(() => setTrackingSuccessMsg(''), 3500)
      const appsRes = await authFetch(`${API_BASE}/student/applications`)
      if (appsRes.ok) setApplications(await appsRes.json())
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdateApplication(appId, newStatus, newNotes = null, newAppliedDate = null) {
    try {
      const body = {}
      if (newStatus !== null) body.status = newStatus
      if (newNotes !== null) body.notes = newNotes
      if (newAppliedDate !== null) body.applied_date = newAppliedDate

      const res = await authFetch(`${API_BASE}/student/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to update application status')
      const appsRes = await authFetch(`${API_BASE}/student/applications`)
      if (appsRes.ok) setApplications(await appsRes.json())
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteApplication(appId) {
    if (!window.confirm('Remove this scholarship from your Application Tracker?')) return
    try {
      const res = await authFetch(`${API_BASE}/student/applications/${appId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to remove tracked application')
      setApplications(prev => prev.filter(a => a.id !== appId))
    } catch (err) {
      setError(err.message)
    }
  }

  const eligibleList = evaluationGuidance?.eligible_schemes || []
  const requiresActionList = evaluationGuidance?.requires_action_schemes || []
  const needsInfoList = evaluationGuidance?.needs_information_schemes || []

  const filteredApplications = applications.filter(a => {
    if (appStatusFilter === 'all') return true
    return a.status === appStatusFilter
  })

  // Set of tracked scholarship IDs for quick lookup
  const trackedScholarshipIds = useMemo(() => {
    return new Set(applications.map(a => a.scholarship_id))
  }, [applications])

  return (
    <div className="app-shell">
      <Sidebar currentTab={currentTab} onTabSelect={switchTab} />
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">STUDENT SCHOLARSHIP PORTAL</span>
            <h1>Welcome, {user?.full_name || 'Student'}</h1>
          </div>
          <div className="top-tag">
            <ShieldCheck size={16} /> Verified Student Profile
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <CircleAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {trackingSuccessMsg && (
          <div className="success-banner">
            <Check size={18} />
            <span>{trackingSuccessMsg}</span>
          </div>
        )}

        {/* Profile Completeness Banner */}
        <section className="profile-banner">
          <div className="profile-banner-content">
            <div className="progress-info">
              <span className="banner-badge"><Sparkles size={14} /> Profile Status</span>
              <h3>Profile Completeness: <strong>{completeness}%</strong></h3>
              <p>Keep your academic marks, annual family income, and category verified for accurate matching.</p>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <button className="banner-edit-btn" onClick={() => switchTab('profile')}>
            <User size={15} /> Update Profile
          </button>
        </section>

        {/* Subtabs for Student */}
        <div className="dashboard-subtabs">
          <button className={`subtab-btn ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => switchTab('overview')}>
            <BookOpenCheck size={16} /> Overview &amp; Checker
          </button>
          <button className={`subtab-btn ${currentTab === 'eligible' ? 'active' : ''}`} onClick={() => switchTab('eligible')}>
            <Award size={16} /> Eligible Scholarships ({eligibleList.length})
          </button>
          <button className={`subtab-btn ${currentTab === 'improve' ? 'active' : ''}`} onClick={() => switchTab('improve')}>
            <TrendingUp size={16} /> Actionable Guidance ({requiresActionList.length + needsInfoList.length})
          </button>
          <button className={`subtab-btn ${currentTab === 'tracker' ? 'active' : ''}`} onClick={() => switchTab('tracker')}>
            <FileCheck2 size={16} /> Application Tracker ({applications.length})
          </button>
          <button className={`subtab-btn ${currentTab === 'notifications' ? 'active' : ''}`} onClick={() => switchTab('notifications')}>
            <Bell size={16} /> Deadlines &amp; Alerts ({notifications.total_notifications || 0})
          </button>
          <button className={`subtab-btn ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
            <User size={16} /> My Profile &amp; Documents
          </button>
          <button className={`subtab-btn ${currentTab === 'history' ? 'active' : ''}`} onClick={() => switchTab('history')}>
            <History size={16} /> Evaluation History ({evalHistory.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & QUICK CHECKER */}
        {currentTab === 'overview' && (
          <div className="tab-pane-fade">
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon green"><Award size={20} /></div>
                <div>
                  <span>Potentially Eligible</span>
                  <strong>{eligibleList.length}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple"><TrendingUp size={20} /></div>
                <div>
                  <span>Action Needed</span>
                  <strong>{requiresActionList.length}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><BookOpenCheck size={20} /></div>
                <div>
                  <span>Total Active Schemes</span>
                  <strong>{schemes.length}</strong>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <form className="form-card" onSubmit={handleRunEligibility}>
                <div className="section-heading">
                  <div>
                    <span className="step">STEP 1 / RUN CHECKER</span>
                    <h2>Check Scholarship Eligibility</h2>
                    <p>Submit your verified facts to discover matching schemes and clear requirements.</p>
                  </div>
                  <button type="button" className="small-save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                    <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>

                {profileSavedMsg && <div className="success-banner">{profileSavedMsg}</div>}

                <div className="field-grid">
                  <label>State / Domicile
                    <select value={profile.state} onChange={e => updateField('state', e.target.value)}>
                      <option>Maharashtra</option>
                      <option>All India</option>
                      <option>Delhi</option>
                      <option>Karnataka</option>
                      <option>Gujarat</option>
                    </select>
                  </label>

                  <label>Category
                    <select value={profile.category} onChange={e => updateField('category', e.target.value)}>
                      {['Open', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'EWS', 'Minority'].map(x => <option key={x}>{x}</option>)}
                    </select>
                  </label>

                  <label>Annual Family Income (₹)
                    <input required type="number" min="0" value={profile.annual_income} onChange={e => updateField('annual_income', Number(e.target.value))} />
                  </label>

                  <label>Qualifying Marks (%)
                    <input type="number" min="0" max="100" step="0.01" value={profile.marks_percentage} onChange={e => updateField('marks_percentage', Number(e.target.value))} />
                  </label>

                  <label>Course Level
                    <select value={profile.course_level} onChange={e => updateField('course_level', e.target.value)}>
                      <option>Post-Matric</option>
                      <option>Pre-Matric</option>
                      <option>Undergraduate</option>
                      <option>Postgraduate</option>
                      <option>PhD</option>
                    </select>
                  </label>

                  <label>Course Type
                    <select value={profile.course_type} onChange={e => updateField('course_type', e.target.value)}>
                      <option>Professional</option>
                      <option>Non-Professional</option>
                    </select>
                  </label>

                  <label>Attendance Percentage (%)
                    <input type="number" min="0" max="100" step="0.1" value={profile.attendance_percentage} onChange={e => updateField('attendance_percentage', Number(e.target.value))} />
                  </label>

                  <label>CAP Admission (Professional Courses)
                    <select value={String(profile.cap_admission)} onChange={e => updateField('cap_admission', e.target.value === 'true')}>
                      <option value="true">Yes (CAP Allotment)</option>
                      <option value="false">No (Management Quota)</option>
                    </select>
                  </label>

                  <label>Receiving Another Scholarship?
                    <select value={String(profile.receiving_other_scholarship)} onChange={e => updateField('receiving_other_scholarship', e.target.value === 'true')}>
                      <option value="false">No (Eligible)</option>
                      <option value="true">Yes</option>
                    </select>
                  </label>

                  <label>Previous Year Passed?
                    <select value={String(profile.passed_previous_year)} onChange={e => updateField('passed_previous_year', e.target.value === 'true')}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                </div>

                <div className="form-footer">
                  <span><ShieldCheck size={16} /> Transparent rule evaluation</span>
                  <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? 'Evaluating Requirements...' : 'Run Eligibility Check'}
                  </button>
                </div>
              </form>

              {/* Explanatory Sidebar */}
              <aside className="method-card">
                <div className="method-icon"><HelpCircle size={24} /></div>
                <span className="step">HOW EVALUATION WORKS</span>
                <h3>Clear, Honest Guidance</h3>
                <p>Every scholarship has explicit government rules. We show you exactly where you qualify and what to do if you don&apos;t.</p>
                <div className="method-step">
                  <b>1</b><div><strong>Eligible Schemes</strong><small>All mandatory criteria fully satisfied.</small></div>
                </div>
                <div className="method-step">
                  <b>2</b><div><strong>Actionable Steps</strong><small>Clear directions on addressing unmet conditions.</small></div>
                </div>
                <div className="method-step">
                  <b>3</b><div><strong>Official Sources</strong><small>Verified portal links and application deadlines.</small></div>
                </div>
              </aside>
            </section>
          </div>
        )}

        {/* TAB 2: SECTION A - ELIGIBLE SCHOLARSHIPS */}
        {currentTab === 'eligible' && (
          <div className="tab-pane-fade">
            <div className="tab-intro-card">
              <div className="intro-text">
                <h3>Potentially Eligible Scholarships ({eligibleList.length})</h3>
                <p>
                  You meet all encoded mandatory criteria for these schemes based on your profile facts.
                  Please note: final sanction requires document scrutiny and approval by the official scheme authority.
                </p>
              </div>
              <button className="primary-button" onClick={handleRunEligibility} disabled={loading}>
                <RefreshCw size={14} /> Re-check Eligibility
              </button>
            </div>

            {eligibleList.length === 0 ? (
              <div className="empty-state">
                <Award size={32} />
                <h3>No Confirmed Matches Yet</h3>
                <p>Ensure your profile information is complete, or view the &quot;Improve Eligibility&quot; tab to see actionable next steps.</p>
              </div>
            ) : (
              <div className="results-list">
                {eligibleList.map(item => (
                  <article className="result-card" key={item.scholarship_id}>
                    <div className="result-heading">
                      <div className="result-icon potential_match"><CheckCircle2 size={24} /></div>
                      <div className="result-title">
                        <div className="title-line">
                          <h3>{item.scholarship_name}</h3>
                          <StatusPill status="potential_match" />
                        </div>
                        <p>{item.description}</p>
                      </div>
                    </div>

                    <div className="scheme-meta-row">
                      <div className="meta-item">
                        <span>Benefit / Award:</span>
                        <strong>₹{item.award_amount?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="meta-item">
                        <span>Application Deadline:</span>
                        <strong><Calendar size={13} /> {item.deadline}</strong>
                      </div>
                      <div className="meta-item">
                        <span>Source Verification:</span>
                        <strong>{item.source_verified_on || 'Verified'}</strong>
                      </div>
                    </div>

                    {item.passed_conditions_summary?.length > 0 && (
                      <div className="rule-columns">
                        <div className="rule-group full-width">
                          <h4 className="passed-label">Satisfied Criteria ({item.passed_conditions_summary.length})</h4>
                          {item.passed_conditions_summary.map((c, i) => (
                            <div className="rule" key={i}>
                              <CheckCircle2 size={15} /> <span>{c.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.required_documents?.length > 0 && (
                      <div className="req-docs-section">
                        <strong>Required Verification Documents:</strong>
                        <div className="doc-tags-list">
                          {item.required_documents.map(d => (
                            <span key={d} className="doc-tag">✓ {d}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="source-row">
                      <span>{item.is_official ? <><ShieldCheck size={14} /> Official Government Scheme</> : <><Sparkles size={14} /> Illustrative Demonstration Scheme</>}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {trackedScholarshipIds.has(item.scholarship_id) ? (
                          <span className="tracked-badge"><Check size={13} /> In Tracker</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-track-action"
                            onClick={() => handleTrackScheme(item.scholarship_id, 'interested')}
                          >
                            <Plus size={14} /> Track Application
                          </button>
                        )}
                        {item.source_url && (
                          <a href={item.source_url} target="_blank" rel="noreferrer">
                            Official Portal <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECTION B & C - ACTIONABLE GUIDANCE & MORE INFORMATION NEEDED */}
        {currentTab === 'improve' && (
          <div className="tab-pane-fade">
            <div className="tab-intro-card">
              <div className="intro-text">
                <h3>Actionable Eligibility Guidance &amp; Missing Information</h3>
                <p>
                  Understand exactly why certain scholarships do not currently match your profile,
                  and learn what legitimate steps you can take to satisfy prerequisites.
                </p>
              </div>
            </div>

            {/* Section C: More Information Required */}
            {needsInfoList.length > 0 && (
              <section className="guidance-section-group">
                <div className="guidance-section-header warn-header">
                  <AlertCircle size={20} />
                  <div>
                    <h4>More Information Required ({needsInfoList.length} Schemes)</h4>
                    <p>These schemes cannot be evaluated until you supply missing profile facts.</p>
                  </div>
                </div>

                <div className="guidance-cards-list">
                  {needsInfoList.map(item => (
                    <div key={item.scholarship_id} className="guidance-card needs-info">
                      <div className="guidance-card-top">
                        <h5>{item.scholarship_name}</h5>
                        <StatusPill status="needs_information" />
                      </div>
                      <div className="missing-fields-box">
                        {item.missing_fields?.map((m, idx) => (
                          <div key={idx} className="missing-field-row">
                            <CircleAlert size={15} />
                            <div>
                              <strong>Missing: {m.title}</strong>
                              <p>{m.instruction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="guidance-card-footer">
                        <button className="primary-button" onClick={() => switchTab('profile')}>
                          Update Profile Facts →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section B: Scholarships Requiring Additional Action */}
            <section className="guidance-section-group">
              <div className="guidance-section-header">
                <TrendingUp size={20} />
                <div>
                  <h4>Scholarships Requiring Additional Action ({requiresActionList.length})</h4>
                  <p>Detailed breakdown of unmet criteria and legitimate next steps.</p>
                </div>
              </div>

              {requiresActionList.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={30} />
                  <h3>No Unmet Conditions Found</h3>
                  <p>All evaluated schemes are either fully satisfied or require additional basic facts.</p>
                </div>
              ) : (
                <div className="guidance-cards-list">
                  {requiresActionList.map(item => (
                    <article key={item.scholarship_id} className="guidance-card">
                      <div className="guidance-card-top">
                        <div>
                          <h5>{item.scholarship_name}</h5>
                          <span className="scheme-subtitle">{item.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {trackedScholarshipIds.has(item.scholarship_id) ? (
                            <span className="tracked-badge"><Check size={12} /> In Tracker</span>
                          ) : (
                            <button
                              type="button"
                              className="btn-track-action"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => handleTrackScheme(item.scholarship_id, 'preparing_documents')}
                            >
                              <Plus size={13} /> Track
                            </button>
                          )}
                          <StatusPill status="ineligible" />
                        </div>
                      </div>

                      <div className="unmet-conditions-list">
                        {item.failed_conditions?.map((c, i) => (
                          <div key={i} className={`unmet-condition-item ${c.nature}`}>
                            <div className="condition-item-header">
                              <span className={`nature-badge ${c.nature}`}>
                                {c.nature === 'actionable' ? 'Actionable Condition' : c.nature === 'fixed_restriction' ? 'Fixed Requirement' : 'Verification Required'}
                              </span>
                              <strong>{c.requirement_title}</strong>
                            </div>

                            <div className="condition-comparison-row">
                              <div>
                                <span>Your Current Fact:</span>
                                <strong>{c.student_value !== null ? String(c.student_value) : 'Not specified'}</strong>
                              </div>
                              <div className="vs-divider">vs</div>
                              <div>
                                <span>Published Requirement:</span>
                                <strong>{String(c.required_value)}</strong>
                              </div>
                            </div>

                            <div className="next-action-box">
                              <div className="action-box-icon"><Info size={16} /></div>
                              <div>
                                <strong>Recommended Next Step:</strong>
                                <p>{c.next_action}</p>
                              </div>
                            </div>

                            {c.official_source && (
                              <div className="ref-link-row">
                                <a href={c.official_source} target="_blank" rel="noreferrer">
                                  Official Scheme Reference <ExternalLink size={12} />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB: APPLICATION TRACKER */}
        {currentTab === 'tracker' && (
          <div className="tab-pane-fade">
            <div className="tab-intro-card">
              <div className="intro-text">
                <h3>Personal Application Tracker ({applications.length})</h3>
                <p>
                  Manage your active scholarship applications, update their progress milestones,
                  record personal reference notes, and track application deadlines.
                </p>
              </div>
              <button className="primary-button" onClick={() => switchTab('eligible')}>
                <Award size={15} /> Discover Scholarships
              </button>
            </div>

            {/* Status Filter Bar */}
            <div className="tracker-filters-bar">
              {[
                { key: 'all', label: 'All Tracked', count: applications.length },
                { key: 'interested', label: 'Interested', count: applications.filter(a => a.status === 'interested').length },
                { key: 'preparing_documents', label: 'Preparing Documents', count: applications.filter(a => a.status === 'preparing_documents').length },
                { key: 'ready_to_apply', label: 'Ready to Apply', count: applications.filter(a => a.status === 'ready_to_apply').length },
                { key: 'submitted', label: 'Submitted', count: applications.filter(a => a.status === 'submitted').length },
                { key: 'under_review', label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
                { key: 'approved', label: 'Approved', count: applications.filter(a => a.status === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`tracker-filter-btn ${appStatusFilter === f.key ? 'active' : ''}`}
                  onClick={() => setAppStatusFilter(f.key)}
                >
                  <span>{f.label}</span>
                  <span className="tracker-count-badge">{f.count}</span>
                </button>
              ))}
            </div>

            {filteredApplications.length === 0 ? (
              <div className="empty-state">
                <FileCheck2 size={36} />
                <h3>No Applications in This Category</h3>
                <p>
                  {applications.length === 0
                    ? 'You have not added any scholarships to your tracker yet. Browse eligible schemes and click "Track Application" to get started.'
                    : 'No tracked scholarships match the selected status filter.'}
                </p>
                {applications.length === 0 && (
                  <button className="primary-button" style={{ marginTop: '12px' }} onClick={() => switchTab('eligible')}>
                    Explore Eligible Scholarships →
                  </button>
                )}
              </div>
            ) : (
              <div className="applications-grid">
                {filteredApplications.map(app => (
                  <article key={app.id} className="app-tracker-card">
                    <div className="app-card-header">
                      <div className="app-card-title">
                        <h4>{app.scholarship_name || `Scholarship #${app.scholarship_id}`}</h4>
                        <p>{app.description}</p>
                      </div>
                      <div className="app-card-actions">
                        <select
                          className={`app-status-select ${app.status}`}
                          value={app.status}
                          onChange={e => handleUpdateApplication(app.id, e.target.value)}
                        >
                          <option value="interested">Interested</option>
                          <option value="preparing_documents">Preparing Documents</option>
                          <option value="ready_to_apply">Ready to Apply</option>
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Remove from Tracker"
                          onClick={() => handleDeleteApplication(app.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="app-card-meta">
                      {app.award_amount && (
                        <div className="app-meta-item">
                          <span>Award:</span>
                          <strong>₹{Number(app.award_amount).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                      {app.deadline && (
                        <div className="app-meta-item">
                          <Calendar size={13} />
                          <span>Deadline:</span>
                          <strong>{app.deadline}</strong>
                        </div>
                      )}
                      <div className="app-meta-item">
                        <Clock size={13} />
                        <span>Added On:</span>
                        <span>{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                      {app.source_url && (
                        <div className="app-meta-item">
                          <a href={app.source_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                            Official Portal <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Applied Date row if submitted/review/approved */}
                    {['submitted', 'under_review', 'approved', 'rejected'].includes(app.status) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', margin: '8px 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Submission Date:</span>
                        <input
                          type="date"
                          value={app.applied_date || ''}
                          onChange={e => handleUpdateApplication(app.id, null, null, e.target.value)}
                          style={{ padding: '3px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                      </div>
                    )}

                    {/* Notes Box */}
                    <div className="app-notes-row">
                      {activeNoteEditId === app.id ? (
                        <div className="notes-edit-box">
                          <input
                            type="text"
                            className="notes-input"
                            value={tempNoteText}
                            placeholder="Add reference number, submission notes, or certificate checklist..."
                            onChange={e => setTempNoteText(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-note-action save"
                            onClick={() => {
                              handleUpdateApplication(app.id, null, tempNoteText)
                              setActiveNoteEditId(null)
                            }}
                          >
                            Save Note
                          </button>
                          <button
                            type="button"
                            className="btn-note-action cancel"
                            onClick={() => setActiveNoteEditId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className="notes-display"
                          onClick={() => {
                            setActiveNoteEditId(app.id)
                            setTempNoteText(app.notes || '')
                          }}
                          style={{ cursor: 'pointer' }}
                          title="Click to edit notes"
                        >
                          <span>{app.notes ? `Note: ${app.notes}` : '+ Add personal application note, registration number, or reminders (click to edit)...'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>Edit</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS & DEADLINES ALERTS */}
        {currentTab === 'notifications' && (
          <div className="tab-pane-fade">
            <div className="tab-intro-card">
              <div className="intro-text">
                <h3>Deadlines, Document Alerts &amp; Profile Verification</h3>
                <p>
                  Stay proactive with automated warnings regarding approaching deadlines,
                  required documentation, and profile requirements.
                </p>
              </div>
              <button className="primary-button" onClick={() => switchTab('profile')}>
                <User size={15} /> Update Profile
              </button>
            </div>

            <div className="notifications-grid">
              {/* Section 1: Approaching Deadlines */}
              <section className="notif-section-card">
                <div className="notif-section-header">
                  <Calendar size={18} style={{ color: '#d97706' }} />
                  <h4>Upcoming Scheme Deadlines ({notifications.approaching_deadlines?.length || 0})</h4>
                </div>

                {!notifications.approaching_deadlines || notifications.approaching_deadlines.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' }}>
                    No schemes currently have impending deadlines within the next 30 days.
                  </p>
                ) : (
                  <div className="notif-items-list">
                    {notifications.approaching_deadlines.map((item, idx) => (
                      <div key={idx} className={`notif-item ${item.urgency === 'critical' ? 'urgent' : 'warning'}`}>
                        <div className="notif-item-content">
                          <Clock size={16} style={{ color: item.urgency === 'critical' ? '#dc2626' : '#d97706', marginTop: '2px' }} />
                          <div>
                            <h5>{item.scholarship_name}</h5>
                            <p>Official Deadline: <strong>{item.deadline}</strong> · Academic Year: {item.academic_year || '2024-25'}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`urgency-pill ${item.urgency}`}>
                            {item.days_left <= 0 ? 'Closes Today' : `${item.days_left} Days Left`}
                          </span>
                          {item.source_url && (
                            <a href={item.source_url} target="_blank" rel="noreferrer" className="btn-track-action" style={{ padding: '4px 8px', fontSize: '11px' }}>
                              Portal <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 2: Missing Documents Alerts */}
              <section className="notif-section-card">
                <div className="notif-section-header">
                  <FileText size={18} style={{ color: '#0284c7' }} />
                  <h4>Required Documents Alerts ({notifications.missing_documents_alerts?.length || 0})</h4>
                </div>

                {!notifications.missing_documents_alerts || notifications.missing_documents_alerts.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' }}>
                    Great job! You have marked all common certificates as available in your profile checklist.
                  </p>
                ) : (
                  <div className="notif-items-list">
                    {notifications.missing_documents_alerts.map((docItem, idx) => (
                      <div key={idx} className="notif-item warning">
                        <div className="notif-item-content">
                          <CircleAlert size={16} style={{ color: '#d97706', marginTop: '2px' }} />
                          <div>
                            <h5>Missing: {docItem.document}</h5>
                            <p>Required by: {docItem.required_by_schemes?.join(', ')}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-track-action"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => switchTab('profile')}
                        >
                          Checkmark in Profile →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section 3: Profile Completeness Warnings */}
              <section className="notif-section-card">
                <div className="notif-section-header">
                  <ShieldCheck size={18} style={{ color: '#16a34a' }} />
                  <h4>Profile Quality &amp; Criteria Verification ({notifications.profile_warnings?.length || 0})</h4>
                </div>

                {!notifications.profile_warnings || notifications.profile_warnings.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' }}>
                    All profile verification standards are currently satisfied.
                  </p>
                ) : (
                  <div className="notif-items-list">
                    {notifications.profile_warnings.map((warn, idx) => (
                      <div key={idx} className="notif-item info">
                        <div className="notif-item-content">
                          <Info size={16} style={{ color: '#2563eb', marginTop: '2px' }} />
                          <div>
                            <h5>{warn.title}</h5>
                            <p>{warn.message}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-track-action"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => switchTab('profile')}
                        >
                          Update →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 4: MY PROFILE & DOCUMENTS */}
        {currentTab === 'profile' && (
          <div className="tab-pane-fade">
            <form className="form-card profile-full-card" onSubmit={handleSaveProfile}>
              <div className="section-heading">
                <div>
                  <span className="step">STUDENT CREDENTIALS</span>
                  <h2>Academic &amp; Financial Profile Facts</h2>
                  <p>Maintain your verified credentials and document checklist.</p>
                </div>
                <button type="submit" className="primary-button" disabled={savingProfile}>
                  <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>

              {profileSavedMsg && <div className="success-banner">{profileSavedMsg}</div>}

              <div className="form-section-title">Core Academic Details</div>
              <div className="field-grid">
                <label>State / Domicile
                  <select value={profile.state} onChange={e => updateField('state', e.target.value)}>
                    <option>Maharashtra</option>
                    <option>All India</option>
                    <option>Delhi</option>
                    <option>Karnataka</option>
                    <option>Gujarat</option>
                  </select>
                </label>
                <label>Category
                  <select value={profile.category} onChange={e => updateField('category', e.target.value)}>
                    {['Open', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'EWS', 'Minority'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </label>
                <label>Annual Family Income (₹)
                  <input required type="number" min="0" value={profile.annual_income} onChange={e => updateField('annual_income', Number(e.target.value))} />
                </label>
                <label>Qualifying Exam Marks (%)
                  <input type="number" min="0" max="100" step="0.01" value={profile.marks_percentage} onChange={e => updateField('marks_percentage', Number(e.target.value))} />
                </label>
                <label>Course Level
                  <select value={profile.course_level} onChange={e => updateField('course_level', e.target.value)}>
                    <option>Post-Matric</option>
                    <option>Pre-Matric</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                    <option>PhD</option>
                  </select>
                </label>
                <label>Course Type
                  <select value={profile.course_type} onChange={e => updateField('course_type', e.target.value)}>
                    <option>Professional</option>
                    <option>Non-Professional</option>
                  </select>
                </label>
                <label>Attendance Percentage (%)
                  <input type="number" min="0" max="100" step="0.1" value={profile.attendance_percentage} onChange={e => updateField('attendance_percentage', Number(e.target.value))} />
                </label>
              </div>

              <div className="form-section-title">Available Certificates Checklist</div>
              <p className="subtext">Select the certificates currently in your possession to verify document readiness.</p>
              <div className="doc-checklist-chips">
                {ALL_DOCUMENTS.map(doc => {
                  const hasDoc = profile.available_documents?.includes(doc)
                  return (
                    <button
                      key={doc}
                      type="button"
                      className={`doc-chip ${hasDoc ? 'selected' : ''}`}
                      onClick={() => toggleDocument(doc)}
                    >
                      {hasDoc ? '✓ ' : '+ '} {doc}
                    </button>
                  )
                })}
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: EVALUATION HISTORY */}
        {currentTab === 'history' && (
          <div className="tab-pane-fade">
            <div className="directory-intro">
              <h2>My Evaluation History</h2>
              <p>Your saved assessments are stored privately and chronologically in SQLite.</p>
            </div>

            {evalHistory.length === 0 ? (
              <div className="empty-state">
                <History size={28} />
                <h3>No Evaluations Recorded Yet</h3>
                <p>Run your first eligibility check to see saved assessment records here.</p>
              </div>
            ) : (
              <div className="history-list">
                {evalHistory.map(item => (
                  <article className="history-card" key={item.id}>
                    <div>
                      <strong>Evaluation Record #{item.id}</strong>
                      <p>
                        {item.student?.category} · {item.student?.state} · Annual Income ₹{Number(item.student?.annual_income || 0).toLocaleString('en-IN')} · Marks {item.student?.marks_percentage}%
                      </p>
                      <small><Clock size={12} /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}</small>
                    </div>
                    <div className="history-results">
                      {item.results?.map(r => (
                        <div key={r.scholarship_id} className="history-pill-item">
                          <span>{r.scholarship_name}:</span>
                          <StatusPill status={r.status} />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
