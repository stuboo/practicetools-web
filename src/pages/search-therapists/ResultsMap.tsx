import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SearchMeta, TherapistType } from './types'
import { formatDistanceBadge } from './referralFormat'

interface ResultsMapProps {
  therapists: TherapistType[]
  meta: SearchMeta | null
  selectedId: number | null
  onSelect: (id: number) => void
}

/**
 * Numbered pin matching the card number, so "number three on your list" and
 * "the third pin" are the same thing when the clinician turns the screen.
 */
function numberedIcon(index: number, selected: boolean) {
  const background = selected ? '#2f7dd1' : '#0f2a43'
  return L.divIcon({
    className: 'pt-result-pin',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:7px;
      background:${background};color:#fff;
      font-family:'IBM Plex Mono',ui-monospace,monospace;
      font-weight:500;font-size:14px;line-height:1;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);
    ">${index + 1}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

/** The patient's ZIP: deliberately a different shape and colour from a result. */
const originIcon = L.divIcon({
  className: 'pt-origin-pin',
  html: `<span style="
    display:block;width:18px;height:18px;
    background:#dc2626;border:3px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.4);
    transform:rotate(45deg);
  "></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
})

function FitBounds({ points }: { points: L.LatLngExpression[] }) {
  const map = useMap()
  // Serialised so a re-render with the same pins does not fight the user's
  // manual pan/zoom; only a genuinely new result set refits.
  const signature = JSON.stringify(points)

  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 12)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 })
  }, [signature, map])

  return null
}

export default function ResultsMap({
  therapists,
  meta,
  selectedId,
  onSelect,
}: ResultsMapProps) {
  const markerRefs = useRef<Record<number, L.Marker | null>>({})

  const located = useMemo(
    () =>
      therapists
        .map((therapist, index) => ({ therapist, index }))
        .filter(
          ({ therapist }) =>
            typeof therapist.latitude === 'number' && typeof therapist.longitude === 'number'
        ),
    [therapists]
  )

  const origin: L.LatLngExpression | null = meta
    ? [meta.origin.latitude, meta.origin.longitude]
    : null

  const points: L.LatLngExpression[] = useMemo(() => {
    const list: L.LatLngExpression[] = located.map(({ therapist }) => [
      therapist.latitude as number,
      therapist.longitude as number,
    ])
    if (origin) list.push(origin)
    return list
  }, [located, meta])

  // Selecting a card should open the matching pin's popup, not just recolour it.
  useEffect(() => {
    if (selectedId === null) return
    markerRefs.current[selectedId]?.openPopup()
  }, [selectedId])

  if (!points.length) return null

  return (
    <MapContainer
      center={points[0]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={points} />

      {origin && (
        <Marker position={origin} icon={originIcon} zIndexOffset={500}>
          <Popup>Your ZIP code {meta?.zip}</Popup>
        </Marker>
      )}

      {located.map(({ therapist, index }) => (
        <Marker
          key={therapist.id}
          position={[therapist.latitude as number, therapist.longitude as number]}
          icon={numberedIcon(index, selectedId === therapist.id)}
          ref={(marker) => {
            markerRefs.current[therapist.id] = marker
          }}
          eventHandlers={{ click: () => onSelect(therapist.id) }}
        >
          <Popup>
            <strong>
              {index + 1}. {therapist.name}
            </strong>
            <br />
            {formatDistanceBadge(therapist).text}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
