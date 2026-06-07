import { AlertTriangle, Package } from 'lucide-react'
import type { Ingrediente } from '../../../services/inventario.service'

interface StockAlertsTabProps {
  lowStockIngredients: Ingrediente[]
  onRegisterEntry: (ingrediente: Ingrediente) => void
}

export function StockAlertsTab({ lowStockIngredients, onRegisterEntry }: StockAlertsTabProps) {
  if (lowStockIngredients.length === 0) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-10 border border-emerald-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} />
        </div>
        <h3 className="text-xl font-black text-emerald-800">¡Todo en orden!</h3>
        <p className="text-emerald-600/80 font-medium mt-1">
          Ningún ingrediente se encuentra por debajo del stock mínimo.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lowStockIngredients.map((item) => (
        <div
          key={item._id}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-red-500" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-[#4B2E2D] text-lg leading-none">{item.nombre}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#4B2E2D]/40 uppercase">Stock Actual</p>
                  <p className="text-xl font-black text-red-500">
                    {item.stockActual} <span className="text-sm font-bold">{item.unidad}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#4B2E2D]/40 uppercase">Mínimo ideal</p>
                  <p className="text-xl font-black text-[#4B2E2D]">
                    {item.stockMinimo} <span className="text-sm font-bold">{item.unidad}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRegisterEntry(item)}
                className="w-full mt-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-sm transition-colors"
              >
                Registrar Entrada
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
