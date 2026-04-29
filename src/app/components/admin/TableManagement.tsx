// src/app/components/admin/TableManagement.tsx
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { WaiterView } from '../WaiterView'
import { MAX_VIP_TABLES } from '../../data/constants'
import { toast } from 'sonner'
import { locationsService } from '../../services/locations.service'
import { tablesService } from '../../services/tables.service'

interface TableManagementProps {
  locations: any[]
  setLocations: (locs: any[]) => void
}

export function TableManagement({ locations, setLocations }: TableManagementProps) {
  const { tables, setTables } = useAppContext()

  // Estados Modales
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [tableEditingId, setTableEditingId] = useState<string | null>(null)
  const [tableFormData, setTableFormData] = useState({
    number: '',
    capacity: 2,
    locationId: 'interior',
    tableType: 'normal' as 'vip' | 'normal'
  })
  const [tableToDelete, setTableToDelete] = useState<string | null>(null)
  const [vipLimitError, setVipLimitError] = useState(false)

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locationEditingId, setLocationEditingId] = useState<string | null>(null)
  const [locationFormData, setLocationFormData] = useState({ name: '' })
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null)
  const [showLocationForm, setShowLocationForm] = useState(false)

  // 🚀 Cargar datos reales desde el backend al iniciar
  const cargarDatos = async () => {
    try {
      const [locs, tabs] = await Promise.all([locationsService.getAll(), tablesService.getAll()])

      setLocations(locs.map((l) => ({ id: l._id, name: l.nombre })))

      setTables(
        tabs.map((t) => ({
          id: t._id,
          name: t.numero,
          capacity: t.capacidad,
          // Si la ubicación viene expandida (objeto), tomamos su _id
          location: typeof t.ubicacion === 'object' ? t.ubicacion._id : t.ubicacion,
          type: t.tipo,
          status: t.estado
        }))
      )
    } catch (error) {
      console.error('Error al cargar mesas y ubicaciones:', error)
      toast.error('Error al cargar los datos desde el servidor.')
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // -- Funciones de Mesas --
  const handleOpenAddTableModal = () => {
    setTableEditingId(null)
    setTableFormData({
      number: '',
      capacity: 2,
      locationId: locations.length > 0 ? locations[0].id : 'interior',
      tableType: 'normal'
    })
    setVipLimitError(false)
    setIsTableModalOpen(true)
  }

  const handleOpenEditTableModal = (table: any) => {
    setTableEditingId(table.id)
    setTableFormData({
      number: table.name,
      capacity: table.capacity || 2,
      locationId: table.location,
      tableType: table.type || 'normal'
    })
    setVipLimitError(false)
    setIsTableModalOpen(true)
  }

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableFormData.number || !tableFormData.capacity) return
    if (Number(tableFormData.capacity) > 20) {
      toast.warning('Capacidad máxima es de 20 personas.')
      return
    }

    if (tableFormData.tableType === 'vip') {
      const currentVipTables = tables.filter((t) => t.type === 'vip')
      const vipCount = tableEditingId
        ? currentVipTables.filter((t) => t.id !== tableEditingId).length
        : currentVipTables.length
      if (vipCount >= MAX_VIP_TABLES) {
        setVipLimitError(true)
        return
      }
    }

    try {
      const payload = {
        numero: tableFormData.number,
        capacidad: Number(tableFormData.capacity),
        ubicacion: tableFormData.locationId,
        tipo: tableFormData.tableType,
        estado: 'Disponible' as const
      }

      if (tableEditingId) {
        const updated = await tablesService.update(tableEditingId, payload)
        setTables(
          tables.map((t) =>
            t.id === tableEditingId
              ? {
                  ...t,
                  name: updated.numero,
                  capacity: updated.capacidad,
                  location:
                    typeof updated.ubicacion === 'object'
                      ? updated.ubicacion._id
                      : updated.ubicacion,
                  type: updated.tipo
                }
              : t
          )
        )
        toast.success('Mesa actualizada correctamente.')
      } else {
        const created = await tablesService.create(payload)
        setTables([
          ...tables,
          {
            id: created._id,
            name: created.numero,
            capacity: created.capacidad,
            location:
              typeof created.ubicacion === 'object' ? created.ubicacion._id : created.ubicacion,
            status: created.estado,
            type: created.tipo
          }
        ])
        toast.success('Mesa creada correctamente.')
      }

      setVipLimitError(false)
      setIsTableModalOpen(false)
    } catch (error) {
      console.error('Error al guardar la mesa:', error)
      toast.error('Hubo un error al guardar la mesa.')
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    try {
      await tablesService.remove(tableId)
      setTables(tables.filter((t) => t.id !== tableId))
      setTableToDelete(null)
      toast.success('Mesa eliminada.')
    } catch (error) {
      console.error('Error al eliminar la mesa:', error)
      toast.error('Error al eliminar la mesa.')
    }
  }

  // -- Funciones de Ubicaciones --
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationFormData.name) return
    try {
      if (locationEditingId) {
        const updated = await locationsService.update(locationEditingId, locationFormData.name)
        setLocations(
          locations.map((loc) =>
            loc.id === locationEditingId ? { ...loc, name: updated.nombre } : loc
          )
        )
      } else {
        const created = await locationsService.create(locationFormData.name)
        setLocations([...locations, { id: created._id, name: created.nombre }])
      }
      setShowLocationForm(false)
      setLocationFormData({ name: '' })
      toast.success('Ubicación guardada con éxito.')
    } catch (error) {
      console.error('Error al guardar la ubicación:', error)
      toast.error('Error al guardar la ubicación.')
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await locationsService.remove(locationId)
      setLocations(locations.filter((loc) => loc.id !== locationId))
      setTables(tables.filter((t) => t.location !== locationId))
      setLocationToDelete(null)
      toast.success('Ubicación eliminada.')
    } catch (error: any) {
      console.error('Error al eliminar la ubicación:', error)
      // Mostrar el mensaje exacto del backend (ej: "No puedes eliminar porque tiene mesas")
      toast.error(error.message || 'No se pudo eliminar la ubicación.')
    }
  }

  return (
    <>
      <WaiterView
        isEmbedded
        onAddTable={handleOpenAddTableModal}
        onManageLocations={() => {
          setShowLocationForm(false)
          setLocationEditingId(null)
          setLocationFormData({ name: '' })
          setIsLocationModalOpen(true)
        }}
        onEditTable={handleOpenEditTableModal}
        onDeleteTable={setTableToDelete}
      />

      {/* Modal de Mesas */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[400px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative shadow-2xl">
            <button
              onClick={() => {
                setIsTableModalOpen(false)
                setVipLimitError(false)
              }}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A]"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">
              {tableEditingId ? 'Editar Mesa' : 'Nueva Mesa'}
            </h2>
            <form className="space-y-5" onSubmit={handleSaveTable}>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Identificador</label>
                <input
                  type="text"
                  required
                  value={tableFormData.number}
                  onChange={(e) => setTableFormData({ ...tableFormData, number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Capacidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={tableFormData.capacity}
                  onChange={(e) =>
                    setTableFormData({ ...tableFormData, capacity: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Ubicación</label>
                <select
                  value={tableFormData.locationId}
                  onChange={(e) =>
                    setTableFormData({ ...tableFormData, locationId: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] bg-white"
                  required
                >
                  <option value="" disabled>
                    Selecciona...
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Tipo de Mesa</label>
                <select
                  value={tableFormData.tableType}
                  onChange={(e) => {
                    setTableFormData({
                      ...tableFormData,
                      tableType: e.target.value as 'vip' | 'normal'
                    })
                    setVipLimitError(false)
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] bg-white"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              {vipLimitError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                  <p className="text-sm font-bold text-red-700">Límite de mesas VIP alcanzado.</p>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-6 py-3 font-bold text-[#4B2E2D]/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gestión de Ubicaciones */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[500px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative shadow-2xl">
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A]"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">Gestión de Ubicaciones</h2>
            {!showLocationForm ? (
              <>
                <button
                  onClick={() => {
                    setLocationEditingId(null)
                    setLocationFormData({ name: '' })
                    setShowLocationForm(true)
                  }}
                  className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3 rounded-xl font-bold w-full justify-center mb-6"
                >
                  <Plus size={20} /> Añadir Ubicación
                </button>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {locations.map((loc) => {
                    const tablesCount = tables.filter((t) => t.location === loc.id).length
                    return (
                      <div
                        key={loc.id}
                        className="bg-[#FCE4D6]/30 p-4 rounded-xl flex items-center justify-between group border border-transparent"
                      >
                        <div>
                          <h3 className="text-lg font-bold text-[#4B2E2D]">{loc.name}</h3>
                          <p className="text-sm text-[#4B2E2D]/60">{tablesCount} mesas</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setLocationEditingId(loc.id)
                              setLocationFormData({ name: loc.name })
                              setShowLocationForm(true)
                            }}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-white rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setLocationToDelete(loc.id)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveLocation}>
                <input
                  type="text"
                  required
                  value={locationFormData.name}
                  onChange={(e) => setLocationFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] mb-6"
                  placeholder="Ej: Terraza..."
                />
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowLocationForm(false)}
                    className="px-6 py-3 font-bold text-[#4B2E2D]/60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modales de Confirmación de Eliminación */}
      {tableToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-[#D0543A] mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-[#4B2E2D]">¿Eliminar Mesa?</h2>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setTableToDelete(null)}
                className="flex-1 py-3 px-4 font-bold border-2 border-[#4B2E2D] rounded-xl text-[#4B2E2D]"
              >
                Cancelar
              </button>
              <button
                onClick={() => tableToDelete && handleDeleteTable(tableToDelete)}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {locationToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-[#D0543A] mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-[#4B2E2D]">¿Eliminar Ubicación?</h2>
            <p className="text-sm">Se borrarán las mesas asociadas.</p>
            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => setLocationToDelete(null)}
                className="flex-1 py-3 px-4 font-bold border-2 border-[#4B2E2D] rounded-xl text-[#4B2E2D]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteLocation(locationToDelete)}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
