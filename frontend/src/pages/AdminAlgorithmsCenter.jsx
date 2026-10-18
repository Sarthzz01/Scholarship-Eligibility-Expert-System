import { useEffect, useState } from 'react'
import {
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  FileText,
  Flame,
  GitBranch,
  Layers,
  ListOrdered,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  TestTube,
  TrendingUp,
  XCircle
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import RuleBasedVisualizer from '../components/RuleBasedVisualizer'
import BFSVisualizer from '../components/BFSVisualizer'
import DFSVisualizer from '../components/DFSVisualizer'
import HillClimbingVisualizer from '../components/HillClimbingVisualizer'
import AStarVisualizer from '../components/AStarVisualizer'
import AcademicNotes from '../components/AcademicNotes'
import BenchmarkTestSuite from '../components/BenchmarkTestSuite'
import ExportModal from '../components/ExportModal'
import ErrorBoundary from '../components/ErrorBoundary'
import { API_BASE, useAuth } from '../context/AuthContext'

const SAMPLE_PROFILES = {
  obc_merit: {
    label: 'Preset 1: OBC Engineering Merit (Matches MahaDBT OBC)',
    data: {
      state: 'Maharashtra',
      category: 'OBC',
      annual_income: 150000,
      marks_percentage: 84.5,
      course_level: 'Post-Matric',
      course_type: 'Professional',
      attendance_percentage: 82.0,
      cap_admission: true,
      receiving_other_scholarship: false,
      passed_previous_year: true,
      is_fresh_application: true,
      available_documents: ['Income Certificate', 'Caste Certificate', 'Domicile Certificate', 'Mark Sheet', 'Fee Receipt', 'CAP Allotment Letter']
    }
  },
  ebc_open: {
    label: 'Preset 2: General / Open EBC (Matches EBC Fee Waiver)',
    data: {
      state: 'Maharashtra',
      category: 'Open',
      annual_income: 350000,
      marks_percentage: 78.0,
      course_level: 'Post-Matric',
      course_type: 'Professional',
      attendance_percentage: 80.0,
      cap_admission: true,
      receiving_other_scholarship: false,
      passed_previous_year: true,
      is_fresh_application: true,
      available_documents: ['Income Certificate', 'Domicile Certificate', 'Mark Sheet', 'Fee Receipt', 'CAP Allotment Letter']
    }
  },
  central_merit: {
    label: 'Preset 3: Central Sector Merit (National Portal)',
    data: {
      state: 'All India',
      category: 'Open',
      annual_income: 280000,
      marks_percentage: 88.0,
      course_level: 'Post-Matric',
      course_type: 'Non-Professional',
      attendance_percentage: 85.0,
      cap_admission: false,
      receiving_other_scholarship: false,
      passed_previous_year: true,
      is_fresh_application: true,
      available_documents: ['Income Certificate', 'Class 12 Mark Sheet', 'College Bonafide Certificate', 'Aadhaar Linked Bank Passbook']
    }
  },
  high_income_ineligible: {
    label: 'Preset 4: Ineligible High Income (Triggers Rule Rejection)',
    data: {
      state: 'Maharashtra',
      category: 'OBC',
      annual_income: 950000,
      marks_percentage: 72.0,
      course_level: 'Post-Matric',
      course_type: 'Professional',
      attendance_percentage: 80.0,
      cap_admission: true,
      receiving_other_scholarship: false,
      passed_previous_year: true,
      is_fresh_application: true,
      available_documents: ['Income Certificate', 'Mark Sheet']
    }
  },
  missing_information: {
    label: 'Preset 5: Incomplete Profile (Omitted Income Verification)',
    data: {
      state: 'Maharashtra',
      category: 'OBC',
      annual_income: null,
      marks_percentage: 80.0,
      course_level: 'Post-Matric',
      course_type: 'Professional',
      attendance_percentage: 80.0,
      cap_admission: true,
      receiving_other_scholarship: false,
      passed_previous_year: true,
      is_fresh_application: true,
      available_documents: ['Mark Sheet']
    }
  }
}

export default function AdminAlgorithmsCenter() {
  const { authFetch } = useAuth()
  const [activeTab, setActiveTab] = useState('expert') // 'expert', 'bfs', 'dfs', 'hc', 'astar', 'academic', 'benchmarks'
  const [schemes, setSchemes] = useState([])
  const [aiSummary, setAiSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [validationMsg, setValidationMsg] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)

  // Registered Students & Test Profile state
  const [registeredStudents, setRegisteredStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [activeStudentName, setActiveStudentName] = useState('')

  const [testProfile, setTestProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('scholarship_admin_test_profile')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          return { ...SAMPLE_PROFILES.obc_merit.data, ...parsed }
        }
      }
    } catch { }
    return SAMPLE_PROFILES.obc_merit.data
  })

  const [selectedSchemeId, setSelectedSchemeId] = useState(null)
  const [customWeights, setCustomWeights] = useState({
    amount: 0.35,
    profile_match: 0.25,
    deadline: 0.20,
    effort: 0.20
  })

  // Algorithm Outputs
  const [ruleTestOutput, setRuleTestOutput] = useState(null)
  const [bfsOutput, setBfsOutput] = useState(null)
  const [dfsOutput, setDfsOutput] = useState(null)
  const [hcOutput, setHcOutput] = useState(null)
  const [astarOutput, setAstarOutput] = useState(null)

  // Initial load
  useEffect(() => {
    loadSchemesAndSummary()
  }, [])

  async function loadSchemesAndSummary() {
    setRefreshing(true)
    setError('')
    try {
      // 1. Fetch schemes
      const schemesRes = await fetch(`${API_BASE}/schemes`)
      if (schemesRes.ok) {
        const data = await schemesRes.json()
        setSchemes(data)
        if (data.length > 0 && !selectedSchemeId) {
          setSelectedSchemeId(data[0].id)
        }
      }

      // 2. Fetch AI KB Summary (requires admin auth)
      const summaryRes = await authFetch(`${API_BASE}/admin/ai-summary`)
      if (summaryRes.ok) {
        const sumData = await summaryRes.json()
        setAiSummary(sumData)
      }

      // 3. Fetch Registered Students from database (requires admin auth)
      const studentsRes = await authFetch(`${API_BASE}/admin/registered-students`)
      if (studentsRes.ok) {
        const studList = await studentsRes.json()
        setRegisteredStudents(studList)
        if (studList.length > 0) {
          setSelectedStudentId(prevId => {
            const found = studList.find(s => String(s.id) === String(prevId))
            if (found) {
              setActiveStudentName(found.full_name)
              return String(found.id)
            }
            const first = studList[0]
            setActiveStudentName(first.full_name)
            if (first.profile) {
              setTestProfile({ ...first.profile })
            }
            return String(first.id)
          })
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend service.')
    } finally {
      setRefreshing(false)
    }
  }

  // 1. Run Rule-Based Test
  async function runRuleTest() {
    setLoading(true)
    setError('')
    try {
      const currentProfile = testProfile || SAMPLE_PROFILES.obc_merit.data
      const res = await authFetch(`${API_BASE}/algorithms/rule-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: currentProfile })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Rule simulation failed')
      setRuleTestOutput(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Run BFS
  async function runBFS(options = {}) {
    setLoading(true)
    setError('')
    try {
      const currentProfile = testProfile || SAMPLE_PROFILES.obc_merit.data
      const payload = {
        student_state: currentProfile.state || 'Maharashtra',
        student_category: currentProfile.category || 'Open',
        course_level: currentProfile.course_level || 'Post-Matric',
        start_node_id: options.start_node_id || null,
        filter_by_profile: options.filter_by_profile ?? false
      }
      const res = await authFetch(`${API_BASE}/algorithms/bfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'BFS traversal failed')
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
      const currentProfile = testProfile || SAMPLE_PROFILES.obc_merit.data
      const res = await authFetch(`${API_BASE}/algorithms/dfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_id: selectedSchemeId,
          student: currentProfile
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'DFS exploration failed')
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
      const currentProfile = testProfile || SAMPLE_PROFILES.obc_merit.data
      const res = await authFetch(`${API_BASE}/algorithms/hill-climbing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: currentProfile,
          weights: customWeights
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Hill Climbing optimization failed')
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
      const currentProfile = testProfile || SAMPLE_PROFILES.obc_merit.data
      const res = await authFetch(`${API_BASE}/algorithms/astar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_id: selectedSchemeId,
          student: currentProfile,
          available_documents: currentProfile.available_documents || []
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

  // Auto-run when tab opens if not yet run
  useEffect(() => {
    if (activeTab === 'expert' && !ruleTestOutput) runRuleTest()
    if (activeTab === 'bfs' && !bfsOutput) runBFS()
    if (activeTab === 'dfs' && (!dfsOutput || dfsOutput.scheme_id !== selectedSchemeId) && selectedSchemeId) runDFS()
    if (activeTab === 'hc' && !hcOutput) runHillClimbing()
    if (activeTab === 'astar' && (!astarOutput || astarOutput.scheme_id !== selectedSchemeId) && selectedSchemeId) runAStar()
  }, [activeTab, selectedSchemeId])

  // Profile actions
  function handleSelectRegisteredStudent(studentIdStr) {
    setSelectedStudentId(studentIdStr)
    const found = registeredStudents.find(s => String(s.id) === String(studentIdStr))
    if (found && found.profile) {
      setActiveStudentName(found.full_name)
      setTestProfile({ ...found.profile })
      setValidationMsg({
        type: 'success',
        text: `Loaded registered student: ${found.full_name} (${found.email}) — ${found.profile.state}, ${found.profile.category}, ₹${(found.profile.annual_income || 0).toLocaleString('en-IN')}`
      })
      // Clear algorithm outputs to recalculate fresh for this student
      setRuleTestOutput(null)
      setBfsOutput(null)
      setDfsOutput(null)
      setHcOutput(null)
      setAstarOutput(null)
    }
  }

  function handleClearProfile() {
    setSelectedStudentId('')
    setActiveStudentName('')
    setTestProfile({
      state: 'Maharashtra',
      category: 'Open',
      annual_income: 0,
      marks_percentage: 0,
      course_level: 'Post-Matric',
      course_type: 'Professional',
      attendance_percentage: 0,
      cap_admission: false,
      receiving_other_scholarship: false,
      passed_previous_year: false,
      is_fresh_application: true,
      available_documents: []
    })
    setValidationMsg({ type: 'info', text: 'Profile cleared to zero-values.' })
  }

  function handleValidateProfile() {
    const issues = []
    if (!testProfile.state) issues.push('Domicile state is required.')
    if (!testProfile.category) issues.push('Category is required.')
    if (testProfile.annual_income !== null && testProfile.annual_income < 0) issues.push('Income cannot be negative.')
    if (testProfile.marks_percentage < 0 || testProfile.marks_percentage > 100) issues.push('Marks percentage must be between 0% and 100%.')
    if (testProfile.attendance_percentage < 0 || testProfile.attendance_percentage > 100) issues.push('Attendance must be between 0% and 100%.')

    if (issues.length > 0) {
      setValidationMsg({ type: 'error', text: `Validation errors: ${issues.join(' ')}` })
    } else {
      setValidationMsg({ type: 'success', text: 'All profile parameters satisfy data schema constraints.' })
    }
  }

  function handleSaveProfile() {
    localStorage.setItem('scholarship_admin_test_profile', JSON.stringify(testProfile))
    setValidationMsg({ type: 'success', text: 'Profile saved to browser local storage for future simulation sessions.' })
  }

  function toggleDocument(docName) {
    setTestProfile(p => {
      const current = p.available_documents || []
      const updated = current.includes(docName)
        ? current.filter(d => d !== docName)
        : [...current, docName]
      return { ...p, available_documents: updated }
    })
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main admin-ai-main">
        {/* HEADER SECTION */}
        <header className="topbar admin-ai-topbar">
          <div>
            <div className="top-title-row">
              <span className="eyebrow">ADMINISTRATIVE AI CONTROL CENTER</span>
              <span className="admin-env-pill">
                <ShieldCheck size={13} /> Admin Environment
              </span>
            </div>
            <h1>Classical AI Algorithms Dashboard</h1>
          </div>

          <div className="topbar-actions">
            <div className="db-status-pill">
              <span className="pulse-dot green" />
              <span>DB: <strong>Connected</strong> (SQLite 3)</span>
            </div>

            <div className="kb-timestamp-pill" title="Last updated time of active scholarship knowledge base">
              <span>KB Synced: <strong>{aiSummary?.kb_last_updated || 'Active'}</strong></span>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={loadSchemesAndSummary}
              disabled={refreshing}
              title="Refresh Knowledge Base & Live System Statistics"
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
            </button>

            <button
              type="button"
              className="export-btn-top"
              onClick={() => setShowExportModal(true)}
              title="Export Algorithm Execution Report for College Submission"
            >
              <Download size={15} />
              <span>Export Report</span>
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* KNOWLEDGE-BASE LIVE SUMMARY CARDS */}
        <section className="kb-summary-cards-grid">
          <div className="kb-stat-card">
            <div className="stat-icon-wrapper blue"><BookOpen size={20} /></div>
            <div>
              <span className="stat-label">Total Scholarship Schemes</span>
              <strong className="stat-value">{aiSummary?.total_schemes ?? schemes.length}</strong>
              <small className="stat-sub">In SQLite Catalog</small>
            </div>
          </div>

          <div className="kb-stat-card">
            <div className="stat-icon-wrapper green"><CheckCircle2 size={20} /></div>
            <div>
              <span className="stat-label">Active Schemes</span>
              <strong className="stat-value text-success">{aiSummary?.active_schemes ?? schemes.length}</strong>
              <small className="stat-sub">Available for Traversal</small>
            </div>
          </div>

          <div className="kb-stat-card">
            <div className="stat-icon-wrapper purple"><BrainCircuit size={20} /></div>
            <div>
              <span className="stat-label">Total Eligibility Rules</span>
              <strong className="stat-value text-primary">{aiSummary?.total_rules ?? 18}</strong>
              <small className="stat-sub">Across All Criteria Sets</small>
            </div>
          </div>

          <div className="kb-stat-card">
            <div className="stat-icon-wrapper amber"><ShieldCheck size={20} /></div>
            <div>
              <span className="stat-label">Official-Source Schemes</span>
              <strong className="stat-value text-warn">{aiSummary?.official_schemes ?? 3}</strong>
              <small className="stat-sub">MahaDBT &amp; NSP Central</small>
            </div>
          </div>

          <div className="kb-stat-card">
            <div className="stat-icon-wrapper teal"><Database size={20} /></div>
            <div>
              <span className="stat-label">Last Evaluation Status</span>
              <strong className="stat-value">
                {aiSummary?.last_evaluation ? `${aiSummary.last_evaluation.matches} Matches` : 'Ready'}
              </strong>
              <small className="stat-sub">Audit Record Logged</small>
            </div>
          </div>
        </section>

        {/* COMPREHENSIVE TEST PROFILE PANEL */}
        <section className="test-profile-card">
          <div className="profile-card-top">
            <div className="profile-title-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4>Simulation Test Profile &amp; Knowledge Assertions</h4>
                {activeStudentName && (
                  <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    Active Registered Student: {activeStudentName}
                  </span>
                )}
              </div>
              <p className="subtext">
                Authoritative fact assertions fed into forward-chaining rules and algorithm search heuristics.
              </p>
            </div>

            {/* Profile Action Buttons */}
            <div className="profile-action-btns">
              <select
                className="preset-select"
                value={selectedStudentId}
                onChange={e => handleSelectRegisteredStudent(e.target.value)}
              >
                <option value="" disabled>
                  {registeredStudents.length > 0
                    ? `Select Registered Student (${registeredStudents.length} registered)...`
                    : 'No registered students found'}
                </option>
                {registeredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    👤 {student.full_name || 'Student'} ({student.email})
                  </option>
                ))}
              </select>

              <button type="button" className="action-pill-btn" onClick={handleValidateProfile}>
                Validate Inputs
              </button>
              <button type="button" className="action-pill-btn" onClick={handleSaveProfile}>
                <Save size={13} /> Save Profile
              </button>
              <button type="button" className="action-pill-btn" onClick={handleClearProfile}>
                <RotateCcw size={13} /> Clear
              </button>
            </div>
          </div>

          {/* Validation Feedback Banner */}
          {validationMsg && (
            <div className={`validation-alert ${validationMsg.type}`}>
              {validationMsg.type === 'success' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
              <span>{validationMsg.text}</span>
            </div>
          )}

          {/* Form Controls Grid */}
          <div className="profile-controls-grid">
            <div className="form-control-item">
              <label>Domicile / State:</label>
              <select
                value={testProfile.state}
                onChange={e => setTestProfile(p => ({ ...p, state: e.target.value }))}
              >
                <option>Maharashtra</option>
                <option>All India</option>
                <option>Delhi</option>
                <option>Karnataka</option>
                <option>Tamil Nadu</option>
              </select>
            </div>

            <div className="form-control-item">
              <label>Social Category:</label>
              <select
                value={testProfile.category}
                onChange={e => setTestProfile(p => ({ ...p, category: e.target.value }))}
              >
                {['Open', 'OBC', 'SC', 'ST', 'EWS'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-control-item">
              <label>Annual Family Income (₹):</label>
              <input
                type="number"
                value={testProfile.annual_income ?? ''}
                placeholder="e.g. 150000"
                onChange={e => setTestProfile(p => ({ ...p, annual_income: e.target.value === '' ? null : Number(e.target.value) }))}
              />
            </div>

            <div className="form-control-item">
              <label>Academic Marks (%):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={testProfile.marks_percentage ?? ''}
                onChange={e => setTestProfile(p => ({ ...p, marks_percentage: Number(e.target.value) }))}
              />
            </div>

            <div className="form-control-item">
              <label>Course Level:</label>
              <select
                value={testProfile.course_level}
                onChange={e => setTestProfile(p => ({ ...p, course_level: e.target.value }))}
              >
                <option>Post-Matric</option>
                <option>Undergraduate</option>
                <option>Postgraduate</option>
                <option>PhD</option>
              </select>
            </div>

            <div className="form-control-item">
              <label>Course Type:</label>
              <select
                value={testProfile.course_type}
                onChange={e => setTestProfile(p => ({ ...p, course_type: e.target.value }))}
              >
                <option>Professional</option>
                <option>Non-Professional</option>
              </select>
            </div>

            <div className="form-control-item">
              <label>Attendance (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={testProfile.attendance_percentage ?? ''}
                onChange={e => setTestProfile(p => ({ ...p, attendance_percentage: Number(e.target.value) }))}
              />
            </div>

            <div className="form-control-item">
              <label>CAP Admission:</label>
              <select
                value={testProfile.cap_admission ? 'yes' : 'no'}
                onChange={e => setTestProfile(p => ({ ...p, cap_admission: e.target.value === 'yes' }))}
              >
                <option value="yes">Yes (Through Centralized Allotment)</option>
                <option value="no">No (Direct / Institute Level)</option>
              </select>
            </div>

            <div className="form-control-item">
              <label>Other Scholarship:</label>
              <select
                value={testProfile.receiving_other_scholarship ? 'yes' : 'no'}
                onChange={e => setTestProfile(p => ({ ...p, receiving_other_scholarship: e.target.value === 'yes' }))}
              >
                <option value="no">No (None received)</option>
                <option value="yes">Yes (Already receiving benefit)</option>
              </select>
            </div>

            <div className="form-control-item">
              <label>Passed Previous Year:</label>
              <select
                value={testProfile.passed_previous_year ? 'yes' : 'no'}
                onChange={e => setTestProfile(p => ({ ...p, passed_previous_year: e.target.value === 'yes' }))}
              >
                <option value="yes">Yes (Passed)</option>
                <option value="no">No (Backlog / Failed)</option>
              </select>
            </div>
          </div>

          {/* Available Documents Checkbox Chips */}
          <div className="documents-selection-row">
            <span className="docs-label">Available Applicant Documents:</span>
            <div className="docs-chips-list">
              {[
                'Income Certificate',
                'Caste Certificate',
                'Domicile Certificate',
                'Mark Sheet',
                'Fee Receipt',
                'CAP Allotment Letter',
                'College Bonafide Certificate',
                'Aadhaar Linked Bank Passbook'
              ].map(doc => {
                const isSelected = (testProfile.available_documents || []).includes(doc)
                return (
                  <button
                    key={doc}
                    type="button"
                    className={`doc-toggle-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleDocument(doc)}
                  >
                    {isSelected ? <CheckCircle2 size={12} /> : '+'} {doc}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target Scheme Picker (for DFS & A*) */}
          {(activeTab === 'dfs' || activeTab === 'astar') && (
            <div className="target-scheme-picker-row">
              <span className="target-label">Target Scheme for Tree Search &amp; Planning:</span>
              <select
                value={selectedSchemeId || ''}
                onChange={e => setSelectedSchemeId(Number(e.target.value))}
                className="target-scheme-select"
              >
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.id}: {s.name} ({s.state} · ₹{s.award_amount?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visual Profile Utilization Badges */}
          <div className="profile-utilization-strip">
            <span className="util-label">Active Profile Consumed By:</span>
            <span className="util-badge active">1. Rule-Based Expert System</span>
            <span className="util-badge active">2. BFS (Scope &amp; Category Filters)</span>
            <span className="util-badge active">3. DFS (Decision Tree Conditions)</span>
            <span className="util-badge active">4. Hill Climbing (Income &amp; Marks Need)</span>
            <span className="util-badge active">5. A* Planner (Missing Docs Effort)</span>
          </div>
        </section>

        {/* ALGORITHM TABS NAVIGATION */}
        <div className="algo-tabs-nav-bar">
          <button
            type="button"
            className={`algo-nav-tab ${activeTab === 'expert' ? 'active' : ''}`}
            onClick={() => setActiveTab('expert')}
          >
            <BrainCircuit size={17} />
            <div>
              <strong>1. Rule-Based Expert System</strong>
              <small>Forward-Chaining Inference</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab ${activeTab === 'bfs' ? 'active' : ''}`}
            onClick={() => setActiveTab('bfs')}
          >
            <Network size={17} />
            <div>
              <strong>2. Breadth-First Search (BFS)</strong>
              <small>Level-by-Level Graph Discovery</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab ${activeTab === 'dfs' ? 'active' : ''}`}
            onClick={() => setActiveTab('dfs')}
          >
            <GitBranch size={17} />
            <div>
              <strong>3. Depth-First Search (DFS)</strong>
              <small>Decision Tree &amp; Backtracking</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab ${activeTab === 'hc' ? 'active' : ''}`}
            onClick={() => setActiveTab('hc')}
          >
            <TrendingUp size={17} />
            <div>
              <strong>4. Hill Climbing</strong>
              <small>Ranking Optimization &amp; Utility</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab ${activeTab === 'astar' ? 'active' : ''}`}
            onClick={() => setActiveTab('astar')}
          >
            <ListOrdered size={17} />
            <div>
              <strong>5. A* Search Planner</strong>
              <small>Admissible Prerequisite Planning</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab supplemental ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
            title="Academic Pseudocode, Big-O Complexity, and Comparison Matrix"
          >
            <BookOpen size={17} />
            <div>
              <strong>Academic &amp; Viva Notes</strong>
              <small>Pseudocode &amp; Complexity</small>
            </div>
          </button>

          <button
            type="button"
            className={`algo-nav-tab supplemental ${activeTab === 'benchmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('benchmarks')}
            title="10 Repeatable Test Cases & Live BFS vs DFS Head-to-Head Benchmark"
          >
            <TestTube size={17} />
            <div>
              <strong>Benchmark &amp; Test Suite</strong>
              <small>10 Repeatable Tests &amp; Benchmark</small>
            </div>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <section className="algo-tab-viewport">
          {activeTab === 'expert' && (
            <ErrorBoundary title="Rule-Based Expert System Visualizer">
              <RuleBasedVisualizer
                output={ruleTestOutput}
                onRun={runRuleTest}
                loading={loading}
                schemes={schemes}
                testProfile={testProfile}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'bfs' && (
            <ErrorBoundary title="BFS Graph Traversal Visualizer">
              <BFSVisualizer
                output={bfsOutput}
                onRun={runBFS}
                loading={loading}
                testProfile={testProfile}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'dfs' && (
            <ErrorBoundary title="DFS Decision Tree Visualizer">
              <DFSVisualizer
                output={dfsOutput}
                onRun={runDFS}
                loading={loading}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'hc' && (
            <ErrorBoundary title="Hill Climbing Visualizer">
              <HillClimbingVisualizer
                output={hcOutput}
                onRun={runHillClimbing}
                customWeights={customWeights}
                onWeightsChange={(k, v) => setCustomWeights(w => ({ ...w, [k]: v }))}
                loading={loading}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'astar' && (
            <ErrorBoundary title="A* Search Planner Visualizer">
              <AStarVisualizer
                output={astarOutput}
                onRun={runAStar}
                loading={loading}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'academic' && (
            <ErrorBoundary title="Academic Notes View">
              <AcademicNotes />
            </ErrorBoundary>
          )}

          {activeTab === 'benchmarks' && (
            <ErrorBoundary title="Benchmark Suite">
              <BenchmarkTestSuite />
            </ErrorBoundary>
          )}
        </section>

        {/* EXPORT MODAL */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          activeTab={activeTab}
          testProfile={testProfile}
          ruleTestOutput={ruleTestOutput}
          bfsOutput={bfsOutput}
          dfsOutput={dfsOutput}
          hcOutput={hcOutput}
          astarOutput={astarOutput}
        />
      </main>
    </div>
  )
}
