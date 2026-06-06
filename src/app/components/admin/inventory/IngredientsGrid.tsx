import { AlertTriangle, ArrowUpRight, Package, Search, Trash2 } from 'lucide-react'
import type { Ingrediente } from '../../../services/inventario.service'

interface IngredientsGridProps {
  ingredients: Ingrediente[]
  isLoading: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  onRegisterEntry: (ingrediente?: Ingrediente) => void
  onDeleteRequest: (id: string) => void
}

export function IngredientsGrid({
  ingredients,
  isLoading,
  searchTerm,
  onSearchChange,
  onRegisterEntry,
  onDeleteRequest
}: IngredientsGridProps) {
  const filtered = ingredients.filter((i) =>
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 border border-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#4B2E2D]">Catálogo de Ingredientes</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B2E2D]/40"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-[#FCE4D6]/30 border border-[#FCE4D6] rounded-xl text-sm font-medium text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]/50 w-full sm:w-64 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-[#4B2E2D]/50 font-bold">
            Cargando inventario...
          </div>
        ) : (
          filtered.map((item) => {
            const isLowStock = item.estado === 'Bajo' || item.estado === 'Agotado'
            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 hover:shadow-xl hover:border-[#D0543A]/30 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-xl font-black text-[#4B2E2D]">{item.nombre}</h3>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isLowStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {isLowStock ? (
                      <AlertTriangle size={16} strokeWidth={2.5} />
                    ) : (
                      <Package size={16} strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm font-semibold text-gray-500">Unidad</span>
                    <span className="text-sm font-bold text-[#4B2E2D]">{item.unidad}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm font-semibold text-gray-500">Stock actual</span>
                    <span className={`text-lg font-black ${isLowStock ? 'text-red-500' : 'text-[#4B2E2D]'}`}>
                      {item.stockActual}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm font-semibold text-gray-500">Stock mínimo</span>
                    <span className="text-sm font-bold text-[#4B2E2D]">{item.stockMinimo}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-gray-500">Estado</span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        item.estado === 'Agotado'
                          ? 'bg-gray-100 text-gray-600'
                          : isLowStock
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => onRegisterEntry(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FCE4D6] hover:bg-[#F5C9B0] text-[#D0543A] font-bold text-sm transition-colors"
                  >
                    <ArrowUpRight size={16} /> Registrar Entrada
                  </button>
                  <button
                    onClick={() => onDeleteRequest(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-colors border border-red-100"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-10 text-[#4B2E2D]/50 font-bold bg-white rounded-2xl shadow-sm border border-[#FCE4D6]">
          No se encontraron ingredientes con ese nombre.
        </div>
      )}
    </div>
  )
}
