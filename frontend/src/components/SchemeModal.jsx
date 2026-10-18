import { useState } from 'react'
import { AlertCircle, CheckCircle2, Plus, ShieldAlert, Trash2, X } from 'lucide-react'
import { API_BASE } from '../context/AuthContext'

const AVAILABLE_DOCS = [
  'Income Certificate',
  'Caste Certificate',
  'Domicile Certificate',
  'Mark Sheet',
  'Fee Receipt',
  'CAP Allotment Letter',
  'College Bonafide Certificate'
]

const RULE_FIELDS = [
  'state',
  'category',
  'annual_income',
  'marks_percentage',
  'course_level',
  'course_type',
  'attendance_percentage',
  'cap_admission',
  'receiving_other_scholarship',
  'passed_previous_year'
]

export default function SchemeModal({ scheme, onClose, onSave }) {
  const [formData, setFormData] = useState(() => {
    if (scheme) {
      return {
        ...scheme,
        academic_year: scheme.academic_year || '2024-25',
        required_documents: scheme.required_documents || []
      }
    }
    return {
      name: '',
      description: '',
      state: 'Maharashtra',
      category: 'All',
      course_level: 'Post-Matric',
      academic_year: '2024-25',
      deadline: '2026-12-31',
      award_amount: 50000,
      source_url: '',
      source_verified_on: new Date().toISOString().split('T')[0],
      is_official: false,
      is_active: true,
      application_effort_hours: 4.0,
      notes: '',
      required_documents: ['Income Certificate', 'Mark Sheet'],
      criteria: []
    }
  })

  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function toggleDoc(doc) {
    const docs = [...formData.required_documents]
    const idx = docs.indexOf(doc)
    if (idx >= 0) docs.splice(idx, 1)
    else docs.push(doc)
    updateField('required_documents', docs)
  }

  function addCriterion() {
    const newCrit = {
      field: 'annual_income',
      operator: 'lte',
      value: 250000,
      message: 'Family annual income must be within threshold.',
      required: true
    }
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCrit]
    }))
    setValidationResult(null)
  }

  function updateCriterion(idx, key, val) {
    const updated = [...formData.criteria]
    updated[idx] = { ...updated[idx], [key]: val }
    setFormData(prev => ({ ...prev, criteria: updated }))
    setValidationResult(null)
  }

  function removeCriterion(idx) {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== idx)
    }))
    setValidationResult(null)
  }

  async function handleValidateRules() {
    setValidating(true)
    setError('')
    try {
      const token = localStorage.getItem('scholarship_auth_token') || localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/admin/rules/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ criteria: formData.criteria })
      })
      if (!res.ok) throw new Error('Rule validation check failed')
      const data = await res.json()
      setValidationResult(data)
      return data.is_valid
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setValidating(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Scheme name is required.')
      return
    }

    // Pre-flight validation
    if (formData.criteria && formData.criteria.length > 0) {
      const isValid = await handleValidateRules()
      if (!isValid) {
        setError('Cannot save scheme: Fix detected rule contradictions or duplicates first.')
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save scheme')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h3>{scheme ? 'Edit Scholarship Scheme' : 'Add New Scholarship Scheme'}</h3>
            <small>Configure metadata and rule-based expert system criteria</small>
          </div>
          <button className="icon-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-scroll-area">
            <div className="form-section-title">General Information</div>
            <div className="field-grid">
              <label>Scheme Name *
                <input required value={formData.name} onChange={e => updateField('name', e.target.value)} />
              </label>
              <label>State / Scope
                <select value={formData.state} onChange={e => updateField('state', e.target.value)}>
                  <option>Maharashtra</option>
                  <option>All India</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                  <option>Gujarat</option>
                </select>
              </label>
              <label>Target Category
                <select value={formData.category} onChange={e => updateField('category', e.target.value)}>
                  <option>All</option>
                  <option>OBC</option>
                  <option>SC</option>
                  <option>ST</option>
                  <option>Open</option>
                  <option>EWS</option>
                </select>
              </label>
              <label>Education Level
                <select value={formData.course_level} onChange={e => updateField('course_level', e.target.value)}>
                  <option>Post-Matric</option>
                  <option>Pre-Matric</option>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                  <option>PhD</option>
                </select>
              </label>
              <label>Academic Year
                <input
                  placeholder="e.g. 2024-25"
                  value={formData.academic_year || ''}
                  onChange={e => updateField('academic_year', e.target.value)}
                />
              </label>
              <label>Award Amount (₹)
                <input type="number" min="0" value={formData.award_amount} onChange={e => updateField('award_amount', Number(e.target.value))} />
              </label>
              <label>Application Deadline
                <input type="date" value={formData.deadline} onChange={e => updateField('deadline', e.target.value)} />
              </label>
              <label>Est. Effort (Hours)
                <input type="number" step="0.5" min="0.5" max="50" value={formData.application_effort_hours} onChange={e => updateField('application_effort_hours', Number(e.target.value))} />
              </label>
              <label>Verification Date
                <input type="date" value={formData.source_verified_on} onChange={e => updateField('source_verified_on', e.target.value)} />
              </label>
            </div>

            <label className="full-width-label">Official Source URL
              <input type="url" placeholder="https://mahadbt.maharashtra.gov.in/..." value={formData.source_url} onChange={e => updateField('source_url', e.target.value)} />
            </label>

            <label className="full-width-label">Description
              <textarea rows={2} value={formData.description} onChange={e => updateField('description', e.target.value)} />
            </label>

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.is_official} onChange={e => updateField('is_official', e.target.checked)} />
                Official Government Scheme
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.is_active} onChange={e => updateField('is_active', e.target.checked)} />
                Active in Directory
              </label>
            </div>

            <div className="form-section-title">Required Documents</div>
            <div className="doc-checklist-chips">
              {AVAILABLE_DOCS.map(doc => {
                const checked = formData.required_documents.includes(doc)
                return (
                  <button
                    key={doc}
                    type="button"
                    className={`doc-chip ${checked ? 'selected' : ''}`}
                    onClick={() => toggleDoc(doc)}
                  >
                    {checked ? '✓ ' : '+ '} {doc}
                  </button>
                )
              })}
            </div>

            <div className="form-section-title rules-heading-row">
              <span>Expert System Criteria Rules ({formData.criteria.length})</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="small-action-btn"
                  onClick={handleValidateRules}
                  disabled={validating || formData.criteria.length === 0}
                  style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155' }}
                >
                  <ShieldAlert size={14} /> {validating ? 'Checking...' : 'Validate Rules'}
                </button>
                <button type="button" className="small-action-btn" onClick={addCriterion}>
                  <Plus size={14} /> Add Criterion
                </button>
              </div>
            </div>

            {/* Validation Result Box */}
            {validationResult && (
              <div className={`rule-validation-box ${validationResult.is_valid ? 'valid' : 'invalid'}`}>
                {validationResult.is_valid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <strong>All criteria rules verified! No contradictions or duplicates detected.</strong>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <AlertCircle size={16} />
                      <strong>Rule Integrity Issues Detected ({validationResult.issues?.length}):</strong>
                    </div>
                    <ul className="validation-issues-list">
                      {validationResult.issues?.map((iss, idx) => (
                        <li key={idx} className="validation-issue-item">{iss}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {formData.criteria.length === 0 ? (
              <p className="empty-subtext">No rules configured. Click &quot;Add Criterion&quot; to define IF-THEN conditions.</p>
            ) : (
              <div className="criteria-builder-list">
                {formData.criteria.map((c, i) => (
                  <div key={i} className="criterion-card">
                    <div className="crit-row">
                      <select value={c.field} onChange={e => updateCriterion(i, 'field', e.target.value)}>
                        {RULE_FIELDS.map(f => <option key={f}>{f}</option>)}
                      </select>
                      <select value={c.operator} onChange={e => updateCriterion(i, 'operator', e.target.value)}>
                        <option value="eq">Equal (==)</option>
                        <option value="neq">Not Equal (!=)</option>
                        <option value="lte">Less than or equal (&lt;=)</option>
                        <option value="gte">Greater than or equal (&gt;=)</option>
                        <option value="lt">Less than (&lt;)</option>
                        <option value="gt">Greater than (&gt;)</option>
                        <option value="in">In List (in)</option>
                      </select>
                      <input
                        placeholder="Value (e.g. 250000 or OBC)"
                        value={c.value ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          const num = Number(val)
                          updateCriterion(i, 'value', val === '' ? null : (!isNaN(num) && val.trim() !== '' ? num : val))
                        }}
                      />
                      <button type="button" className="crit-delete-btn" onClick={() => removeCriterion(i)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      placeholder="Explanatory failure message"
                      value={c.message || ''}
                      onChange={e => updateCriterion(i, 'message', e.target.value)}
                      className="crit-msg-input"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : scheme ? 'Update Scheme' : 'Create Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
