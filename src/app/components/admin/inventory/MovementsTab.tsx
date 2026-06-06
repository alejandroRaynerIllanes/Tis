import { ChefHat, Clock } from 'lucide-react'

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

export function MovementsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-6 border border-transparent flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B2E2D]">Historial de Movimientos</h2>
          <p className="text-sm font-medium text-[#4B2E2D]/60 mt-1">
            Registro de ingredientes descontados por plato preparado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_DISH_MOVEMENTS.map((mov) => (
          <div
            key={mov.id}
            className="bg-white rounded-3xl p-6 shadow-md border border-[#FCE4D6]/60 hover:shadow-xl hover:border-[#D0543A]/30 transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FFF5F0] text-[#D0543A] flex items-center justify-center shrink-0">
                  <ChefHat size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#4B2E2D] leading-tight">
                    {mov.dishName} <span className="font-bold opacity-70">preparado</span>
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">Descuento de inventario</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm font-black text-gray-600">{mov.time}</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Ingredientes Consumidos
              </p>
              <div className="flex flex-col gap-2">
                {mov.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-red-50 border border-red-100/60 px-4 py-2.5 rounded-xl"
                  >
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
  )
}
