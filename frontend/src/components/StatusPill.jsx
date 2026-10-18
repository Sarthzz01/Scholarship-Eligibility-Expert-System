export default function StatusPill({ status }) {
  const map = {
    potential_match: ['Potential match', 'good'],
    ineligible: ['Rule not satisfied', 'bad'],
    needs_information: ['Needs information', 'warn'],
    official: ['Official source', 'good'],
    demo: ['Demo rule set', 'warn'],
    admin: ['Administrator', 'purple'],
    student: ['Student', 'blue']
  }
  const [label, cls] = map[status] || [status || 'Unknown', 'warn']
  return <span className={`pill ${cls}`}>{label}</span>
}
