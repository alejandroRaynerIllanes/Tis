import React, { useState, useEffect } from 'react'
import {
  Package,
  BookOpen,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Edit2,
  Trash2,
  ChefHat,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
}

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

interface ConsumedIngredient {
  name: string
  quantity: number
  unit: string
}

interface DishMovement {
  id: number | string
  dishName: string
  time: string
  ingredients: ConsumedIngredient[]
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Huevos', unit: 'un', stock: 150, minStock: 50 },
  { id: '2', name: 'Carne Res', unit: 'kg', stock: 12, minStock: 15 }, // Bajo stock
  { id: '3', name: 'Papa', unit: 'kg', stock: 40, minStock: 20 },
  { id: '4', name: 'Agua', unit: 'L', stock: 100, minStock: 20 },
  { id: '5', name: 'Salchicha', unit: 'kg', stock: 5, minStock: 10 }, // Bajo stock
  { id: '6', name: 'Cebolla', unit: 'kg', stock: 8, minStock: 5 }
]

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

const INITIAL_RECIPES: Recipe[] = [
  {
    productId: '1',
    ingredients: [
      { ingredientId: '1', quantity: 2, unit: 'un' },
      { ingredientId: '2', quantity: 0.5, unit: 'kg' },
      { ingredientId: '3', quantity: 0.3, unit: 'kg' },
      { ingredientId: '5', quantity: 1, unit: 'kg' }
    ]
  }
]

const MOCK_DISH_MOVEMENTS: DishMovement[] = [
  {
    id: 1,
    dishName: 'Lomo Saltado',
    time: '23:18',
    ingredients: [
      { name: 'Huevos', quantity: 2, unit: 'unidades' },
      { name: 'Carne Res', quantity: 0.5, unit: 'kg' },
      { name: 'Papa', quantity: 0.3, unit: 'kg' },
      { name: 'Salchicha', quantity: 1, unit: 'unidades' },
      { name: 'Agua', quantity: 0.5, unit: 'litros' }
    ]
  },
  {
    id: 2,
    dishName: 'Pique Macho',
    time: '21:45',
    ingredients: [
      { name: 'Carne Res', quantity: 0.8, unit: 'kg' },
      { name: 'Papa', quantity: 0.5, unit: 'kg' },
      { name: 'Salchicha', quantity: 4, unit: 'unidades' },
      { name: 'Cebolla', quantity: 0.2, unit: 'kg' }
    ]
  },
  {
    id: 3,
    dishName: 'Ceviche Clásico',
    time: '19:30',
    ingredients: [
      { name: 'Pescado', quantity: 0.4, unit: 'kg' },
      { name: 'Cebolla', quantity: 0.2, unit: 'kg' },
      { name: 'Limón', quantity: 5, unit: 'unidades' }
    ]
  }
]

// ─── Store Compartido ────────────────────────────────────────────────────────

export const sharedIngredientsStore = {
  get: (): Ingredient[] => {
    const saved = localStorage.getItem('shared_ingredients')
    if (saved) return JSON.parse(saved)
    return MOCK_INGREDIENTS.map(i => ({
      ...i,
      unit: i.unit === 'un' ? 'unidades' : i.unit === 'L' ? 'litros' : i.unit
    }))
  },
  set: (data: Ingredient[]) => {
    const currentStr = localStorage.getItem('shared_ingredients')
    const newStr = JSON.stringify(data)
    if (currentStr !== newStr) {
      localStorage.setItem('shared_ingredients', newStr)
      window.dispatchEvent(new Event('inventory_updated'))
    }
  },
  subscribe: (callback: () => void) => {
    window.addEventListener('inventory_updated', callback)
    window.addEventListener('storage', callback)
    return () => {
      window.removeEventListener('inventory_updated', callback)
      window.removeEventListener('storage', callback)
    }
  }
}

// ─── Componente Principal ────────────────────────────────────────────────────

