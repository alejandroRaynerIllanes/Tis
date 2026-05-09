import React, { useEffect, useState } from 'react'
import { UserCheck, MapPin, Receipt, Coins, Flame, ChefHat } from 'lucide-react'
import { usersService } from '../../services/users.service'
import { api } from '../../services/api'

export function ActiveWaitersSection() {
  const [waitersData, setWaitersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener todos los usuarios y filtrar meseros
        const users = await usersService.getAll()
        const waiters = users.filter((u: any) => u.rol.toLowerCase() === 'mesero' && u.estado === true)

        // 2. Obtener órdenes de hoy optimizadas desde el servidor
        const todaysOrders = await api.get<any[]>('/pedidos?hoy=true')

        // 3. Cruzar datos (Mapear a cada mesero sus órdenes)
        const enrichedWaiters = waiters.map((waiter: any) => {
          const myOrders = todaysOrders.filter((o: any) => o.usuario?._id === waiter._id || o.usuario === waiter._id)
          
          const activeOrders = myOrders.filter((o: any) => ['ABIERTO', 'EN_PREPARACION', 'ENTREGADO', 'SERVIDO'].includes(o.estado))
          const closedOrders = myOrders.filter((o: any) => o.estado === 'CERRADO')
          
          const totalSold = closedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
          const totalTips = closedOrders.reduce((sum: number, o: any) => sum + (o.montoPropina || 0), 0)

          // Deducir zona principal según la mesa que más atendieron
          const locationsCounts: any = {}
          myOrders.forEach((o: any) => {
            const loc = o.mesa?.ubicacion?.nombre || o.mesa?.ubicacionId?.nombre || 'Interior'
            locationsCounts[loc] = (locationsCounts[loc] || 0) + 1
          })
          const primaryZone = Object.keys(locationsCounts).sort((a,b) => locationsCounts[b] - locationsCounts[a])[0] || 'Sin asignar'

          return {
            id: waiter._id,
            name: `${waiter.nombre} ${waiter.apellido}`,
            status: activeOrders.length > 0 ? 'Ocupado' : 'Libre',
            zone: primaryZone,
            activeTables: activeOrders.length,
            totalOrders: closedOrders.length,
            totalSold: totalSold,
            totalTips: totalTips
          }
        })

        setWaitersData(enrichedWaiters)
      } catch (error) {
        console.error('Error fetching waiters data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <header className="px-10 py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 border-b border-[#E0D0C5]/60">
        <h1 className="text-4xl font-bold text-[#4B2E2D] flex items-center gap-3">
          <UserCheck className="text-[#D96C4A]" size={36} strokeWidth={2.5} />
          Meseros Activos
        </h1>
        <p className="text-[#4B2E2D]/70 font-medium mt-2">
          Monitoreo en tiempo real del personal de salón y sus métricas del día (BD Conectada).
        </p>
      </header>

      <div className="p-10 pt-6">
        {loading ? (
          <p className="text-center py-10 font-bold text-[#4B2E2D]/50">Cargando estadísticas del personal...</p>
        ) : waitersData.length === 0 ? (
          <div className="text-center py-16 bg-white/50 rounded-3xl border border-white"><ChefHat size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-bold">No hay meseros activos en este momento.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {waitersData.map((waiter) => (
              <div key={waiter.id} className="bg-white rounded-3xl p-6 shadow-xl border border-[#FCE4D6] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                {waiter.status === 'Ocupado' && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-400 to-transparent opacity-20 rounded-bl-full" />}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B3E2E] to-[#D96C4A] text-white flex items-center justify-center font-black text-xl shadow-md">{waiter.name.charAt(0)}</div>
                    <div><h3 className="font-black text-lg text-[#4B2E2D] leading-tight">{waiter.name}</h3><span className="flex items-center gap-1 text-xs font-bold text-[#4B2E2D]/60 mt-0.5"><MapPin size={12} /> Zona: {waiter.zone}</span></div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${waiter.status === 'Ocupado' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {waiter.status === 'Ocupado' ? 'En servicio' : 'Libre'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Flame size={12} className="text-orange-500"/> Mesas Activas</p><p className="text-2xl font-black text-[#4B2E2D]">{waiter.activeTables}</p></div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Receipt size={12} className="text-blue-500"/> Pedidos (Cerrados)</p><p className="text-2xl font-black text-[#4B2E2D]">{waiter.totalOrders}</p></div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Total Vendido</p><p className="text-lg font-black text-[#D96C4A]">Bs. {waiter.totalSold.toFixed(2)}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-end gap-1"><Coins size={12} className="text-emerald-500"/> Propinas</p><p className="text-lg font-black text-emerald-600">Bs. {waiter.totalTips.toFixed(2)}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}