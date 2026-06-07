import { useState, useEffect } from 'react'
import {
  Package,
  BookOpen,
  AlertTriangle,
  ArrowRightLeft,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { inventarioService, type Ingrediente } from '../../services/inventario.service'

// ─── Sub-componentes ──────────────────────────────────────────────────────────
import { IngredientsGrid } from './inventory/IngredientsGrid'
import { StockEntryModal } from './inventory/StockEntryModal'
import { StockAlertsTab } from './inventory/StockAlertsTab'
import { MovementsTab } from './inventory/MovementsTab'
import { RecipesTab } from './inventory/RecipesTab'
import { DeleteConfirmModal } from './inventory/DeleteConfirmModal'

// ─── Componente Orquestador ────────────────────────────────────────────────────

type ActiveTab = 'ingredientes' | 'recetas' | 'alertas' | 'movimientos'

export function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ingredientes')
  const [searchTerm, setSearchTerm] = useState('')

  // ─── Estado de ingredientes (fuente de verdad del orquestador) ───
  const [ingredients, setIngredients] = useState<Ingrediente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchIngredients = async () => {
    try {
      setIsLoading(true)
      const data = await inventarioService.getInventarioEstado()
      setIngredients(data)
    } catch (err) {
      console.error('[InventoryManagement] Error cargando inventario:', err)
      toast.error('No se pudo cargar el inventario.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  // ─── Estado del modal de entrada de stock ───
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [preselectedIngId, setPreselectedIngId] = useState<string | undefined>(undefined)

  const openStockModal = (ingrediente?: Ingrediente) => {
    setPreselectedIngId(ingrediente?._id)
    setIsStockModalOpen(true)
  }

  // ─── Estado del modal de eliminación ───
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null)

  const handleDeleteIngredient = () => {
    if (ingredientToDelete) {
      setIngredients((prev) => prev.filter((i) => i._id !== ingredientToDelete))
      setIngredientToDelete(null)
    }
  }

  // ─── Derivados ───
  const lowStockIngredients = ingredients.filter(
    (i) => i.estado === 'Bajo' || i.estado === 'Agotado'
  )

  // ─── Tabs config ───
  const TABS = [
    { key: 'ingredientes' as const, label: 'Ingredientes', icon: <Package size={14} /> },
    { key: 'recetas' as const, label: 'Recetas (Escandallos)', icon: <BookOpen size={14} /> },
    { key: 'alertas' as const, label: 'Alertas de Stock', icon: <AlertTriangle size={14} /> },
    { key: 'movimientos' as const, label: 'Movimientos', icon: <ArrowRightLeft size={14} /> }
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
          {(activeTab === 'ingredientes' || activeTab === 'recetas') && (
            <button
              onClick={() => activeTab === 'ingredientes' ? openStockModal() : undefined}
              className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <Plus size={20} strokeWidth={3} /> Nuevo Registro
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
          />
        )}

        {activeTab === 'recetas' && <RecipesTab ingredients={ingredients} />}

        {activeTab === 'alertas' && (
          <StockAlertsTab
            lowStockIngredients={lowStockIngredients}
            onRegisterEntry={openStockModal}
          />
        )}

        {activeTab === 'movimientos' && <MovementsTab />}
      </div>

      {/* ── Modales globales ── */}
      <StockEntryModal
        isOpen={isStockModalOpen}
        ingredients={ingredients}
        preselectedId={preselectedIngId}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={fetchIngredients}
      />

      <DeleteConfirmModal
        ingredientId={ingredientToDelete}
        onConfirm={handleDeleteIngredient}
        onCancel={() => setIngredientToDelete(null)}
      />
    </>
  )
}
