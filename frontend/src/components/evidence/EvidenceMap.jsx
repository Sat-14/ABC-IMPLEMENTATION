import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [markers, map])
  return null
}

export default function EvidenceMap({ evidenceList }) {
  const markers = (evidenceList || [])
    .filter(e => e.latitude && e.longitude)
    .map(e => ({
      lat: parseFloat(e.latitude),
      lng: parseFloat(e.longitude),
      name: e.file_name,
      id: e.evidence_id,
      status: e.integrity_status,
      location: e.collection_location,
    }))
    .filter(m => !isNaN(m.lat) && !isNaN(m.lng))

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
        <MapPin className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No geo-tagged evidence in this case</p>
        <p className="text-xs mt-1">Add latitude/longitude during upload to see evidence on the map</p>
      </div>
    )
  }

  const center = [
    markers.reduce((s, m) => s + m.lat, 0) / markers.length,
    markers.reduce((s, m) => s + m.lng, 0) / markers.length,
  ]

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle" style={{ height: 350 }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{m.name}</p>
                {m.location && <p className="text-gray-600">{m.location}</p>}
                <p className={m.status === 'intact' ? 'text-green-600' : m.status === 'tampered' ? 'text-red-600' : 'text-amber-600'}>
                  {m.status}
                </p>
                <p className="text-gray-400 mt-1">{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
