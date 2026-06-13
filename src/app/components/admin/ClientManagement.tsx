import React, { useState, useEffect, useMemo } from 'react'
import { Users, UserCheck, Star, Search, Trash2 } from 'lucide-react'
import { api } from '../../services/api'
import { toast } from 'sonner'
import { User as GlobalUser } from '../../types'

export function ClientManagement() {
  const [clients, setClients] = useState<GlobalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'todos' | 'activos' | 'frecuentes'>('todos')

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get<GlobalUser[]>('/usuarios')
        const usersData = (res as any).data || res || []
        const clientUsers = usersData.filter((u: GlobalUser) => u.rol === 'Cliente')
        setClients(clientUsers)
      } catch (error) {
        console.error('Error fetching clients', error)
        toast.error('Error al cargar clientes')
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const stats = useMemo(() => {
    const registrados = clients.length
    const activos = clients.filter(c => c.estado).length
    const frecuentes = 0 // Inicialmente 0, se conectará al módulo Delivery
    return { registrados, activos, frecuentes }
  }, [clients])

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch =
        `${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.telefono || '').includes(searchTerm)

      let matchesFilter = true
      if (filter === 'activos') matchesFilter = c.estado === true
      if (filter === 'frecuentes') matchesFilter = false // Aún no implementado

      return matchesSearch && matchesFilter
    })
  }, [clients, searchTerm, filter])

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente? Se revocará su acceso.')) {
      try {
        await api.delete(`/usuarios/${id}`)
        setClients(prev => prev.filter(c => (c._id || c.id) !== id))
        toast.success('Cliente eliminado exitosamente')
      } catch (error) {
        toast.error('Error al eliminar cliente')
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FCE4D6]">
      <header className="px-10 py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 border-b border-[#E0D0C5]/60">
        <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Clientes Registrados</h1>
        <p className="text-[#4B2E2D]/70 font-medium">Gestión de clientes registrados, activos y frecuentes.</p>
      </header>

      <div className="p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0D0C5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Users size={24}/></div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Clientes Registrados</p>
              <p className="text-3xl font-black text-[#4B2E2D]">{stats.registrados}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0D0C5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><UserCheck size={24}/></div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Clientes Activos</p>
              <p className="text-3xl font-black text-[#4B2E2D]">{stats.activos}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0D0C5] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Star size={24}/></div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Clientes Frecuentes</p>
              <p className="text-3xl font-black text-[#4B2E2D]">{stats.frecuentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#E0D0C5] overflow-hidden">
          <div className="p-6 border-b border-[#E0D0C5] flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar cliente por nombre, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]"
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button onClick={() => setFilter('todos')} className={`flex-1 sm:px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'todos' ? 'bg-white shadow text-[#4B2E2D]' : 'text-gray-500 hover:bg-gray-200'}`}>Todos</button>
              <button onClick={() => setFilter('activos')} className={`flex-1 sm:px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'activos' ? 'bg-white shadow text-[#4B2E2D]' : 'text-gray-500 hover:bg-gray-200'}`}>Activos</button>
              <button onClick={() => setFilter('frecuentes')} className={`flex-1 sm:px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'frecuentes' ? 'bg-white shadow text-[#4B2E2D]' : 'text-gray-500 hover:bg-gray-200'}`}>Frecuentes</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-gray-500 font-bold">Cargando clientes...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <Users size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-[#4B2E2D] mb-2">No se encontraron clientes</h3>
                <p className="text-gray-500 font-medium">Aún no hay clientes registrados en la plataforma o que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-500 text-sm">Nombre</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-500 text-sm">Contacto</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-500 text-sm">Estado</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-500 text-sm">Fecha Registro</th>
                    <th className="text-right py-4 px-6 font-bold text-gray-500 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map(client => (
                    <tr key={client._id || client.id || ''} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FCE4D6] text-[#D96C4A] flex items-center justify-center font-bold">
                            {client.nombre?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-bold text-[#4B2E2D]">{client.nombre} {client.apellido}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-[#4B2E2D]">{client.email}</p>
                        <p className="text-xs text-gray-500">{(client as any).telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${client.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {client.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleDeleteClient(String(client._id || client.id))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Cliente">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}