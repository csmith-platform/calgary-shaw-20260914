import { useEffect, useMemo, useState } from 'react'
import { normalizeResults, PARTY_COLORS } from './lib/results.js'

const REFRESH_MS = 30_000

function formatTime(value) {
  if (!value) return 'Waiting for update'
  return new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'America/Edmonton',
  }).format(new Date(value))
}

function ReportingRow({ label, widget }) {
  const reporting = widget?.pollsReporting ?? 0
  const total = widget?.totalPolls ?? 0
  return <div className="reporting-row"><span>{label}</span><strong>{reporting} / {total}</strong></div>
}

export default function App() {
  const [raw, setRaw] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function refresh() {
      try {
        const response = await fetch('/api/results', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Results request failed: ${response.status}`)
        const json = await response.json()
        if (!cancelled) {
          setRaw(json)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }
    refresh()
    const timer = setInterval(refresh, REFRESH_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  const results = useMemo(() => raw ? normalizeResults(raw) : null, [raw])

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="https://claytonsmith.ca" target="_blank" rel="noreferrer">
          <span className="brand-mark">CS</span>
          <span><strong>Clayton Smith</strong><small>GeoIntelligence · Land Strategy · AI</small></span>
        </a>
        <a className="geointel-link" href="https://geointel.claytonsmith.ca" target="_blank" rel="noreferrer">GeoIntel ↗</a>
      </header>

      <section className="hero-strip">
        <div><span className="eyebrow">LIVE ELECTION INTELLIGENCE</span><h1>Calgary-Shaw By-Election</h1><p>September 14, 2026 · Unofficial results</p></div>
        <div className="update-pill"><span className="live-dot" /> {loading ? 'Connecting' : 'Live'} · {formatTime(results?.lastUpdated)}</div>
      </section>

      <section className="dashboard">
        <div className="map-card">
          <div className="map-placeholder">
            <div className="map-placeholder-inner">
              <span className="map-kicker">POLL MAP</span>
              <h2>2026 voting-area geometry validation in progress</h2>
              <p>The 2023 Calgary-Shaw map has 66 ordinary voting areas. Tonight's by-election feed has 68, so old polygons are not being presented as current boundaries.</p>
              <div className="legend-row">
                {Object.entries(PARTY_COLORS).map(([party, color]) => <span key={party}><i style={{ background: color }} />{party}</span>)}
                <span><i className="unreported" />Unreported</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="results-card">
          <div className="panel-head"><span>RIDING TOTAL</span><strong>{results?.summary.pollsReporting ?? 0} / {results?.summary.totalPolls ?? 71} reporting</strong></div>
          {error && <div className="error-box">{error}</div>}
          <div className="candidate-list">
            {(results?.summary.totals ?? []).map((row) => (
              <div className="candidate-row" key={row.party}>
                <span className="party-swatch" style={{ background: PARTY_COLORS[row.party] ?? '#9CA3AF' }} />
                <div className="candidate-name"><strong>{row.party}</strong><small>{row.name}</small></div>
                <strong className="votes">{row.votes.toLocaleString()}</strong>
                <strong className="pct">{row.pct.toFixed(1)}%</strong>
              </div>
            ))}
          </div>
          <div className="valid-votes"><span>Valid votes</span><strong>{(results?.summary.valid ?? 0).toLocaleString()}</strong></div>
          <div className="reporting-block">
            <ReportingRow label="Election Day" widget={results?.widgets.votingDay} />
            <ReportingRow label="Advance" widget={results?.widgets.advance} />
            <ReportingRow label="Special ballot" widget={results?.widgets.vbm} />
            <ReportingRow label="Mobile" widget={results?.widgets.mobile} />
          </div>
          <p className="source-note">Source: Elections Alberta unofficial results. Refreshes every 30 seconds.</p>
        </aside>
      </section>

      <footer><span>Independent GeoIntel visualization. Not affiliated with Elections Alberta.</span><a href="https://geointel.claytonsmith.ca" target="_blank" rel="noreferrer">Explore GeoIntel</a></footer>
    </main>
  )
}
