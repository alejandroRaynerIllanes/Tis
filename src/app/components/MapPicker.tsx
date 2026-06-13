import React, { useState, useEffect } from 'react'
import { Navigation, Info } from 'lucide-react'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet'
// @ts-ignore - TS no reconoce los imports de CSS por defecto, pero Vite sí los procesa
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Solución para cargar correctamente los íconos de Leaflet en React/Vite
const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
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

// Ubicación Predeterminada: América y Libertador (Cochabamba)
const RESTAURANT_POS: [number, number] = [-17.3895, -66.1568]

interface MapPickerProps {
  onLocationSelect: (data: { lat: number; lng: number; distance: number; time: number; cost: number }) => void
  initialLat?: number
  initialLng?: number
}

// Sub-componente para capturar los clics en el mapa interactivo
function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationSelected(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  const calculateDistanceAndCost = (lat: number, lng: number) => {
    const R = 6371 // Radio de la Tierra en Km
    const dLat = (lat - RESTAURANT_POS[0]) * (Math.PI / 180)
    const dLon = (lng - RESTAURANT_POS[1]) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(RESTAURANT_POS[0] * (Math.PI / 180)) *
        Math.cos(lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distKm = parseFloat(Math.max(0.5, R * c).toFixed(1))

    const time = Math.round(10 + distKm * 5)
    let cost = 5
    if (distKm > 1.5) {
      cost += Math.round((distKm - 1.5) * 3)
    }
    return { distance: distKm, time, cost }
  }

  const handleLocationSelected = (lat: number, lng: number) => {
    setUserPos([lat, lng])
    const { distance, time, cost } = calculateDistanceAndCost(lat, lng)
    onLocationSelect({ lat, lng, distance, time, cost })
  }

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      toast.info('Obteniendo ubicación GPS...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationSelected(position.coords.latitude, position.coords.longitude)
          toast.success('¡Ubicación real obtenida!')
        },
        () => toast.error('Activa los permisos de ubicación en tu navegador.')
      )
    } else {
      toast.error('Geolocalización no soportada.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Tarifario Estándar */}
      <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 flex items-start gap-3 shadow-sm">
        <div className="bg-blue-100 p-1.5 rounded-lg shrink-0 mt-0.5">
          <Info size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-black text-blue-900">Tarifa estándar de Delivery</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed font-medium">
            Costo base: <b>Bs. 5.00</b> (hasta 1.5 km).<br/>
            Adicional: <b>Bs. 3.00</b> por cada kilómetro extra.
          </p>
        </div>
      </div>

      <button
        onClick={handleGetLocation}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold border border-blue-200 hover:bg-blue-100 transition-all active:scale-95"
      >
        <Navigation size={18} /> Usar mi ubicación actual (GPS)
      </button>

      <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-[#D96C4A]/30 relative z-0">
        <MapContainer 
          center={RESTAURANT_POS} 
          zoom={14} 
          style={{ width: '100%', height: '100%', zIndex: 0 }}
        >
          {/* Mapa base visual y liviano */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <Marker position={RESTAURANT_POS} icon={restaurantIcon}>
            <Popup><strong>Restaurante Sabor & Gestión</strong><br/>Av. América y Libertador</Popup>
          </Marker>

          {userPos && (
            <>
              <Marker position={userPos} icon={userIcon}>
                <Popup>Tu ubicación de entrega</Popup>
              </Marker>
              {/* Línea azul punteada de conexión */}
              <Polyline positions={[RESTAURANT_POS, userPos]} color="#3b82f6" weight={4} dashArray="5, 10" />
            </>
          )}
          
          <MapEvents onLocationSelected={handleLocationSelected} />
        </MapContainer>
      </div>
    </div>
  )
}