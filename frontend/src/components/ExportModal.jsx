import { useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  X
} from 'lucide-react'

export default function ExportModal({
  isOpen,
  onClose,
  activeTab,
  testProfile,
  ruleTestOutput,
  bfsOutput,
  dfsOutput,
  hcOutput,
  astarOutput
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Collect active algorithm data for report
  const reportData = {
    generated_at: new Date().toISOString(),
    environment: 'Administrator AI Control Center',
    anonymized_profile: {
      domicile: testProfile.state,
      category: testProfile.category,
      income_bracket: testProfile.annual_income <= 250000 ? '<= 2.5L' : testProfile.annual_income <= 800000 ? '<= 8.0L' : '> 8.0L',
      marks_percentage: testProfile.marks_percentage,
      course_level: testProfile.course_level,
      course_type: testProfile.course_type
    },
    algorithms_summary: {
      rule_based_expert: {
        total_evaluated: ruleTestOutput?.total_schemes_evaluated || 0,
        potential_matches: ruleTestOutput?.potential_matches || 0,
        ineligible: ruleTestOutput?.ineligible || 0,
        needs_information: ruleTestOutput?.needs_information || 0,
        duration_ms: ruleTestOutput?.execution_duration_ms || 0
      },
      bfs: {
        nodes_visited: bfsOutput?.total_nodes_visited || 0,
        edges_examined: bfsOutput?.edges_examined || 0,
        max_queue_size: bfsOutput?.max_queue_size || 0,
        duration_ms: bfsOutput?.traversal_duration_ms || 0
      },
      dfs: {
        scheme: dfsOutput?.scheme_name || 'N/A',
        nodes_visited: dfsOutput?.total_nodes_visited || 0,
        max_stack_depth: dfsOutput?.max_stack_depth || 0,
        backtracks_count: dfsOutput?.backtracks?.length || 0,
        duration_ms: dfsOutput?.traversal_duration_ms || 0
      },
      hill_climbing: {
        initial_score: hcOutput?.initial_score || 0,
        final_score: hcOutput?.final_score || 0,
        improvement_achieved: hcOutput?.improvement_achieved || 0,
        iterations: hcOutput?.total_iterations || 0,
        duration_ms: hcOutput?.execution_duration_ms || 0
      },
      astar: {
        scheme: astarOutput?.scheme_name || 'N/A',
        total_cost_hours: astarOutput?.total_cost_hours || 0,
        stages_count: astarOutput?.steps_count || 0,
        duration_ms: astarOutput?.search_duration_ms || 0
      }
    }
  }

  function handleDownloadJSON() {
    const jsonStr = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scholarship_expert_ai_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadCSV() {
    const rows = [
      ['Algorithm', 'Metric', 'Value'],
      ['Rule-Based Expert System', 'Total Schemes Evaluated', reportData.algorithms_summary.rule_based_expert.total_evaluated],
      ['Rule-Based Expert System', 'Potential Matches', reportData.algorithms_summary.rule_based_expert.potential_matches],
      ['Rule-Based Expert System', 'Ineligible Schemes', reportData.algorithms_summary.rule_based_expert.ineligible],
      ['Rule-Based Expert System', 'Execution Time (ms)', reportData.algorithms_summary.rule_based_expert.duration_ms],
      ['BFS Knowledge Graph', 'Nodes Visited', reportData.algorithms_summary.bfs.nodes_visited],
      ['BFS Knowledge Graph', 'Edges Examined', reportData.algorithms_summary.bfs.edges_examined],
      ['BFS Knowledge Graph', 'Max Queue Size', reportData.algorithms_summary.bfs.max_queue_size],
      ['BFS Knowledge Graph', 'Execution Time (ms)', reportData.algorithms_summary.bfs.duration_ms],
      ['DFS Decision Tree', 'Nodes Visited', reportData.algorithms_summary.dfs.nodes_visited],
      ['DFS Decision Tree', 'Max Stack Depth', reportData.algorithms_summary.dfs.max_stack_depth],
      ['DFS Decision Tree', 'Backtracks Count', reportData.algorithms_summary.dfs.backtracks_count],
      ['DFS Decision Tree', 'Execution Time (ms)', reportData.algorithms_summary.dfs.duration_ms],
      ['Hill Climbing', 'Initial Score', reportData.algorithms_summary.hill_climbing.initial_score],
      ['Hill Climbing', 'Final Score', reportData.algorithms_summary.hill_climbing.final_score],
      ['Hill Climbing', 'Improvement Gain', reportData.algorithms_summary.hill_climbing.improvement_achieved],
      ['Hill Climbing', 'Iterations', reportData.algorithms_summary.hill_climbing.iterations],
      ['Hill Climbing', 'Execution Time (ms)', reportData.algorithms_summary.hill_climbing.duration_ms],
      ['A* Search Planner', 'Total Effort Hours', reportData.algorithms_summary.astar.total_cost_hours],
      ['A* Search Planner', 'Stages Planned', reportData.algorithms_summary.astar.stages_count],
      ['A* Search Planner', 'Execution Time (ms)', reportData.algorithms_summary.astar.duration_ms]
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `scholarship_expert_ai_metrics_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handlePrintSummary() {
    window.print()
  }

  function handleCopyJSON() {
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content export-modal-card">
        <div className="modal-header">
          <div className="modal-title-col">
            <span className="eyebrow">ACADEMIC EXPORT &amp; REPORTING TOOLS</span>
            <h3>Export Algorithm Execution Report</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="modal-subtext">
          Generate submission-ready execution reports containing inputs, outputs, time complexities, empirical timings, and audit trails. Privacy compliant: applicant facts are anonymized.
        </p>

        <div className="export-action-cards-grid">
          <div className="export-action-card" onClick={handleDownloadJSON}>
            <Download size={22} className="export-icon json-icon" />
            <div>
              <strong>Export Full JSON Report</strong>
              <small>Complete structured execution trace with states, queues, and scores.</small>
            </div>
          </div>

          <div className="export-action-card" onClick={handleDownloadCSV}>
            <FileSpreadsheet size={22} className="export-icon csv-icon" />
            <div>
              <strong>Export CSV Summary Metrics</strong>
              <small>Tabular performance data ready for spreadsheet charts and viva exhibits.</small>
            </div>
          </div>

          <div className="export-action-card" onClick={handlePrintSummary}>
            <Printer size={22} className="export-icon print-icon" />
            <div>
              <strong>Print Viva Defense Report</strong>
              <small>Print-formatted page with comparison matrix and current algorithm run.</small>
            </div>
          </div>
        </div>

        {/* JSON Preview Box */}
        <div className="json-preview-box">
          <div className="preview-top">
            <span>JSON Audit Payload Preview</span>
            <button type="button" className="copy-btn" onClick={handleCopyJSON}>
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
          <pre className="preview-code"><code>{JSON.stringify(reportData, null, 2)}</code></pre>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
