import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChefHat,
  Edit2,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import type { Ingrediente } from '../../../services/inventario.service'

// ─── Interfaces locales ────────────────────────────────────────────────────────

interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unit: string
}

interface Recipe {
  productId: string
  ingredients: RecipeIngredient[]
}

interface Product {
  id: string
  name: string
}

// ─── Datos mock (sin endpoint de backend) ─────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Pique Macho' },
  { id: '2', name: 'Lawa de Choclo' },
  { id: '3', name: 'Gran Singani' },
  { id: '4', name: 'Flan' },
  { id: '5', name: 'Gelatina' },
  { id: '6', name: 'Picaña' },
  { id: '7', name: 'Salteña' },
  { id: '8', name: 'Lomo Saltado' },
  { id: '9', name: 'Ceviche' }
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipesTabProps {
  ingredients: Ingrediente[]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RecipesTab({ ingredients }: RecipesTabProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recipeForm, setRecipeForm] = useState<{ productId: string; ingredients: RecipeIngredient[] }>(
    { productId: '', ingredients: [] }
  )
  const [tempIngId, setTempIngId] = useState('')
  const [tempIngQty, setTempIngQty] = useState('')

  const selectedProduct = MOCK_PRODUCTS.find((p) => p.id === selectedProductId)
  const selectedRecipe = recipes.find((r) => r.productId === selectedProductId)

  const openCreate = (prodId?: string) => {
    setRecipeForm({ productId: prodId || '', ingredients: [] })
    setTempIngId('')
    setTempIngQty('')
    setIsModalOpen(true)
  }

  const openEdit = (recipe: Recipe) => {
    setRecipeForm({ productId: recipe.productId, ingredients: [...recipe.ingredients] })
    setTempIngId('')
    setTempIngQty('')
    setIsModalOpen(true)
  }

  const addTempIngredient = () => {
    if (!tempIngId || !tempIngQty || isNaN(Number(tempIngQty)) || Number(tempIngQty) <= 0) return
    const ingredient = ingredients.find((i) => i._id === tempIngId)
    if (!ingredient) return

    const existingIdx = recipeForm.ingredients.findIndex((i) => i.ingredientId === tempIngId)
    const updated = [...recipeForm.ingredients]
    if (existingIdx >= 0) {
      updated[existingIdx].quantity += Number(tempIngQty)
    } else {
      updated.push({ ingredientId: tempIngId, quantity: Number(tempIngQty), unit: ingredient.unidad })
    }
    setRecipeForm({ ...recipeForm, ingredients: updated })
    setTempIngId('')
    setTempIngQty('')
  }

  const removeTempIngredient = (ingId: string) => {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter((i) => i.ingredientId !== ingId)
    })
  }

  const saveRecipe = () => {
    if (!recipeForm.productId || recipeForm.ingredients.length === 0) return
    const existingIdx = recipes.findIndex((r) => r.productId === recipeForm.productId)
    const newRecipes = [...recipes]
    if (existingIdx >= 0) {
      newRecipes[existingIdx] = { ...recipeForm }
    } else {
      newRecipes.push({ ...recipeForm })
    }
    setRecipes(newRecipes)
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel Izquierdo: Productos */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 w-full lg:w-1/3 flex flex-col min-h-[500px] lg:max-h-[700px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-black text-[#4B2E2D]">Productos</h2>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-1 text-sm font-bold text-[#D0543A] hover:text-[#b5462f] bg-[#FCE4D6]/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Nueva Receta
            </button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {MOCK_PRODUCTS.map((p) => {
              const hasRecipe = recipes.some((r) => r.productId === p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-between group ${
                    selectedProductId === p.id
                      ? 'bg-[#FCE4D6] text-[#D0543A] shadow-sm ring-1 ring-[#D0543A]/20'
                      : 'bg-gray-50 text-[#4B2E2D] hover:bg-[#FCE4D6]/40 hover:text-[#D0543A]'
                  }`}
                >
                  <span className="truncate pr-2">{p.name}</span>
                  {hasRecipe ? (
                    <BookOpen
                      size={16}
                      className={
                        selectedProductId === p.id
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
          {!selectedProduct ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
              <ChefHat size={64} className="text-[#4B2E2D] mb-4 opacity-30" />
              <h3 className="text-xl font-black text-[#4B2E2D]">Selecciona un producto</h3>
              <p className="text-sm font-medium text-[#4B2E2D]/60 mt-2">
                Para ver o configurar su receta y escandallo.
              </p>
            </div>
          ) : !selectedRecipe ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <BookOpen size={32} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-black text-[#4B2E2D] uppercase tracking-wide mb-2">
                {selectedProduct.name}
              </h3>
              <p className="text-gray-500 font-medium mb-6">
                No existe receta configurada para este producto.
              </p>
              <button
                onClick={() => openCreate(selectedProduct.id)}
                className="flex items-center justify-center gap-2 bg-[#D0543A] hover:bg-[#b5462f] text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-[#D0543A]/30 transition-all active:scale-95"
              >
                <Plus size={20} /> Crear Receta
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
                    {selectedProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => openEdit(selectedRecipe)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                >
                  <Edit2 size={16} /> Editar Receta
                </button>
              </div>

              <h4 className="text-lg font-black text-[#4B2E2D] mb-4">Ingredientes:</h4>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {selectedRecipe.ingredients.map((ing, idx) => {
                  const data = ingredients.find((i) => i._id === ing.ingredientId)
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span className="font-bold text-[#4B2E2D] text-base">
                          {data?.nombre || 'Ingrediente desconocido'}
                        </span>
                      </div>
                      <div className="bg-white px-4 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <span className="font-black text-[#D0543A]">{ing.quantity}</span>{' '}
                        <span className="font-bold text-gray-500 text-sm">{ing.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-6 mt-4 border-t border-[#FCE4D6] flex justify-between items-center bg-[#FCE4D6]/20 p-5 rounded-2xl">
                <span className="font-bold text-[#4B2E2D]/70 uppercase text-sm tracking-wider">
                  Total Ingredientes
                </span>
                <span className="font-black text-2xl text-[#4B2E2D]">
                  {selectedRecipe.ingredients.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Receta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[600px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mb-6">
              {recipes.some((r) => r.productId === recipeForm.productId) ? 'Editar Receta' : 'Nueva Receta'}
            </h2>

            <div className="overflow-y-auto flex-1 pr-2 space-y-5">
              {/* Selector de producto */}
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
                  Producto
                </label>
                <select
                  value={recipeForm.productId}
                  onChange={(e) => setRecipeForm({ ...recipeForm, productId: e.target.value })}
                  disabled={recipes.some((r) => r.productId === recipeForm.productId)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] disabled:opacity-70 disabled:cursor-not-allowed appearance-none cursor-pointer"
                >
                  <option value="" disabled>Seleccione un producto</option>
                  {MOCK_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Agregar ingrediente */}
              <div className="bg-[#FCE4D6]/30 p-4 sm:p-5 rounded-2xl border border-[#FCE4D6]">
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-3">
                  Agregar Ingrediente
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={tempIngId}
                    onChange={(e) => setTempIngId(e.target.value)}
                    className="flex-[2] px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] cursor-pointer"
                  >
                    <option value="">Seleccione ingrediente...</option>
                    {ingredients
                      .filter((i) => !recipeForm.ingredients.some((ri) => ri.ingredientId === i._id))
                      .map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.nombre} ({i.unidad})
                        </option>
                      ))}
                  </select>
                  <div className="flex-[1] flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#D0543A]">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Cant."
                      value={tempIngQty}
                      onChange={(e) => setTempIngQty(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-bold text-[#4B2E2D] focus:outline-none text-right"
                    />
                    <span className="bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-500 border-l border-gray-200 shrink-0 min-w-[50px] text-center">
                      {tempIngId ? ingredients.find((i) => i._id === tempIngId)?.unidad : '-'}
                    </span>
                  </div>
                  <button
                    onClick={addTempIngredient}
                    disabled={!tempIngId || !tempIngQty || isNaN(Number(tempIngQty)) || Number(tempIngQty) <= 0}
                    className="sm:flex-[1] px-4 py-2.5 bg-[#4B2E2D] hover:bg-[#3A2222] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lista configurada */}
              <div>
                <h4 className="text-sm font-bold text-[#4B2E2D] mb-3">Ingredientes Configurados</h4>
                {recipeForm.ingredients.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-sm font-medium text-gray-400">
                      Aún no se han agregado ingredientes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing) => {
                      const data = ingredients.find((i) => i._id === ing.ingredientId)
                      return (
                        <div
                          key={ing.ingredientId}
                          className="flex justify-between items-center bg-white p-3 px-4 rounded-xl border border-gray-100 shadow-sm"
                        >
                          <span className="font-bold text-[#4B2E2D] text-sm">{data?.nombre}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#D0543A] text-sm">
                              {ing.quantity}{' '}
                              <span className="text-gray-500 font-bold">{ing.unit}</span>
                            </span>
                            <button
                              onClick={() => removeTempIngredient(ing.ingredientId)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-5 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveRecipe}
                disabled={!recipeForm.productId || recipeForm.ingredients.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 text-white font-black rounded-xl shadow-lg transition-all bg-[#D0543A] hover:bg-[#b5462f] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Guardar Receta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
