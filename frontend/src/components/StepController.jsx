import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Search
} from 'lucide-react'

export default function StepController({
  totalSteps = 0,
  currentStep = 0,
  onStepChange,
  stepDescription = '',
  logs = [],
  logColumns = [],
  renderLogRow = null,
  autoPlayInterval = 1000
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 0.5x, 1x, 2x, 5x
  const [filterQuery, setFilterQuery] = useState('')
  const [showLogs, setShowLogs] = useState(true)

  // Auto-play timer
  useEffect(() => {
    let timer = null
    if (isPlaying && totalSteps > 0) {
      const intervalMs = Math.max(150, Math.round(autoPlayInterval / speed))
      timer = setInterval(() => {
        onStepChange(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, intervalMs)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isPlaying, totalSteps, speed, autoPlayInterval, onStepChange])

  function handlePlayPause() {
    if (currentStep >= totalSteps - 1) {
      // Loop or restart from step 0
      onStepChange(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  function handleNext() {
    setIsPlaying(false)
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1)
    }
  }

  function handlePrev() {
    setIsPlaying(false)
    if (currentStep > 0) {
      onStepChange(currentStep - 1)
    }
  }

  function handleReset() {
    setIsPlaying(false)
    onStepChange(0)
  }

  function handleScrubberChange(e) {
    setIsPlaying(false)
    onStepChange(Number(e.target.value))
  }

  const filteredLogs = logs.filter(item => {
    if (!filterQuery) return true
    const q = filterQuery.toLowerCase()
    return JSON.stringify(item).toLowerCase().includes(q)
  })

  return (
    <div className="step-controller-card">
      <div className="controller-main-row">
        {/* Playback Buttons */}
        <div className="playback-btn-group">
          <button
            type="button"
            className="ctrl-btn"
            onClick={handleReset}
            title="Reset to Step 1"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="ctrl-btn"
            onClick={handlePrev}
            disabled={currentStep <= 0}
            title="Previous Step"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>
          <button
            type="button"
            className={`ctrl-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause Animation' : 'Play Step-by-Step Animation'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause' : currentStep >= totalSteps - 1 ? 'Replay' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="ctrl-btn"
            onClick={handleNext}
            disabled={currentStep >= totalSteps - 1}
            title="Next Step"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="speed-selector">
          <span className="speed-label"><FastForward size={14} /> Speed:</span>
          {[0.5, 1, 2, 5].map(s => (
            <button
              key={s}
              type="button"
              className={`speed-pill ${speed === s ? 'active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress Counter */}
        <div className="step-counter-badge">
          Step <strong>{totalSteps > 0 ? currentStep + 1 : 0}</strong> of <strong>{totalSteps}</strong>
        </div>
      </div>

      {/* Scrubber Progress Bar */}
      <div className="scrubber-wrapper">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={handleScrubberChange}
          className="step-slider"
        />
        <div
          className="scrubber-fill"
          style={{ width: `${totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0}%` }}
        />
      </div>

      {/* Current Step Description Callout */}
      {stepDescription && (
        <div className="current-step-callout">
          <div className="step-callout-header">
            <span className="pulse-indicator" />
            <strong>CURRENT EXECUTION STEP:</strong>
          </div>
          <p>{stepDescription}</p>
        </div>
      )}

      {/* Execution Trace Log Toggle */}
      {logs.length > 0 && (
        <div className="logs-drawer">
          <div className="logs-drawer-header">
            <button
              type="button"
              className="toggle-logs-btn"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? 'Hide' : 'View'} Execution Trace Log ({logs.length} Steps)
            </button>

            {showLogs && (
              <div className="log-search-box">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Filter trace steps..."
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {showLogs && (
            <div className="log-table-container">
              <table className="log-table">
                <thead>
                  <tr>
                    {logColumns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((item, idx) =>
                    renderLogRow ? (
                      renderLogRow(item, idx, idx === currentStep)
                    ) : (
                      <tr
                        key={idx}
                        className={idx === currentStep ? 'active-step-row' : ''}
                        onClick={() => {
                          setIsPlaying(false)
                          onStepChange(idx)
                        }}
                      >
                        <td><code>#{idx + 1}</code></td>
                        <td>{item.action || item.description || JSON.stringify(item)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
