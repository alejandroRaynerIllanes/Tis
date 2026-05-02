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
  setLocations: React.Dispatch<React.SetStateAction<any[]>>
}

type ManagedTable = {
  id?: string
  _id?: string
  name?: string
  nombre?: string
  numero?: string | number
  location?: string
  locationId?: string
  ubicacion?: string
  status?: string
  estado?: string
}

const getTableDisplayName = (table: ManagedTable) => {
  return table.name || table.nombre || table.numero || ''
}

const getTableLocation = (table: ManagedTable) => {
  return table.location || table.ubicacion || ''
}

const isDeletedTable = (table: ManagedTable) => {
  const status = table.status || table.estado || ''
  return status.toLowerCase() === 'eliminada' || status.toLowerCase() === 'eliminado'
}

export function TableManagement({ locations, setLocations }: TableManagementProps) {
  const { tables, createTable, updateTable, deleteTable, setTables } = useAppContext()

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
  const [tableError, setTableError] = useState<string | null>(null)

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locationEditingId, setLocationEditingId] = useState<string | null>(null)
  const [locationFormData, setLocationFormData] = useState({ name: '' })
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // 🚀 Cargar datos reales desde el backend al iniciar
  const cargarDatos = async () => {
    try {
      const locs = await locationsService.getAll()
      setLocations(locs.map((l: any) => ({ id: l.id || l._id, name: l.nombre || l.name })))
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
    setTableError(null)
    setIsTableModalOpen(true)
  }

  const handleOpenEditTableModal = (table: any) => {
    setTableEditingId(table.id)
    const locId = table.locationId || locations.find(l => l.name === getTableLocation(table))?.id || (locations.length > 0 ? locations[0].id : 'interior')
    setTableFormData({
      number: String(getTableDisplayName(table)),
      capacity: table.capacity || 2,
      locationId: locId,
      tableType: table.type || 'normal'
    })
    setVipLimitError(false)
    setTableError(null)
    setIsTableModalOpen(true)
  }

  const validateTable = (name: string) => {
    const nom = name.toLowerCase().trim()
    if (!nom) return 'El identificador es requerido. Ejemplo: "Mesa Interior 1"'
    if (!/^[a-záéíóúñ0-9\s]+$/i.test(nom)) return 'No se permiten símbolos especiales.'
    if (!nom.includes('mesa')) return 'Debe incluir la palabra "mesa".'
    const ubs = ['interior', 'patio', 'terraza']
    if (!ubs.some(ub => nom.includes(ub))) return 'Debe incluir una ubicación válida (interior, patio, terraza).'
    const nums = nom.match(/\d+/g)
    if (nums) {
      for (const n of nums) {
        if (n.length > 3) return 'Máximo 3 dígitos numéricos.'
        if (parseInt(n, 10) > 50) return 'El número no puede ser mayor a 50.'
      }
    }
    return null
  }

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateTable(tableFormData.number)
    if (err) {
      setTableError(err)
      return
    }
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
      const payload: any = {
        name: tableFormData.number,
        capacity: Number(tableFormData.capacity),
        location: tableFormData.locationId,
        type: tableFormData.tableType
      }

      if (tableEditingId) {
        await updateTable(tableEditingId, payload)
        toast.success('Mesa actualizada correctamente.')
      } else {
        await createTable(payload)
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
      await deleteTable(tableId)
      setTableToDelete(null)
      toast.success('Mesa eliminada.')
    } catch (error) {
      console.error('Error al eliminar la mesa:', error)
      toast.error('Error al eliminar la mesa.')
    }
  }

  // -- Funciones de Ubicaciones --
  const validateLocation = (name: string) => {
    const nom = name.trim()
    if (!nom) return 'El nombre de la ubicación es requerido.'
    if (nom.length < 3) return 'Mínimo 3 caracteres.'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(nom)) return 'Solo letras y espacios. Sin números ni símbolos.'
    return null
  }

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateLocation(locationFormData.name)
    if (err) {
      setLocationError(err)
      return
    }
    try {
      if (locationEditingId) {
        const updated = await locationsService.update(locationEditingId, locationFormData.name)
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationEditingId || loc._id === locationEditingId ? { ...loc, name: updated.nombre || updated.name } : loc
          )
        )
      } else {
        const created = await locationsService.create(locationFormData.name)
        setLocations((prev) => [
          ...prev, 
          { id: created.id || created._id, name: created.nombre || created.name }
        ])
      }
      setShowLocationForm(false)
      setLocationFormData({ name: '' })
      window.dispatchEvent(new Event('locations_updated'))
      toast.success('Ubicación guardada con éxito.')
    } catch (error) {
      console.error('Error al guardar la ubicación:', error)
      toast.error('Error al guardar la ubicación.')
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    console.log('[FRONTEND] 🚀 Iniciando eliminación. Enviando ID al backend:', locationId)
    try {
      await locationsService.remove(locationId)
      console.log('[FRONTEND] ✅ Eliminado en backend. Actualizando UI...')
      // Ahora podemos usar (prev) de forma segura para garantizar que la UI se limpie inmediatamente
      setLocations((prev) => prev.filter((loc) => loc.id !== locationId && loc._id !== locationId))
      setTables((prevTables: any[]) => prevTables.filter((t: any) => getTableLocation(t) !== locationId))
      setLocationToDelete(null)
      window.dispatchEvent(new Event('locations_updated'))
      toast.success('Ubicación eliminada.')
    } catch (error: any) {
      console.error('[FRONTEND] ❌ Error al eliminar la ubicación:', error)
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
          setLocationError(null)
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
                  onChange={(e) => {
                    setTableFormData({ ...tableFormData, number: e.target.value })
                    setTableError(validateTable(e.target.value))
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${tableError ? 'border-red-500 focus:border-red-600 bg-red-50' : 'border-[#E57C5D] focus:border-[#D0543A]'}`}
                  placeholder="Ej: Mesa Interior 1"
                />
                {tableError && <p className="text-red-500 text-xs font-bold mt-1.5">{tableError}</p>}
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
                  {locations.map((loc, index) => (
                    <option key={loc.id || loc._id || index} value={loc.id}>
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
                  {locations.map((loc, index) => {
                    const tablesCount = tables.filter(
                      (t) => !isDeletedTable(t) && getTableLocation(t) === loc.id
                    ).length
                    return (
                      <div
                        key={loc.id || loc._id || index}
                        className="bg-[#FCE4D6]/30 p-4 rounded-xl flex items-center justify-between group border border-transparent opacity-100"
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
                            type="button"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const targetId = loc.id || loc._id
                              console.log('[UI] 🎯 Seleccionando ubicación para eliminar. ID:', targetId)
                              setLocationToDelete(targetId)
                            }}
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
                  onChange={(e) => {
                    setLocationFormData({ name: e.target.value })
                    setLocationError(validateLocation(e.target.value))
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all mb-2 ${locationError ? 'border-red-500 focus:border-red-600 bg-red-50' : 'border-[#E57C5D] focus:border-[#D0543A]'}`}
                  placeholder="Ej: Terraza..."
                />
                {locationError && <p className="text-red-500 text-xs font-bold mb-4">{locationError}</p>}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-4 border-[#D0543A] rounded-3xl p-8 relative flex flex-col items-center text-center">
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
                onClick={() => {
                  if (tableToDelete) handleDeleteTable(tableToDelete)
                }}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {locationToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-4 border-[#D0543A] rounded-3xl p-8 relative flex flex-col items-center text-center">
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
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  console.log('[MODAL] 🛑 Confirmación clickeada. Ejecutando para ID:', locationToDelete)
                  if (locationToDelete) {
                    handleDeleteLocation(locationToDelete)
                  } else {
                    toast.error('Error: El modal no tiene el ID de la ubicación')
                  }
                }}
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
