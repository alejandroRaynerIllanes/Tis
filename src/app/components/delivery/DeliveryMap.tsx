import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// ─── Constantes del mapa ──────────────────────────────────────────────────────

const RESTAURANT_POS: [number, number] = [-17.3895, -66.1568]

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

// ─── Componente ───────────────────────────────────────────────────────────────

interface DeliveryMapProps {
  destination: [number, number]
}

export function DeliveryMap({ destination }: DeliveryMapProps) {
  const [coords, setCoords] = useState<[number, number][]>([RESTAURANT_POS, destination])

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_POS[1]},${RESTAURANT_POS[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
        )
        const data = await res.json()
        if (data.routes && data.routes[0]) {
          setCoords(
            data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
          )
        }
      } catch (_e) {
        // En caso de error de red, se mantiene la línea recta entre los dos puntos
      }
    }
    fetchRoute()
  }, [destination])

  return (
    <MapContainer center={destination} zoom={14} style={{ width: '100%', height: '100%', zIndex: 0 }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Marker position={RESTAURANT_POS} icon={restaurantIcon}>
        <Popup>Restaurante</Popup>
      </Marker>
      <Marker position={destination} icon={userIcon}>
        <Popup>Cliente</Popup>
      </Marker>
      <Polyline positions={coords} color="#3b82f6" weight={5} opacity={0.8} />
    </MapContainer>
  )
}
