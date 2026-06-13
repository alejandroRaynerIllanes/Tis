import React, { useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'

interface MapPickerProps {
  onLocationSelect: (data: { lat: number; lng: number; distance: number; time: number; cost: number }) => void
  initialLat?: number
  initialLng?: number
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [pinPos, setPinPos] = useState<{ x: number; y: number } | null>(null)

  const calculateMetrics = (distKm: number) => {
    const time = Math.round(10 + distKm * 5)
    const cost = Math.max(5, Math.round(distKm * 3))
    return { time, cost }
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPinPos({ x, y })

    const center_x = rect.width / 2
    const center_y = rect.height / 2

    const distPixels = Math.sqrt(Math.pow(x - center_x, 2) + Math.pow(y - center_y, 2))
    const distKm = parseFloat(Math.max(0.5, distPixels / 30).toFixed(1))
    const { time, cost } = calculateMetrics(distKm)

    onLocationSelect({
      lat: -17.3895 + (y - center_y) * -0.0005,
      lng: -66.1568 + (x - center_x) * 0.0005,
      distance: distKm,
      time,
      cost
    })
  }

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      toast.info('Obteniendo ubicación GPS...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords
          const R = 6371 // Radio de la Tierra en Km
          const dLat = (lat - -17.3895) * (Math.PI / 180)
          const dLon = (lng - -66.1568) * (Math.PI / 180)
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(-17.3895 * (Math.PI / 180)) *
              Math.cos(lat * (Math.PI / 180)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distKm = parseFloat(Math.max(0.5, R * c).toFixed(1))
          const { time, cost } = calculateMetrics(distKm)

          setPinPos({ x: 150, y: 100 }) // Pin visual representativo
          onLocationSelect({ lat, lng, distance: distKm, time, cost })
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
      <button
        onClick={handleGetLocation}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold border border-blue-200 hover:bg-blue-100 transition-all active:scale-95"
      >
        <Navigation size={18} /> Usar mi ubicación actual (GPS)
      </button>

      <div
        onClick={handleMapClick}
        className="w-full h-56 bg-gray-200 rounded-2xl relative cursor-crosshair overflow-hidden border-2 border-[#D96C4A]/30 hover:border-[#D96C4A] transition-all shadow-inner group shrink-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 transition-colors"></div>
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-[#4B2E2D] shadow-sm">
            Leaflet | © Carto
          </span>
        </div>
        {pinPos ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-full drop-shadow-xl transition-all duration-200 ease-out z-10"
            style={{ left: pinPos.x, top: pinPos.y }}
          >
            <MapPin size={40} className="text-[#D96C4A] drop-shadow-md" fill="currentColor" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-[#4B2E2D] text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-bounce">
              <MapPin size={16} /> Toca el mapa para fijar tu ubicación
            </div>
          </div>
        )}
      </div>
    </div>
  )
}