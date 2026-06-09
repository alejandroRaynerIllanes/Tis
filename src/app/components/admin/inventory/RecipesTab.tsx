import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChefHat,
  Edit2,
  Plus
} from 'lucide-react'
import type { Ingrediente } from '../../../services/inventario.service'
import { useAppContext } from '../../../context/AppContext'
import { RecipeEditorModal } from './RecipeEditorModal'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipesTabProps {
  ingredients: Ingrediente[]
  recipes?: any[]
  onRefresh?: () => Promise<void>
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RecipesTab({ ingredients, recipes = [], onRefresh }: RecipesTabProps) {
  const { products: dishes } = useAppContext()
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Filtrar recetas válidas que vengan de la BD
  const validRecipes = recipes.filter((r) => r && r.plato)

  // Referencias seleccionadas
  const selectedDish = dishes.find((d) => d.id === selectedDishId)
  const selectedRecipe = validRecipes.find(
    (r) => r.plato._id === selectedDishId || r.plato === selectedDishId
  )

  // Estado vacío si el menú no tiene ningún plato registrado aún
  if (dishes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-md border border-[#FCE4D6]/60 flex flex-col items-center justify-center text-center min-h-[500px]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
          <ChefHat size={40} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-black text-[#4B2E2D] mb-2">Sin platos registrados</h3>
        <p className="text-gray-500 font-medium max-w-md">
          Los platos del menú aún no han sido configurados. Registra platos en Gestión de Menú para verlos aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Panel Izquierdo: Platos del Menú */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 w-full lg:w-1/3 flex flex-col min-h-[500px] lg:max-h-[700px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black text-[#4B2E2D]">Platos (Menú)</h2>
        </div>
        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
          {dishes.map((dish) => {
            const isSelected = selectedDishId === dish.id
            const hasRecipe = validRecipes.some(
              (r) => r.plato._id === dish.id || r.plato === dish.id
            )
            return (
              <button
                key={dish.id}
                onClick={() => setSelectedDishId(dish.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#FCE4D6] text-[#D0543A] shadow-sm ring-1 ring-[#D0543A]/20'
                    : 'bg-gray-50 text-[#4B2E2D] hover:bg-[#FCE4D6]/40 hover:text-[#D0543A]'
                }`}
              >
                <span className="truncate pr-2">{dish.name}</span>
                {hasRecipe ? (
                  <BookOpen
                    size={16}
                    className={
                      isSelected
                        ? 'text-[#D0543A]'
                        : 'text-emerald-500 opacity-60 group-hover:opacity-100'
                    }
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Panel Derecho: Detalle */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#FCE4D6]/60 flex-1 min-h-[500px] flex flex-col">
        {!selectedDish ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <ChefHat size={64} className="text-[#4B2E2D] mb-4 opacity-30" />
            <h3 className="text-xl font-black text-[#4B2E2D]">Selecciona un plato</h3>
            <p className="text-sm font-medium text-[#4B2E2D]/60 mt-2">
              Para ver su receta y escandallo.
            </p>
          </div>
        ) : !selectedRecipe ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <BookOpen size={32} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-[#4B2E2D] uppercase tracking-wide mb-2">
              {selectedDish.name}
            </h3>
            <p className="text-gray-500 font-medium mb-6">
              Este plato aún no tiene receta configurada.
            </p>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] transition-all"
            >
              <Plus size={18} strokeWidth={3} /> Crear Receta
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#FCE4D6]">
              <div>
                <p className="text-xs font-bold text-[#D0543A] uppercase tracking-widest mb-1">
                  Receta configurada
                </p>
                <h3 className="text-3xl font-black text-[#4B2E2D] uppercase">
                  {selectedDish.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FCE4D6]/50 text-[#D0543A] hover:bg-[#FCE4D6] font-bold rounded-xl transition-all border border-[#FCE4D6]"
              >
                <Edit2 size={16} /> Editar Receta
              </button>
            </div>

            <h4 className="text-lg font-black text-[#4B2E2D] mb-4">Ingredientes:</h4>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {!selectedRecipe.ingredientes || selectedRecipe.ingredientes.length === 0 ? (
                <p className="text-sm font-medium text-gray-400 italic">
                  No hay ingredientes registrados para esta receta.
                </p>
              ) : (
                selectedRecipe.ingredientes.map((ing: any, idx: number) => {
                  const ingData = ing.ingrediente
                  const ingName =
                    ingData?.nombre ||
                    ingredients.find((i) => i._id === ingData)?.nombre ||
                    'Ingrediente no disponible'

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span className="font-bold text-[#4B2E2D] text-base">{ingName}</span>
                      </div>
                      <div className="bg-white px-4 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5">
                        <span className="font-black text-[#D0543A]">
                          {ing.cantidadNecesaria || 0}
                        </span>
                        <span className="font-bold text-gray-500 text-sm">
                          {ing.unidadMedida || '-'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-[#FCE4D6] flex justify-between items-center bg-[#FCE4D6]/20 p-5 rounded-2xl shrink-0">
              <span className="font-bold text-[#4B2E2D]/70 uppercase text-sm tracking-wider">
                Total Ingredientes
              </span>
              <span className="font-black text-2xl text-[#4B2E2D]">
                {selectedRecipe.ingredientes?.length || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      <RecipeEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        dish={selectedDish ? { id: selectedDish.id, name: selectedDish.name } : null}
        recipe={selectedRecipe}
        ingredients={ingredients}
        onSuccess={async () => { if (onRefresh) await onRefresh() }}
      />
    </div>
  )
}
