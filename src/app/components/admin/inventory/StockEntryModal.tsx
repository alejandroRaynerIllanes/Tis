import React, { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  inventarioService,
  type Ingrediente,
  type EntradaStockPayload
} from '../../../services/inventario.service'

interface StockEntryModalProps {
  isOpen: boolean
  ingredients: Ingrediente[]
  preselectedId?: string
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function StockEntryModal({
  isOpen,
  ingredients,
  preselectedId,
  onClose,
  onSuccess
}: StockEntryModalProps) {
  const [ingredienteId, setIngredienteId] = useState(preselectedId ?? '')
  const [cantidad, setCantidad] = useState<number | ''>('')
  const [costo, setCosto] = useState<number | ''>('')
  const [error, setError] = useState('')

  // Reset when opening with a new preselection
  React.useEffect(() => {
    if (isOpen) {
      setIngredienteId(preselectedId ?? '')
      setCantidad('')
      setCosto('')
      setError('')
    }
  }, [isOpen, preselectedId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedCantidad = Number(cantidad)
    const parsedCosto = costo !== '' ? Number(costo) : undefined

    if (!ingredienteId) return setError('Selecciona un ingrediente.')
    if (isNaN(parsedCantidad) || parsedCantidad <= 0)
      return setError('La cantidad debe ser mayor a 0.')

    setError('')

    const payload: EntradaStockPayload = {
      ingredienteId,
      cantidad: parsedCantidad,
      ...(parsedCosto !== undefined && { costo: parsedCosto })
    }

    try {
      await inventarioService.registrarEntrada(payload)
      toast.success('Entrada de stock registrada correctamente.')
      onClose()
      await onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar entrada.'
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[500px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mb-6">
          Registrar Entrada de Stock
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          {/* Ingrediente */}
          <div>
            <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
              Ingrediente
            </label>
            <select
              required
              value={ingredienteId}
              onChange={(e) => setIngredienteId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Seleccione un ingrediente
              </option>
              {ingredients.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.nombre} ({i.unidad})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
              Cantidad a ingresar
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
              placeholder="Ej: 50"
            />
          </div>

          {/* Costo */}
          <div>
            <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
              Costo unitario{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
              placeholder="Ej: 12.50"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 text-white font-black rounded-xl shadow-lg transition-all bg-[#D0543A] hover:bg-[#b5462f]"
            >
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
