import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { pollFillColor } from './lib/results.js'

const GEOJSON_URL = '/data/calgary-shaw-2026.geojson'
const SOURCE_ID = 'calgary-shaw-polls'

export default function MapView({ polls = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pollsRef = useRef(polls)
  const [geometryReady, setGeometryReady] = useState(false)

  useEffect(() => { pollsRef.current = polls }, [polls])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-114.055, 50.89],
      zoom: 11.2,
      attributionControl: true,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', async () => {
      try {
        const response = await fetch(GEOJSON_URL, { cache: 'no-store' })
        if (!response.ok) return
        const geojson = await response.json()
        const liveByPoll = new Map(pollsRef.current.map((poll) => [String(poll.poll).padStart(3, '0'), poll]))
        geojson.features = geojson.features.map((feature) => {
          const poll = String(feature.properties.poll ?? feature.properties.poll_number ?? '').padStart(3, '0')
          const result = liveByPoll.get(poll)
          return { ...feature, properties: { ...feature.properties, poll, fill_color: pollFillColor(result), reported: !!result?.reported } }
        })

        map.addSource(SOURCE_ID, { type: 'geojson', data: geojson, promoteId: 'poll' })
        const firstSymbol = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id
        map.addLayer({ id: 'poll-fills', type: 'fill', source: SOURCE_ID, paint: { 'fill-color': ['get', 'fill_color'], 'fill-opacity': 0.72 } }, firstSymbol)
        map.addLayer({ id: 'poll-lines', type: 'line', source: SOURCE_ID, paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': 0.75 } }, firstSymbol)
        map.addLayer({ id: 'poll-labels', type: 'symbol', source: SOURCE_ID, layout: { 'text-field': ['get', 'poll'], 'text-size': 11 }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#07131f', 'text-halo-width': 1.5 } })
        setGeometryReady(true)
      } catch {
        setGeometryReady(false)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource(SOURCE_ID)
    if (!source || !geometryReady) return
    fetch(GEOJSON_URL, { cache: 'force-cache' })
      .then((response) => response.json())
      .then((geojson) => {
        const liveByPoll = new Map(polls.map((poll) => [String(poll.poll).padStart(3, '0'), poll]))
        geojson.features = geojson.features.map((feature) => {
          const poll = String(feature.properties.poll ?? feature.properties.poll_number ?? '').padStart(3, '0')
          const result = liveByPoll.get(poll)
          return { ...feature, properties: { ...feature.properties, poll, fill_color: pollFillColor(result), reported: !!result?.reported } }
        })
        source.setData(geojson)
      })
      .catch(() => {})
  }, [polls, geometryReady])

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map-canvas" />
      {!geometryReady && (
        <div className="geometry-notice">
          <span className="map-kicker">MAP ONLINE</span>
          <strong>2026 voting-area geometry awaiting validation</strong>
          <small>2023 had 66 ordinary areas; tonight's feed has 68. Old polygons are intentionally not shown as current.</small>
        </div>
      )}
    </div>
  )
}
