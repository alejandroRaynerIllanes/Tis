import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  ingredientId: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({ ingredientId, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!ingredientId) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FCE4D6] w-full max-w-[400px] border-4 border-[#D0543A] rounded-3xl p-8 relative shadow-2xl flex flex-col items-center text-center">
        <AlertTriangle size={32} className="text-[#D0543A] mb-4" />
        <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar ingrediente?</h2>
        <p className="text-sm font-medium text-[#4B2E2D]/70 mb-6">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl transition-all hover:bg-[#4B2E2D]/5"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl transition-all border-2 border-[#D0543A] hover:bg-[#b5462f]"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
