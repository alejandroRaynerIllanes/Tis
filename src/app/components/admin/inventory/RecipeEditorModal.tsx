import React, { useState, useEffect, useRef, useMemo } from 'react'
import { X, Plus, Trash2, ChevronDown, Search } from 'lucide-react'
import { toast } from 'sonner'
import { inventarioService, type Ingrediente } from '../../../services/inventario.service'

interface RecipeEditorModalProps {
  isOpen: boolean
  onClose: () => void
  dish: { id: string; name: string } | null
  recipe: any | null
  ingredients: Ingrediente[]
  onSuccess: () => Promise<void>
}

interface RecipeRow {
  ingrediente: string
  cantidadNecesaria: number | ''
}

interface SearchableSelectProps {
  value: string
  onChange: (val: string) => void
  options: Ingrediente[]
  disabled?: boolean
}

function SearchableSelect({ value, onChange, options, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o._id === value)

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    const lowerTerm = searchTerm.toLowerCase()
    return options.filter((o) => o.nombre.toLowerCase().includes(lowerTerm))
  }, [searchTerm, options])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          if (!isOpen) setSearchTerm('')
          setIsOpen(!isOpen)
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#D0543A] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${selectedOption ? 'text-[#4B2E2D]' : 'text-gray-500'}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.nombre : 'Seleccione ingrediente...'}</span>
        <ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 relative bg-gray-50">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" autoFocus placeholder="Buscar ingrediente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D0543A] text-[#4B2E2D] font-medium" />
          </div>
          <ul className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm font-medium text-gray-400">No se encontraron ingredientes</li>
            ) : (
              filteredOptions.map((opt) => (<li key={opt._id}><button type="button" onClick={() => { onChange(opt._id); setIsOpen(false); }} className={`w-full text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${value === opt._id ? 'bg-[#FCE4D6] text-[#D0543A]' : 'text-[#4B2E2D] hover:bg-gray-50'}`}>{opt.nombre}</button></li>))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function RecipeEditorModal({ isOpen, onClose, dish, recipe, ingredients, onSuccess }: RecipeEditorModalProps) {
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && dish) {
      if (recipe && recipe.ingredientes && recipe.ingredientes.length > 0) {
        setRows(
          recipe.ingredientes.map((ing: any) => ({
            ingrediente: ing.ingrediente?._id || ing.ingrediente || '',
            cantidadNecesaria: ing.cantidadNecesaria || ''
          }))
        )
      } else {
        setRows([])
      }
    }
  }, [isOpen, dish, recipe])

  if (!isOpen || !dish) return null

  const handleAddRow = () => {
    setRows([...rows, { ingrediente: '', cantidadNecesaria: '' }])
  }

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: keyof RecipeRow, value: string | number) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rows.length === 0) {
      return toast.error('Debe agregar al menos un ingrediente a la receta.')
    }

    const hasEmpty = rows.some(r => !r.ingrediente || r.cantidadNecesaria === '' || Number(r.cantidadNecesaria) <= 0)
    if (hasEmpty) {
      return toast.error('Todos los ingredientes deben tener un valor y cantidad mayor a 0.')
    }

    const ids = rows.map(r => r.ingrediente)
    if (new Set(ids).size !== ids.length) {
      return toast.error('No pueden haber ingredientes duplicados en la receta.')
    }

    setIsLoading(true)
    try {
      const payload = {
        plato: dish.id,
        ingredientes: rows.map(r => ({
          ingrediente: r.ingrediente,
          cantidadNecesaria: Number(r.cantidadNecesaria)
        }))
      }

      await inventarioService.guardarReceta(payload)
      toast.success('Receta guardada exitosamente.')
      await onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error?.response?.data?.mensaje || 'Error al guardar la receta.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[600px] border-[6px] border-[#4B2E2D] rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] p-2 bg-gray-100 hover:bg-[#FCE4D6] rounded-full transition-all disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <p className="text-xs font-bold text-[#D0543A] uppercase tracking-widest mb-1">
            {recipe ? 'Editar Receta' : 'Crear Receta'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-[#4B2E2D]">
            {dish.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px]">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="font-medium text-sm">No hay ingredientes en esta receta.</p>
              </div>
            ) : (
              rows.map((row, idx) => {
                const selectedIng = ingredients.find(i => i._id === row.ingrediente)
                const unidad = selectedIng ? (selectedIng.unidadMedida || selectedIng.unidad) : '-'

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex-1">
                      <SearchableSelect
                        value={row.ingrediente}
                        onChange={(val) => handleRowChange(idx, 'ingrediente', val)}
                        options={ingredients}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="w-24 shrink-0 relative">
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="Cant."
                        value={row.cantidadNecesaria}
                        onChange={(e) => handleRowChange(idx, 'cantidadNecesaria', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-bold text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="w-16 text-center text-sm font-bold text-gray-500 shrink-0 bg-gray-100 py-2.5 rounded-lg border border-transparent">
                      {unidad}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={isLoading}
                      className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={3} /> Agregar Ingrediente
            </button>
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
              {isLoading ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}