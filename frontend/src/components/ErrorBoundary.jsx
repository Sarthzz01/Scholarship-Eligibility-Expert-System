import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '36px 24px',
          background: '#ffffff',
          border: '1px solid #fee2e2',
          borderRadius: '12px',
          margin: '24px auto',
          maxWidth: '680px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <AlertTriangle size={26} />
          </div>
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px', fontWeight: 700 }}>
            {this.props.title || 'Display Error Encountered'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', maxWidth: '520px', margin: '0 auto 18px' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this algorithm visualization.'}
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={this.handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} /> Retry Visualization
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
