import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Award,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  History,
  Info,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { useAuth, API_BASE } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'
import SchemeModal from '../components/SchemeModal'

export default function AdminDashboard() {
  const { authFetch } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const [stats, setStats] = useState({
    total_schemes: 0,
    active_schemes: 0,
    archived_schemes: 0,
    official_schemes: 0,
    demo_schemes: 0,
    total_evaluations: 0,
    total_students: 0,
    evaluation_outcomes: { eligible: 0, ineligible: 0, needs_information: 0, closed_expired: 0 },
    approaching_deadlines: [],
    frequently_unmet_criteria: [],
    recent_rule_changes: [],
    data_quality_warnings: []
  })

  const [schemes, setSchemes] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('active') // 'active', 'all', 'archived', 'official', 'demo'

  const [editingScheme, setEditingScheme] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeAuditScheme, setActiveAuditScheme] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function switchTab(newTab) {
    setSearchParams({ tab: newTab })
  }

  async function loadAdminData() {
    try {
      const [stRes, scRes, evRes] = await Promise.all([
        authFetch(`${API_BASE}/admin/stats`),
        authFetch(`${API_BASE}/admin/schemes`),
        authFetch(`${API_BASE}/admin/evaluations?limit=30`)
      ])
      if (stRes.ok) setStats(await stRes.json())
      if (scRes.ok) setSchemes(await scRes.json())
      if (evRes.ok) setEvaluations(await evRes.json())
    } catch (err) {
      setError(err.message || 'Failed to load administrative data.')
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = `${s.name} ${s.description} ${s.state} ${s.academic_year || ''}`.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filterType === 'active') return !s.is_archived
    if (filterType === 'archived') return s.is_archived
    if (filterType === 'official') return s.is_official && !s.is_archived
    if (filterType === 'demo') return !s.is_official && !s.is_archived
    return true // 'all'
  })

  async function handleSaveScheme(schemePayload) {
    setError('')
    try {
      let res
      if (editingScheme?.id) {
        // Update
        res = await authFetch(`${API_BASE}/schemes/${editingScheme.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schemePayload)
        })
      } else {
        // Create
        res = await authFetch(`${API_BASE}/schemes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schemePayload)
        })
      }
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to save scheme')
      }
      setSuccessMsg(`Scheme '${schemePayload.name}' saved successfully. Version updated.`)
      setTimeout(() => setSuccessMsg(''), 3500)
      loadAdminData()
    } catch (err) {
      throw err
    }
  }

  async function handleArchiveToggle(schemeId, isCurrentlyArchived, schemeName) {
    const actionText = isCurrentlyArchived ? 'unarchive' : 'archive'
    if (!window.confirm(`Are you sure you want to ${actionText} "${schemeName}"?`)) return
    try {
      const res = await authFetch(`${API_BASE}/schemes/${schemeId}/archive`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.detail || `Failed to ${actionText} scheme`)
      }
      setSuccessMsg(`Scheme "${schemeName}" ${isCurrentlyArchived ? 'restored to active directory' : 'archived successfully'}.`)
      setTimeout(() => setSuccessMsg(''), 3500)
      loadAdminData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRecalculate(schemeId, schemeName) {
    if (!window.confirm(`Re-run expert evaluation for all student profiles against "${schemeName}"?`)) return
    try {
      const res = await authFetch(`${API_BASE}/admin/schemes/${schemeId}/recalculate`, { method: 'POST' })
      if (!res.ok) throw new Error('Recalculation failed')
      const data = await res.json()
      setSuccessMsg(`Recalculation complete: ${data.evaluations_recalculated} evaluations updated under rule version ${data.rule_version}.`)
      setTimeout(() => setSuccessMsg(''), 4500)
      loadAdminData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleViewAuditLog(scheme) {
    setActiveAuditScheme(scheme)
    setLoadingAudit(true)
    try {
      const res = await authFetch(`${API_BASE}/admin/schemes/${scheme.id}/audit-log`)
      if (res.ok) {
        setAuditLogs(await res.json())
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingAudit(false)
    }
  }

  async function handleDeleteScheme(schemeId, schemeName) {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${schemeName}"? Notice: It is strongly recommended to archive instead.`)) return
    try {
      const res = await authFetch(`${API_BASE}/schemes/${schemeId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete scheme')
      setSuccessMsg(`Scheme #${schemeId} permanently deleted.`)
      setTimeout(() => setSuccessMsg(''), 3000)
      loadAdminData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar currentTab={currentTab} onTabSelect={switchTab} />
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">ADMINISTRATIVE GOVERNANCE</span>
            <h1>Scheme Knowledge Base Management</h1>
          </div>
          <div className="topbar-actions">
            <Link to="/admin/algorithms" className="secondary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} /> AI Control Center →
            </Link>
            <button className="primary-button" onClick={() => { setEditingScheme(null); setIsModalOpen(true) }}>
              <Plus size={16} /> Add New Scheme
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        {/* Administrative KPI Metrics */}
        <section className="stats-grid admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><BookOpenCheck size={20} /></div>
            <div>
              <span>Active Schemes / Total</span>
              <strong>{stats.active_schemes} <small>/ {stats.total_schemes}</small></strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>{stats.archived_schemes} archived</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><ShieldCheck size={20} /></div>
            <div>
              <span>Official / Demo Schemes</span>
              <strong>{stats.official_schemes} <small>Official</small> · {stats.demo_schemes} <small>Demo</small></strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Verified with govt portals</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Users size={20} /></div>
            <div>
              <span>Registered Students</span>
              <strong>{stats.total_students}</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Private profile records</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><History size={20} /></div>
            <div>
              <span>Total Evaluations</span>
              <strong>{stats.total_evaluations}</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Versioned rule traces</small>
            </div>
          </div>
        </section>

        {/* Subtabs for Admin */}
        <div className="dashboard-subtabs">
          <button className={`subtab-btn ${currentTab === 'overview' || currentTab === 'schemes' ? 'active' : ''}`} onClick={() => switchTab('schemes')}>
            <BookOpenCheck size={16} /> Scholarship Schemes ({schemes.length})
          </button>
          <button className={`subtab-btn ${currentTab === 'rules' ? 'active' : ''}`} onClick={() => switchTab('rules')}>
            <Settings size={16} /> Eligibility Rules
          </button>
          <button className={`subtab-btn ${currentTab === 'analytics' ? 'active' : ''}`} onClick={() => switchTab('analytics')}>
            <TrendingUp size={16} /> Evaluation Analytics ({stats.total_evaluations})
          </button>
          <button className={`subtab-btn ${currentTab === 'verification' ? 'active' : ''}`} onClick={() => switchTab('verification')}>
            <ShieldCheck size={16} /> Source Verification &amp; Deadlines
          </button>
        </div>

        {/* Data Quality Warnings */}
        {stats.data_quality_warnings?.length > 0 && (
          <section className="warnings-section">
            <div className="warning-banner-card">
              <div className="warn-header">
                <AlertTriangle size={18} />
                <strong>Knowledge Base Data Quality Warnings ({stats.data_quality_warnings.length})</strong>
              </div>
              <ul className="warn-list">
                {stats.data_quality_warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* TAB 1 & 2: SCHEME DIRECTORY & RULES TABLE */}
        {(currentTab === 'overview' || currentTab === 'schemes' || currentTab === 'rules') && (
          <section className="admin-table-section">
            <div className="table-controls-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  placeholder="Search schemes by name, jurisdiction, or academic year..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-pills">
                <button
                  className={`filter-btn ${filterType === 'active' ? 'active' : ''}`}
                  onClick={() => setFilterType('active')}
                >
                  Active ({schemes.filter(s => !s.is_archived).length})
                </button>
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({schemes.length})
                </button>
                <button
                  className={`filter-btn ${filterType === 'archived' ? 'active' : ''}`}
                  onClick={() => setFilterType('archived')}
                >
                  Archived ({schemes.filter(s => s.is_archived).length})
                </button>
                <button
                  className={`filter-btn ${filterType === 'official' ? 'active' : ''}`}
                  onClick={() => setFilterType('official')}
                >
                  Official ({schemes.filter(s => s.is_official && !s.is_archived).length})
                </button>
                <button
                  className={`filter-btn ${filterType === 'demo' ? 'active' : ''}`}
                  onClick={() => setFilterType('demo')}
                >
                  Demo ({schemes.filter(s => !s.is_official && !s.is_archived).length})
                </button>
              </div>
            </div>

            <div className="table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID / Ver</th>
                    <th>Scheme Name &amp; Description</th>
                    <th>Scope / Category</th>
                    <th>Award Amount</th>
                    <th>Deadline / Year</th>
                    <th>Criteria Rules</th>
                    <th>Source Verification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchemes.map(s => (
                    <tr key={s.id} style={s.is_archived ? { opacity: 0.65, background: '#f8fafc' } : {}}>
                      <td>
                        <code>#{s.id}</code>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>v{s.version || 1}</div>
                      </td>
                      <td>
                        <div className="table-scheme-name">
                          <strong>{s.name}</strong>
                          <div className="table-tags">
                            <span className={`source-tag ${s.is_official ? 'official' : 'demo'}`}>
                              {s.is_official ? 'Official' : 'Demonstration'}
                            </span>
                            {s.is_archived ? (
                              <span className="source-tag demo" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}>Archived</span>
                            ) : !s.is_active ? (
                              <span className="source-tag demo">Inactive</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{s.state}</div>
                        <small className="sub-val">{s.category} · {s.course_level}</small>
                      </td>
                      <td><strong>₹{s.award_amount?.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <div>{s.deadline}</div>
                        <small className="sub-val">AY: {s.academic_year || '2024-25'} · {s.application_effort_hours}h effort</small>
                      </td>
                      <td>
                        <span className="criteria-count-tag">{s.criteria?.length || 0} encoded rules</span>
                      </td>
                      <td>
                        {s.source_verified_on ? (
                          <div className="verif-tag ok"><CheckCircle2 size={12} /> {s.source_verified_on}</div>
                        ) : (
                          <div className="verif-tag warn"><AlertTriangle size={12} /> Unverified</div>
                        )}
                        {s.source_url && (
                          <a href={s.source_url} target="_blank" rel="noreferrer" className="table-link">
                            Portal <ExternalLink size={10} />
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="table-icon-btn edit"
                            onClick={() => { setEditingScheme(s); setIsModalOpen(true) }}
                            title="Edit Scheme & Rules"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="table-icon-btn"
                            onClick={() => handleRecalculate(s.id, s.name)}
                            title="Recalculate all student evaluations under latest rules"
                            style={{ color: '#2563eb' }}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            className="table-icon-btn"
                            onClick={() => handleViewAuditLog(s)}
                            title="View Rule Change Audit Log"
                            style={{ color: '#059669' }}
                          >
                            <History size={15} />
                          </button>
                          <button
                            className="table-icon-btn"
                            onClick={() => handleArchiveToggle(s.id, s.is_archived, s.name)}
                            title={s.is_archived ? 'Restore to Active Directory' : 'Archive Scheme'}
                            style={{ color: s.is_archived ? '#16a34a' : '#d97706' }}
                          >
                            {s.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                          </button>
                          <button
                            className="table-icon-btn delete"
                            onClick={() => handleDeleteScheme(s.id, s.name)}
                            title="Delete Scheme permanently"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: EVALUATION ANALYTICS */}
        {currentTab === 'analytics' && (() => {
          const outcomes = stats.evaluation_outcomes || {
            eligible: stats.evaluation_metrics?.eligible_matches || 0,
            ineligible: stats.evaluation_metrics?.ineligible_matches || 0,
            needs_information: stats.evaluation_metrics?.needs_information_matches || 0,
            closed_expired: stats.evaluation_metrics?.closed_expired_matches || 0
          }
          const totalOutcomes = (outcomes.eligible + outcomes.ineligible + outcomes.needs_information + outcomes.closed_expired) || 1
          const unmetList = Array.isArray(stats.frequently_unmet_criteria)
            ? stats.frequently_unmet_criteria
            : Object.entries(stats.frequently_unmet_criteria || {}).map(([k, v]) => ({
                criteria: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                count: v
              }))
          const maxUnmet = Math.max(...unmetList.map(u => u.count), 1)

          return (
            <section className="admin-eval-audit-section">
              <div className="section-heading">
                <div>
                  <span className="step">REAL DATABASE ANALYTICS</span>
                  <h2>Aggregate Evaluation Outcomes &amp; System Bottlenecks</h2>
                  <p>Derived from verified SQLite records without synthetic fabrication.</p>
                </div>
              </div>

              {/* Outcome KPI cards */}
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-icon green"><Award size={20} /></div>
                  <div>
                    <span>Eligible Matches</span>
                    <strong>{outcomes.eligible}</strong>
                    <small style={{ color: '#16a34a' }}>{Math.round((outcomes.eligible / totalOutcomes) * 100)}% of evaluations</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red" style={{ background: '#fef2f2', color: '#dc2626' }}><ShieldAlert size={20} /></div>
                  <div>
                    <span>Ineligible Matches</span>
                    <strong>{outcomes.ineligible}</strong>
                    <small style={{ color: '#dc2626' }}>{Math.round((outcomes.ineligible / totalOutcomes) * 100)}% of evaluations</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange" style={{ background: '#fffbeb', color: '#d97706' }}><AlertTriangle size={20} /></div>
                  <div>
                    <span>Needs Information</span>
                    <strong>{outcomes.needs_information}</strong>
                    <small style={{ color: '#d97706' }}>Missing facts</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon gray" style={{ background: '#f1f5f9', color: '#475569' }}><Clock size={20} /></div>
                  <div>
                    <span>Closed / Expired</span>
                    <strong>{outcomes.closed_expired}</strong>
                    <small style={{ color: '#64748b' }}>Passed deadlines</small>
                  </div>
                </div>
              </div>

              {/* Visual Outcome Distribution Meter */}
              <div className="notif-section-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>System-Wide Eligibility Distribution Ratio</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Evaluated Conditions: {totalOutcomes}</span>
                </div>
                <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0', gap: '2px' }}>
                  <div style={{ width: `${(outcomes.eligible / totalOutcomes) * 100}%`, background: '#22c55e' }} title={`Eligible: ${outcomes.eligible}`} />
                  <div style={{ width: `${(outcomes.ineligible / totalOutcomes) * 100}%`, background: '#ef4444' }} title={`Ineligible: ${outcomes.ineligible}`} />
                  <div style={{ width: `${(outcomes.needs_information / totalOutcomes) * 100}%`, background: '#f59e0b' }} title={`Needs Info: ${outcomes.needs_information}`} />
                  <div style={{ width: `${(outcomes.closed_expired / totalOutcomes) * 100}%`, background: '#94a3b8' }} title={`Closed/Expired: ${outcomes.closed_expired}`} />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} /> Eligible ({Math.round((outcomes.eligible / totalOutcomes) * 100)}%)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Ineligible ({Math.round((outcomes.ineligible / totalOutcomes) * 100)}%)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> Needs Info ({Math.round((outcomes.needs_information / totalOutcomes) * 100)}%)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }} /> Closed ({Math.round((outcomes.closed_expired / totalOutcomes) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Two-column analytics breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Frequently Unmet Criteria */}
                <div className="notif-section-card">
                  <div className="notif-section-header">
                    <TrendingUp size={18} style={{ color: '#dc2626' }} />
                    <h4>Frequently Unmet Eligibility Criteria</h4>
                  </div>
                  {unmetList.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No unmet criteria recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {unmetList.map((item, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>{item.criteria}</strong>
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                              {item.count} failures
                            </span>
                          </div>
                          <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${(item.count / maxUnmet) * 100}%`, height: '100%', background: '#ef4444' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Impending Deadlines */}
                <div className="notif-section-card">
                  <div className="notif-section-header">
                    <Calendar size={18} style={{ color: '#d97706' }} />
                    <h4>Schemes Approaching Deadlines (&lt; 45 Days)</h4>
                  </div>
                  {!stats.approaching_deadlines || stats.approaching_deadlines.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active schemes have approaching deadlines within 45 days.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {stats.approaching_deadlines.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: item.days_left <= 7 ? '#fff1f2' : '#fffbeb', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--text-heading)', display: 'block' }}>{item.scholarship_name}</strong>
                            <small style={{ color: 'var(--text-muted)' }}>Deadline: {item.deadline} · AY: {item.academic_year || '2024-25'}</small>
                          </div>
                          <span className={`urgency-pill ${item.urgency}`}>
                            {item.days_left <= 0 ? 'Today' : `${item.days_left}d Left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Anonymized Evaluation Audit Trail */}
              <div className="section-heading" style={{ marginTop: '20px' }}>
                <h3>Recent Student Evaluation Audit Trail</h3>
                <p>Chronological trace of student evaluations with rule versioning and anonymized facts.</p>
              </div>

              {evaluations.length === 0 ? (
                <div className="empty-state">
                  <History size={32} />
                  <h3>No Student Evaluations Logged Yet</h3>
                  <p>When student applicants check their scholarship eligibility, privacy-preserving audit records will be listed here.</p>
                </div>
              ) : (
                <div className="audit-list">
                  {evaluations.map(ev => (
                    <div key={ev.id} className="audit-card">
                      <div className="audit-header">
                        <strong>Evaluation Event #{ev.id}</strong>
                        <small><Clock size={12} /> {ev.created_at ? new Date(ev.created_at).toLocaleString() : 'Recent'}</small>
                      </div>
                      <div className="audit-body">
                        <span>Student Context: {ev.student_anonymized?.category || 'General'} · {ev.student_anonymized?.state || 'Maharashtra'} · Income ₹{Number(ev.student_anonymized?.annual_income || 0).toLocaleString('en-IN')} · Course: {ev.student_anonymized?.course_level || 'Post-Matric'}</span>
                        <div className="audit-summary-tags">
                          {ev.results_summary?.map((r, ri) => (
                            <span key={ri} className={`pill ${r.status === 'potential_match' ? 'good' : r.status === 'ineligible' ? 'bad' : 'warn'}`}>
                              {r.scheme_name}: {r.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })()}

        {/* TAB 4: SOURCE VERIFICATION & DEADLINES */}
        {currentTab === 'verification' && (
          <section className="admin-table-section">
            <div className="section-heading">
              <div>
                <span className="step">DATA VERIFICATION</span>
                <h2>Official Source Integrity &amp; Application Windows</h2>
                <p>Monitor portal references and upcoming government deadlines.</p>
              </div>
            </div>

            <div className="table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Scheme</th>
                    <th>Official Status</th>
                    <th>Academic Year</th>
                    <th>Last Verified</th>
                    <th>Deadline</th>
                    <th>Official Authority URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td><StatusPill status={s.is_official ? 'official' : 'demo'} /></td>
                      <td>{s.academic_year || '2024-25'}</td>
                      <td>{s.source_verified_on || <span style={{ color: '#c04a44' }}>Missing</span>}</td>
                      <td>{s.deadline}</td>
                      <td>
                        {s.source_url ? (
                          <a href={s.source_url} target="_blank" rel="noreferrer" className="table-link">
                            {s.source_url.length > 40 ? `${s.source_url.slice(0, 38)}…` : s.source_url} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: '#c04a44' }}>No Source URL</span>
                        )}
                      </td>
                      <td>
                        <button className="small-action-btn" onClick={() => { setEditingScheme(s); setIsModalOpen(true) }}>
                          Update Verification
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Scheme Creation & Rule Edit Modal */}
        {isModalOpen && (
          <SchemeModal
            scheme={editingScheme}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveScheme}
          />
        )}

        {/* Rule Version History / Audit Log Modal */}
        {activeAuditScheme && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3>Rule Version History: {activeAuditScheme.name}</h3>
                  <small>Scheme ID #{activeAuditScheme.id} · Current Version: v{activeAuditScheme.version || 1}</small>
                </div>
                <button className="icon-close-btn" onClick={() => setActiveAuditScheme(null)}><X size={18} /></button>
              </div>
              <div className="modal-scroll-area" style={{ padding: '20px' }}>
                {loadingAudit ? (
                  <p>Loading version history...</p>
                ) : auditLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No previous version audit entries logged for this scheme yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {auditLogs.map(log => (
                      <div key={log.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '13px' }}>
                            Version v{log.version} · {log.action?.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recorded'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#334155' }}>{log.changes_summary}</p>
                        <small style={{ color: '#94a3b8' }}>Admin ID: {log.admin_id}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setActiveAuditScheme(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