export function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<'ingredientes' | 'recetas' | 'alertas' | 'movimientos'>('ingredientes')
  const [searchTerm, setSearchTerm] = useState('')

  // ─── Estados y Lógica para Ingredientes ───
  const [ingredients, setIngredients] = useState<Ingredient[]>(sharedIngredientsStore.get())

  useEffect(() => {
    sharedIngredientsStore.set(ingredients)
  }, [ingredients])

  useEffect(() => {
    return sharedIngredientsStore.subscribe(() => {
      setIngredients(sharedIngredientsStore.get())
    })
  }, [])

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false)
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
  const [ingredientForm, setIngredientForm] = useState<{name: string, unit: string, stock: number | string, minStock: number | string}>({ name: '', unit: 'unidades', stock: '', minStock: '' })
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null)
  const [ingredientError, setIngredientError] = useState('')

  const handleOpenCreateIngredient = () => {
    setEditingIngredientId(null)
    setIngredientForm({ name: '', unit: 'unidades', stock: '', minStock: '' })
    setIngredientError('')
    setIsIngredientModalOpen(true)
  }

  const handleOpenEditIngredient = (ing: Ingredient) => {
    setEditingIngredientId(ing.id)
    setIngredientForm({ name: ing.name, unit: ing.unit, stock: ing.stock, minStock: ing.minStock })
    setIngredientError('')
    setIsIngredientModalOpen(true)
  }

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    const stock = Number(ingredientForm.stock)
    const minStock = Number(ingredientForm.minStock)
    
    if (!ingredientForm.name.trim()) return setIngredientError('El nombre es obligatorio.')
    if (!ingredientForm.unit) return setIngredientError('La unidad es obligatoria.')
    if (isNaN(stock) || stock < 0) return setIngredientError('El stock actual debe ser mayor o igual a 0.')
    if (isNaN(minStock) || minStock < 0) return setIngredientError('El stock mínimo debe ser mayor o igual a 0.')

    setIngredientError('')

    if (editingIngredientId) {
      setIngredients(ingredients.map(i => i.id === editingIngredientId ? { id: editingIngredientId, name: ingredientForm.name, unit: ingredientForm.unit, stock, minStock } : i))
    } else {
      setIngredients([...ingredients, { id: Date.now().toString(), name: ingredientForm.name, unit: ingredientForm.unit, stock, minStock }])
    }
    setIsIngredientModalOpen(false)
  }

  const handleDeleteIngredient = () => {
    if (ingredientToDelete) {
      setIngredients(ingredients.filter(i => i.id !== ingredientToDelete))
      setIngredientToDelete(null)
    }
  }

  const lowStockIngredients = ingredients.filter((i) => i.stock <= i.minStock)

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ─── Estados y Lógica para Recetas ───
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [recipeForm, setRecipeForm] = useState<{ productId: string, ingredients: RecipeIngredient[] }>({ productId: '', ingredients: [] })
  const [tempIngId, setTempIngId] = useState('')
  const [tempIngQty, setTempIngQty] = useState('')

  const handleOpenCreateRecipe = (prodId?: string) => {
    setRecipeForm({ productId: prodId || '', ingredients: [] })
    setTempIngId('')
    setTempIngQty('')
    setIsRecipeModalOpen(true)
  }

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setRecipeForm({ productId: recipe.productId, ingredients: [...recipe.ingredients] })
    setTempIngId('')
    setTempIngQty('')
    setIsRecipeModalOpen(true)
  }

  const handleAddTempIngredient = () => {
    if (!tempIngId || !tempIngQty || isNaN(Number(tempIngQty)) || Number(tempIngQty) <= 0) return
    const ingredient = ingredients.find(i => i.id === tempIngId)
    if (!ingredient) return

    const existingIdx = recipeForm.ingredients.findIndex(i => i.ingredientId === tempIngId)
    const updated = [...recipeForm.ingredients]
    if (existingIdx >= 0) {
      updated[existingIdx].quantity += Number(tempIngQty)
    } else {
      updated.push({ ingredientId: tempIngId, quantity: Number(tempIngQty), unit: ingredient.unit })
    }
    setRecipeForm({ ...recipeForm, ingredients: updated })
    setTempIngId('')
    setTempIngQty('')
  }

  const handleRemoveTempIngredient = (ingId: string) => {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter(i => i.ingredientId !== ingId)
    })
  }

  const handleSaveRecipe = () => {
    if (!recipeForm.productId || recipeForm.ingredients.length === 0) return
    const existingIdx = recipes.findIndex(r => r.productId === recipeForm.productId)
    const newRecipes = [...recipes]
    if (existingIdx >= 0) {
      newRecipes[existingIdx] = { ...recipeForm }
    } else {
      newRecipes.push({ ...recipeForm })
    }
    setRecipes(newRecipes)
    setIsRecipeModalOpen(false)
  }

  const selectedProduct = MOCK_PRODUCTS.find(p => p.id === selectedProductId)
  const selectedRecipe = recipes.find(r => r.productId === selectedProductId)

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
            <p className="text-[#4B2E2D]/70 font-medium mt-2">
              Gestión de stock y recetas
            </p>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'ingredientes') handleOpenCreateIngredient()
              else if (activeTab === 'recetas') handleOpenCreateRecipe()
            }}
            className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]">
            <Plus size={20} strokeWidth={3} /> Nuevo Registro
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-white/60 rounded-xl p-1 shadow-inner border border-[#E0D0C5]/80 w-fit overflow-x-auto">
          {(
            [
              { key: 'ingredientes', label: 'Ingredientes', icon: <Package size={14} /> },
              { key: 'recetas', label: 'Recetas (Escandallos)', icon: <BookOpen size={14} /> },
              { key: 'alertas', label: 'Alertas de Stock', icon: <AlertTriangle size={14} /> },
              { key: 'movimientos', label: 'Movimientos', icon: <ArrowRightLeft size={14} /> }
            ] as const
          ).map((tab) => (
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
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                  {lowStockIngredients.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="p-10 pt-6">
        {/* ══════════════ TAB: INGREDIENTES ══════════════ */}
        {activeTab === 'ingredientes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 border border-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#4B2E2D]">
                Catálogo de Ingredientes
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B2E2D]/40" size={18} />
                <input
                  type="text"
                  placeholder="Buscar ingrediente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-[#FCE4D6]/30 border border-[#FCE4D6] rounded-xl text-sm font-medium text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]/50 w-full sm:w-64 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIngredients.map((item) => {
                const isLowStock = item.stock <= item.minStock
                return (
                  <div key={item.id} className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 hover:shadow-xl hover:border-[#D0543A]/30 transition-all flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <h3 className="text-xl font-black text-[#4B2E2D]">{item.name}</h3>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLowStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {isLowStock ? <AlertTriangle size={16} strokeWidth={2.5} /> : <Package size={16} strokeWidth={2.5} />}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm font-semibold text-gray-500">Unidad</span>
                        <span className="text-sm font-bold text-[#4B2E2D]">{item.unit}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm font-semibold text-gray-500">Stock actual</span>
                        <span className={`text-lg font-black ${isLowStock ? 'text-red-500' : 'text-[#4B2E2D]'}`}>{item.stock}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm font-semibold text-gray-500">Stock mínimo</span>
                        <span className="text-sm font-bold text-[#4B2E2D]">{item.minStock}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-semibold text-gray-500">Estado</span>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isLowStock ? 'Bajo Stock' : 'Disponible'}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 mt-auto">
                      <button onClick={() => handleOpenEditIngredient(item)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-colors">
                        <Edit2 size={16} /> Editar
                      </button>
                      <button onClick={() => setIngredientToDelete(item.id)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-colors border border-red-100">
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {filteredIngredients.length === 0 && (
              <div className="text-center py-10 text-[#4B2E2D]/50 font-bold bg-white rounded-2xl shadow-sm border border-[#FCE4D6]">
                No se encontraron ingredientes con ese nombre.
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: RECETAS ══════════════ */}
        {activeTab === 'recetas' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel Izquierdo: Lista de Productos */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 w-full lg:w-1/3 flex flex-col min-h-[500px] lg:max-h-[700px]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black text-[#4B2E2D]">Productos</h2>
                <button onClick={() => handleOpenCreateRecipe()} className="flex items-center gap-1 text-sm font-bold text-[#D0543A] hover:text-[#b5462f] bg-[#FCE4D6]/50 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={16} /> Nueva Receta
                </button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {MOCK_PRODUCTS.map(p => {
                  const hasRecipe = recipes.some(r => r.productId === p.id)
                  return (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)} 
                      className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-between group ${selectedProductId === p.id ? 'bg-[#FCE4D6] text-[#D0543A] shadow-sm ring-1 ring-[#D0543A]/20' : 'bg-gray-50 text-[#4B2E2D] hover:bg-[#FCE4D6]/40 hover:text-[#D0543A]'}`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      {hasRecipe ? (
                        <BookOpen size={16} className={selectedProductId === p.id ? 'text-[#D0543A]' : 'text-emerald-500 opacity-60 group-hover:opacity-100'} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Panel Derecho: Detalle de Receta */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#FCE4D6]/60 flex-1 min-h-[500px] flex flex-col">
              {!selectedProduct ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <ChefHat size={64} className="text-[#4B2E2D] mb-4 opacity-30" />
                  <h3 className="text-xl font-black text-[#4B2E2D]">Selecciona un producto</h3>
                  <p className="text-sm font-medium text-[#4B2E2D]/60 mt-2">Para ver o configurar su receta y escandallo.</p>
                </div>
              ) : !selectedRecipe ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <BookOpen size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-black text-[#4B2E2D] uppercase tracking-wide mb-2">{selectedProduct.name}</h3>
                  <p className="text-gray-500 font-medium mb-6">No existe receta configurada para este producto.</p>
                  <button onClick={() => handleOpenCreateRecipe(selectedProduct.id)} className="flex items-center justify-center gap-2 bg-[#D0543A] hover:bg-[#b5462f] text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-[#D0543A]/30 transition-all active:scale-95">
                    <Plus size={20} /> Crear Receta
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#FCE4D6]">
                    <div>
                      <p className="text-xs font-bold text-[#D0543A] uppercase tracking-widest mb-1">Receta configurada</p>
                      <h3 className="text-3xl font-black text-[#4B2E2D] uppercase">{selectedProduct.name}</h3>
                    </div>
                    <button onClick={() => handleOpenEditRecipe(selectedRecipe)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition-all text-sm">
                      <Edit2 size={16} /> Editar Receta
                    </button>
                  </div>

                  <h4 className="text-lg font-black text-[#4B2E2D] mb-4">Ingredientes:</h4>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {selectedRecipe.ingredients.map((ing, idx) => {
                      const ingredientData = ingredients.find(i => i.id === ing.ingredientId)
                      return (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <span className="font-bold text-[#4B2E2D] text-base">{ingredientData?.name || 'Ingrediente desconocido'}</span>
                          </div>
                          <div className="bg-white px-4 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                            <span className="font-black text-[#D0543A]">{ing.quantity}</span> <span className="font-bold text-gray-500 text-sm">{ing.unit}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#FCE4D6] flex justify-between items-center bg-[#FCE4D6]/20 p-5 rounded-2xl">
                    <span className="font-bold text-[#4B2E2D]/70 uppercase text-sm tracking-wider">Total Ingredientes</span>
                    <span className="font-black text-2xl text-[#4B2E2D]">{selectedRecipe.ingredients.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ALERTAS ══════════════ */}
        {activeTab === 'alertas' && (
          <div className="space-y-6">
            {lowStockIngredients.length === 0 ? (
              <div className="bg-emerald-50 rounded-2xl p-10 border border-emerald-200 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} />
                </div>
                <h3 className="text-xl font-black text-emerald-800">¡Todo en orden!</h3>
                <p className="text-emerald-600/80 font-medium mt-1">Ningún ingrediente se encuentra por debajo del stock mínimo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lowStockIngredients.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-[#4B2E2D] text-lg leading-none">{item.name}</h3>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-[#4B2E2D]/40 uppercase">Stock Actual</p>
                            <p className="text-xl font-black text-red-500">{item.stock} <span className="text-sm font-bold">{item.unit}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#4B2E2D]/40 uppercase">Mínimo ideal</p>
                            <p className="text-xl font-black text-[#4B2E2D]">{item.minStock} <span className="text-sm font-bold">{item.unit}</span></p>
                          </div>
                        </div>
                        <button className="w-full mt-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-sm transition-colors">
                          Registrar Entrada
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: MOVIMIENTOS ══════════════ */}
        {activeTab === 'movimientos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 border border-transparent flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#4B2E2D]">Historial de Movimientos</h2>
                <p className="text-sm font-medium text-[#4B2E2D]/60 mt-1">Registro de ingredientes descontados por plato preparado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_DISH_MOVEMENTS.map((mov) => (
                <div key={mov.id} className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 hover:shadow-xl hover:border-[#D0543A]/30 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF5F0] text-[#D0543A] flex items-center justify-center shrink-0">
                        <ChefHat size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-[#4B2E2D] leading-tight">{mov.dishName} <span className="font-bold opacity-70">preparado</span></h3>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">Descuento de inventario</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm font-black text-gray-600">{mov.time}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ingredientes Consumidos</p>
                    <div className="flex flex-col gap-2">
                      {mov.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-red-50 border border-red-100/60 px-4 py-2.5 rounded-xl">
                          <span className="font-bold text-[#4B2E2D] text-sm">{ing.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-red-500 text-sm">-{ing.quantity}</span>
                            <span className="font-bold text-gray-500 text-xs">{ing.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ MODAL CREAR/EDITAR RECETA ══════════════ */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[600px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsRecipeModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mb-6">
              {recipes.some(r => r.productId === recipeForm.productId) ? 'Editar Receta' : 'Nueva Receta'}
            </h2>

            <div className="overflow-y-auto flex-1 pr-2 space-y-5">
              {/* Seleccionar Producto */}
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">Producto</label>
                <select 
                  value={recipeForm.productId}
                  onChange={(e) => setRecipeForm({ ...recipeForm, productId: e.target.value })}
                  disabled={recipes.some(r => r.productId === recipeForm.productId)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] disabled:opacity-70 disabled:cursor-not-allowed appearance-none cursor-pointer"
                >
                  <option value="" disabled>Seleccione un producto</option>
                  {MOCK_PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Agregar Ingrediente */}
              <div className="bg-[#FCE4D6]/30 p-4 sm:p-5 rounded-2xl border border-[#FCE4D6]">
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-3">Agregar Ingrediente</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={tempIngId} 
                    onChange={(e) => setTempIngId(e.target.value)}
                    className="flex-[2] px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] cursor-pointer"
                  >
                    <option value="">Seleccione ingrediente...</option>
                    {ingredients.filter(i => !recipeForm.ingredients.some(ri => ri.ingredientId === i.id)).map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
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
                      {tempIngId ? ingredients.find(i => i.id === tempIngId)?.unit : '-'}
                    </span>
                  </div>
                  <button 
                    onClick={handleAddTempIngredient}
                    disabled={!tempIngId || !tempIngQty || isNaN(Number(tempIngQty)) || Number(tempIngQty) <= 0}
                    className="sm:flex-[1] px-4 py-2.5 bg-[#4B2E2D] hover:bg-[#3A2222] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Tabla Temporal */}
              <div>
                <h4 className="text-sm font-bold text-[#4B2E2D] mb-3">Ingredientes Configurados</h4>
                {recipeForm.ingredients.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-sm font-medium text-gray-400">Aún no se han agregado ingredientes.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeForm.ingredients.map(ing => {
                      const ingredientData = ingredients.find(i => i.id === ing.ingredientId)
                      return (
                        <div key={ing.ingredientId} className="flex justify-between items-center bg-white p-3 px-4 rounded-xl border border-gray-100 shadow-sm">
                          <span className="font-bold text-[#4B2E2D] text-sm">{ingredientData?.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#D0543A] text-sm">{ing.quantity} <span className="text-gray-500 font-bold">{ing.unit}</span></span>
                            <button 
                              onClick={() => handleRemoveTempIngredient(ing.ingredientId)}
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
                onClick={() => setIsRecipeModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={!recipeForm.productId || recipeForm.ingredients.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 text-white font-black rounded-xl shadow-lg transition-all bg-[#D0543A] hover:bg-[#b5462f] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Guardar Receta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL CREAR/EDITAR INGREDIENTE ══════════════ */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[500px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsIngredientModalOpen(false)}
              className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mb-6">
              {editingIngredientId ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
            </h2>
            
            <form onSubmit={handleSaveIngredient} className="space-y-5">
              {ingredientError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                  {ingredientError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">Nombre</label>
                <input 
                  type="text" 
                  required 
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({...ingredientForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                  placeholder="Ej: Tomate"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">Unidad</label>
                <select 
                  required 
                  value={ingredientForm.unit}
                  onChange={(e) => setIngredientForm({...ingredientForm, unit: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] appearance-none cursor-pointer"
                >
                  <option value="unidades">unidades</option>
                  <option value="kg">kg</option>
                  <option value="litros">litros</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">Stock actual</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={ingredientForm.stock === 0 && ingredientForm.stock.toString() === '0' ? '' : ingredientForm.stock}
                    onChange={(e) => setIngredientForm({...ingredientForm, stock: e.target.value ? Number(e.target.value) : ''})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">Stock mínimo</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={ingredientForm.minStock === 0 && ingredientForm.minStock.toString() === '0' ? '' : ingredientForm.minStock}
                    onChange={(e) => setIngredientForm({...ingredientForm, minStock: e.target.value ? Number(e.target.value) : ''})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                  />
                </div>
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 text-white font-black rounded-xl shadow-lg transition-all bg-[#D0543A] hover:bg-[#b5462f]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL ELIMINAR INGREDIENTE ══════════════ */}
      {ingredientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-4 border-[#D0543A] rounded-3xl p-8 relative shadow-2xl flex flex-col items-center text-center">
            <AlertTriangle size={32} className="text-[#D0543A] mb-4" />
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar ingrediente?</h2>
            <p className="text-sm font-medium text-[#4B2E2D]/70 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setIngredientToDelete(null)}
                className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl transition-all hover:bg-[#4B2E2D]/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteIngredient}
                className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl transition-all border-2 border-[#D0543A] hover:bg-[#b5462f]"
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