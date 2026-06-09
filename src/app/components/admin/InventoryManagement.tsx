import { useState, useEffect } from 'react'
import {
  Package,
  BookOpen,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { inventarioService, type Ingrediente } from '../../services/inventario.service'
import { useAppContext } from '../../context/AppContext'

// ─── Sub-componentes ──────────────────────────────────────────────────────────
import { IngredientsGrid } from './inventory/IngredientsGrid'
import { StockEntryModal } from './inventory/StockEntryModal'
import { StockAlertsTab } from './inventory/StockAlertsTab'
import { RecipesTab } from './inventory/RecipesTab'
import { DeleteConfirmModal } from './inventory/DeleteConfirmModal'
import { IngredientModal } from './inventory/IngredientModal'

// ─── Componente Orquestador ────────────────────────────────────────────────────

type ActiveTab = 'ingredientes' | 'recetas' | 'alertas'

export function InventoryManagement() {
  const { socket } = useAppContext()
  const [activeTab, setActiveTab] = useState<ActiveTab>('ingredientes')
  const [searchTerm, setSearchTerm] = useState('')

  // ─── Estado de ingredientes (fuente de verdad del orquestador) ───
  const [ingredients, setIngredients] = useState<Ingrediente[]>([])
  const [alerts, setAlerts] = useState<Ingrediente[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInventoryData = async () => {
    try {
      setIsLoading(true)
      const [estadoData, alertasData, recetasData] = await Promise.all([
        inventarioService.getInventarioEstado(),
        inventarioService.getAlertas().catch(() => []),
        inventarioService.getRecetas().catch(() => [])
      ])
      setIngredients(estadoData)
      setAlerts(alertasData)
      setRecipes(recetasData)
    } catch (err) {
      console.error('[InventoryManagement] Error cargando inventario:', err)
      toast.error('No se pudo cargar la información del inventario.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleActualizacion = () => {
      fetchInventoryData()
    }

    socket.on('inventario:actualizado', handleActualizacion)
    socket.on('inventario:alerta', handleActualizacion)

    return () => {
      socket.off('inventario:actualizado', handleActualizacion)
      socket.off('inventario:alerta', handleActualizacion)
    }
  }, [socket])

  // ─── Estado del modal de entrada de stock ───
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [preselectedIngId, setPreselectedIngId] = useState<string | undefined>(undefined)

  const openStockModal = (ingrediente?: Ingrediente) => {
    setPreselectedIngId(ingrediente?._id)
    setIsStockModalOpen(true)
  }

  // ─── Estado del modal de Ingredientes (Crear/Editar) ───
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false)
  const [ingredientToEdit, setIngredientToEdit] = useState<Ingrediente | null>(null)

  const openIngredientModal = (ingrediente?: Ingrediente) => {
    setIngredientToEdit(ingrediente || null)
    setIsIngredientModalOpen(true)
  }

  // ─── Estado del modal de eliminación ───
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null)

  const handleDeleteIngredient = async () => {
    if (ingredientToDelete) {
      try {
        await inventarioService.eliminarIngrediente(ingredientToDelete)
        toast.success('Ingrediente eliminado correctamente.')
        await fetchInventoryData()
      } catch (error) {
        toast.error('No se pudo eliminar el ingrediente.')
      } finally {
        setIngredientToDelete(null)
      }
    }
  }

  // ─── Derivados ───
  const lowStockIngredients = alerts

  // ─── Tabs config ───
  const TABS = [
    { key: 'ingredientes' as const, label: 'Ingredientes', icon: <Package size={14} /> },
    { key: 'recetas' as const, label: 'Recetas (Escandallos)', icon: <BookOpen size={14} /> },
    { key: 'alertas' as const, label: 'Alertas de Stock', icon: <AlertTriangle size={14} /> }
  ]

  return (
    <>
      {/* ── Header ── */}
      <header className="px-10 py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 border-b border-[#E0D0C5]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#4B2E2D] flex items-center gap-3">
              <Package className="text-[#D0543A]" size={36} strokeWidth={2.5} />
              Inventario
            </h1>
            <p className="text-[#4B2E2D]/70 font-medium mt-2">Gestión de stock y recetas</p>
          </div>
          {(activeTab === 'ingredientes') && (
            <button
              onClick={() => openIngredientModal()}
              className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <Plus size={20} strokeWidth={3} /> Nuevo Ingrediente
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-white/60 rounded-xl p-1 shadow-inner border border-[#E0D0C5]/80 w-fit overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#4B2E2D] text-white shadow-sm'
                  : 'text-[#4B2E2D]/60 hover:text-[#4B2E2D] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.key === 'alertas' && lowStockIngredients.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.key ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {lowStockIngredients.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Contenido de Tabs ── */}
      <div className="p-10 pt-6">
        {activeTab === 'ingredientes' && (
          <IngredientsGrid
            ingredients={ingredients}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRegisterEntry={openStockModal}
            onDeleteRequest={setIngredientToDelete}
            onEditRequest={openIngredientModal}
          />
        )}

      {activeTab === 'recetas' && <RecipesTab ingredients={ingredients} recipes={recipes} onRefresh={fetchInventoryData} />}

        {activeTab === 'alertas' && (
          <StockAlertsTab
            lowStockIngredients={lowStockIngredients}
            onRegisterEntry={openStockModal}
          />
        )}
      </div>

      {/* ── Modales globales ── */}
      <StockEntryModal
        isOpen={isStockModalOpen}
        ingredients={ingredients}
        preselectedId={preselectedIngId}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={fetchInventoryData}
      />

      <DeleteConfirmModal
        ingredientId={ingredientToDelete}
        onConfirm={handleDeleteIngredient}
        onCancel={() => setIngredientToDelete(null)}
      />

      <IngredientModal
        isOpen={isIngredientModalOpen}
        ingredientToEdit={ingredientToEdit}
        onClose={() => setIsIngredientModalOpen(false)}
        onSuccess={fetchInventoryData}
      />
    </>
  )
}
