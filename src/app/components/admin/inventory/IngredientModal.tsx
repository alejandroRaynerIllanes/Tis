import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { inventarioService, type Ingrediente } from '../../../services/inventario.service'

interface IngredientModalProps {
  isOpen: boolean
  ingredientToEdit?: Ingrediente | null
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function IngredientModal({ isOpen, ingredientToEdit, onClose, onSuccess }: IngredientModalProps) {
  const [formData, setFormData] = useState<{
    nombre: string
    stockActual: number | ''
    stockMinimo: number | ''
    unidad: string
  }>({
    nombre: '',
    stockActual: 0,
    stockMinimo: 0,
    unidad: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (ingredientToEdit) {
        setFormData({
          nombre: ingredientToEdit.nombre,
          stockActual: ingredientToEdit.stockActual,
          stockMinimo: ingredientToEdit.stockMinimo,
          unidad: ingredientToEdit.unidadMedida || ingredientToEdit.unidad
        })
      } else {
        setFormData({
          nombre: '',
          stockActual: 0,
          stockMinimo: 0,
          unidad: 'kg'
        })
      }
    }
  }, [isOpen, ingredientToEdit])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) return toast.error('El nombre es requerido.')
    if (!formData.unidad.trim()) return toast.error('La unidad es requerida.')
    if (formData.stockActual === '' || formData.stockActual < 0) return toast.error('El stock actual no puede ser negativo.')
    if (formData.stockMinimo === '' || formData.stockMinimo < 0) return toast.error('El stock mínimo no puede ser negativo.')

    setIsLoading(true)
    try {
      const payload = {
        nombre: formData.nombre,
        stockActual: Number(formData.stockActual),
        stockMinimo: Number(formData.stockMinimo),
        unidadMedida: formData.unidad,
        unidad: formData.unidad
      }

      if (ingredientToEdit) {
        await inventarioService.actualizarIngrediente(ingredientToEdit._id, payload)
        toast.success('Ingrediente actualizado correctamente.')
      } else {
        await inventarioService.crearIngrediente(payload)
        toast.success('Ingrediente creado correctamente.')
      }
      
      await onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error?.response?.data?.mensaje || 'Error al guardar el ingrediente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[500px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mb-6">
          {ingredientToEdit ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
              Nombre del Ingrediente
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
              placeholder="Ej: Papa"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
                Stock Actual
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.stockActual}
                onChange={(e) => setFormData({ ...formData, stockActual: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
                Stock Mínimo ideal
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B2E2D] uppercase tracking-wider mb-2">
              Unidad de Medida
            </label>
            <select
              required
              value={formData.unidad}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="" disabled>Seleccione unidad</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="gr">Gramos (gr)</option>
              <option value="litros">Litros (l)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unidades">Unidades</option>
              <option value="paquetes">Paquetes</option>
              <option value="latas">Latas</option>
              <option value="botellas">Botellas</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 text-white font-black rounded-xl shadow-lg transition-all bg-[#D0543A] hover:bg-[#b5462f] disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar Ingrediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}