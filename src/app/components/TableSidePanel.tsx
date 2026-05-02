import React, { useState, useEffect } from 'react'
import {
  X,
  Crown,
  Zap,
  Receipt,
  Search,
  Plus,
  ShoppingBag,
  ChevronLeft,
  MessageSquare,
  CheckCircle2,
  Printer,
  Trash2,
  Edit2,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'

interface TableSidePanelProps {
  isOpen: boolean
  tableId: string | null
  onClose: () => void
  onOpenPayment: () => void
}

export function TableSidePanel({
  isOpen,
  tableId,
  onClose,
  onOpenPayment
}: TableSidePanelProps) {
  const {
    products,
    tables,
    orders,
    reservations,
    addOrderItem,
    removeOrderItem,
    clearOrder,
    updateOrderItemNote,
    confirmOrder,
    requestBill
  } = useAppContext()

  const [viewingMenu, setViewingMenu] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [editingNote, setEditingNote] = useState<{ productId: string; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resetear estados locales cada vez que se abre una mesa nueva
  useEffect(() => {
    if (isOpen) {
      setViewingMenu(false)
      setShowSummary(false)
      setEditingNote(null)
      setSearchQuery('')
    }
  }, [isOpen, tableId])

  if (!isOpen || !tableId) return null

  const activeTable = tables.find((t) => t.id === tableId)
  if (!activeTable) return null

  const activeOrder = orders[tableId] || []
  const orderTotal = activeOrder.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Lógica VIP
  const activeTableResArr = reservations[tableId] || []
  const hasVipReservation = activeTableResArr.some((r) => r.vip)
  const isVipOrder = activeTable.type === 'vip' || hasVipReservation
  const vipClientNameGlobal = hasVipReservation
    ? activeTableResArr.find((r) => r.vip)?.clientName
    : undefined

  // Filtrar platillos
  const filteredDishes = products.filter(
    (d) =>
      d.image &&
      d.image.trim() !== '' &&
      (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handlers
  const handleConfirmOrder = async () => {
    setIsSubmitting(true)
    try {
      await confirmOrder(tableId)
      setViewingMenu(false)
      setShowSummary(false)
      toast.success(
        isVipOrder ? '⚡ Pedido VIP enviado con prioridad' : '¡Pedido enviado a cocina!',
        {
          description: isVipOrder
            ? `${activeTable?.name} — ${activeOrder.length} plato(s) · Prioridad máxima en cocina.`
            : `${activeTable?.name} — ${activeOrder.length} plato(s) en preparación.`,
          duration: 3500
        }
      )
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el pedido a la cocina.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearOrder = () => {
    clearOrder(tableId)
    setViewingMenu(false)
    setShowSummary(false)
    onClose()
    toast.success('Pedido cancelado', {
      description: 'La mesa ha vuelto a estar disponible.',
      duration: 3000
    })
  }

  const handlePrintOrder = () => {
    toast.success('Orden enviada a impresora', {
      description: 'El pedido se ha enviado a la impresora de cocina.',
      duration: 3000
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:px-8">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div className="relative z-10 w-[95vw] sm:w-full max-w-[440px] lg:max-w-[480px] bg-white shadow-2xl rounded-3xl flex flex-col transform transition-all duration-300 ease-out overflow-hidden max-h-[95vh] sm:max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header del panel */}
        <div
          className={`pt-6 pb-4 px-5 border-b shrink-0 ${
            isVipOrder
              ? 'bg-gradient-to-b from-[#2C1A0E] to-[#3D2318] border-amber-800/40'
              : activeTable.status === 'Esperando pago'
                ? 'bg-[#FFF9F0] border-[#E6A23C]/30'
                : 'bg-[#FFF5F0] border-[#FCE4D6]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-2xl ${isVipOrder ? 'text-white' : 'text-[#4B2E2D]'}`}>
                  {activeTable.name}
                </h3>
                {isVipOrder && <Crown size={18} className="text-yellow-300 drop-shadow" strokeWidth={2.5} />}
              </div>
              <p className={`text-sm font-bold mt-1 ${isVipOrder ? 'text-white/65' : activeTable.status === 'Disponible' ? 'text-[#2C2C2C]/80' : activeTable.status === 'Ocupada' ? 'text-[#D96C4A]' : activeTable.status === 'Esperando pago' ? 'text-[#E6A23C]' : 'text-[#6B3E2E]'}`}>
                {activeTable.status}
              </p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isVipOrder ? 'text-white/50 hover:bg-white/10' : 'text-[#4B2E2D]/50 hover:bg-black/5'}`}>
              <X size={24} />
            </button>
          </div>

          {isVipOrder && (
            <div className="flex items-center gap-2.5 bg-amber-400/15 border border-amber-400/30 rounded-xl px-3.5 py-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-yellow-400/25 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-yellow-300" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-yellow-200 font-black text-[11px] uppercase tracking-wider">
                  Pedido con Prioridad VIP
                </p>
                <p className="text-white/55 text-[10px] font-medium leading-snug mt-0.5">
                  {vipClientNameGlobal ? `Cliente: ${vipClientNameGlobal} · ` : ''}Este pedido encabeza la cola de cocina
                </p>
              </div>
            </div>
          )}

          {activeTable.status !== 'Esperando pago' && (
            <div className={`flex p-1 rounded-xl shadow-inner border ${isVipOrder ? 'bg-white/10 border-white/15' : 'bg-white/60 border-[#FCE4D6]'}`}>
              <button onClick={() => setViewingMenu(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!viewingMenu ? isVipOrder ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-[#4B2E2D] shadow-sm' : isVipOrder ? 'text-white/50 hover:bg-white/10' : 'text-[#4B2E2D]/60 hover:bg-white/40'}`}>
                Pedido Actual
              </button>
              <button onClick={() => setViewingMenu(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewingMenu ? isVipOrder ? 'bg-amber-500/80 text-white shadow-sm' : 'bg-[#4B2E2D] text-white shadow-sm' : isVipOrder ? 'text-white/50 hover:bg-white/10' : 'text-[#4B2E2D]/60 hover:bg-white/40'}`}>
                Menú
              </button>
            </div>
          )}
        </div>

        {/* Contenido del Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* VISTA: ESPERANDO PAGO (PRE-CUENTA) */}
          {activeTable.status === 'Esperando pago' && (
            <div className="p-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-6 pb-6 border-b border-dashed border-gray-300">
                  <Receipt size={32} className="mx-auto text-[#E6A23C] mb-2" />
                  <h4 className="font-black text-xl text-[#4B2E2D]">Pre-cuenta</h4>
                  <p className="text-gray-500 text-sm font-medium mt-1">{activeTable.name}</p>
                </div>
                <div className="space-y-4 mb-6">
                  {activeOrder.map((item) => (
                    <div key={item.product.id} className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-gray-400 w-6">{item.quantity}x</span>
                          <span className="font-bold text-[#4B2E2D]">{item.product.name}</span>
                        </div>
                        <span className="font-bold text-[#4B2E2D] shrink-0">Bs. {(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.note && (
                        <div className="text-xs text-gray-500 italic ml-8 flex items-center gap-1">
                          <MessageSquare size={10} /> Nota: {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
                  <span className="font-black text-lg text-[#4B2E2D]">Total</span>
                  <span className="font-black text-2xl text-[#D0543A]">Bs. {orderTotal.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={onOpenPayment} className="w-full mt-6 py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black text-lg shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2">
                <CreditCard size={20} /> Procesar Pago
              </button>
            </div>
          )}

          {/* VISTA: CARTA DIGITAL (AGREGAR) */}
          {activeTable.status !== 'Esperando pago' && viewingMenu && (
            <div className="p-4 space-y-4 pb-8">
              <div className="relative group mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B2E2D]/40 group-focus-within:text-[#E57C5D] transition-colors" size={18} strokeWidth={2.5} />
                <input type="text" placeholder="Buscar platillo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-[#FCE4D6] rounded-xl text-base sm:text-sm font-semibold text-[#4B2E2D] placeholder:text-[#4B2E2D]/40 focus:outline-none focus:border-[#E57C5D] transition-all shadow-sm" />
              </div>
              <div className="space-y-3">
                {filteredDishes.map((dish) => {
                  const isActive = dish.status === 'Disponible'
                  return (
                    <div key={dish.id} className={`flex items-center gap-4 bg-white p-3 rounded-[16px] transition-all duration-300 border border-gray-100 ${!isActive ? 'opacity-60 bg-gray-50' : 'hover:border-[#D0543A]/30 hover:shadow-md'}`}>
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gray-100">
                        <img src={dish.image} alt={dish.name} className={`w-full h-full object-cover ${!isActive ? 'grayscale' : ''}`} />
                        {!isActive && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">AGOTADO</span></div>}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center text-left py-0.5">
                        <h3 className={`text-[14px] font-black leading-tight truncate w-full ${!isActive ? 'text-gray-400 line-through' : 'text-[#4B2E2D]'}`}>{dish.name}</h3>
                        <span className="text-[11px] text-gray-400 truncate w-full" title={dish.description || 'Sin descripción'}>{dish.description || 'Sin descripción'}</span>
                        <span className={`text-sm font-black mt-1 ${isActive ? 'text-[#D0543A]' : 'text-gray-400'}`}>Bs. {dish.price.toFixed(2)}</span>
                      </div>
                      {isActive && (
                        <button onClick={() => addOrderItem(activeTable.id, dish)} className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#D0543A] hover:bg-[#D0543A] hover:text-white flex items-center justify-center transition-colors shadow-sm">
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VISTA: PEDIDO ACTUAL */}
          {activeTable.status !== 'Esperando pago' && !viewingMenu && (
            <div className="p-4 flex flex-col h-full">
              {activeOrder.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <ShoppingBag size={48} className="text-[#4B2E2D] mb-4 opacity-50" />
                  <p className="font-black text-lg text-[#4B2E2D]">Sin pedidos</p>
                  <p className="text-sm font-medium mt-1">La mesa está vacía. Añade platillos desde la carta.</p>
                  <button onClick={() => setViewingMenu(true)} className="mt-6 px-6 py-2 bg-[#4B2E2D] text-white rounded-xl font-bold text-sm shadow-md">Ver Carta</button>
                </div>
              ) : showSummary ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4 text-[#4B2E2D]">
                    <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <h4 className="font-black text-lg">Resumen del Pedido</h4>
                  </div>
                  <div className="space-y-3 pb-24 overflow-y-auto">
                    {activeOrder.map((item) => (
                      <div key={item.product.id} className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-gray-400 w-6">{item.quantity}x</span>
                            <span className="font-bold text-[#4B2E2D]">{item.product.name}</span>
                          </div>
                          <span className="font-black text-[#4B2E2D] shrink-0">Bs. {(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.note && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex items-start gap-2 border border-gray-100">
                            <MessageSquare size={14} className="mt-0.5 text-gray-400 shrink-0" />
                            <span className="italic leading-tight">{item.note}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-24 overflow-y-auto">
                  {activeOrder.map((item) => {
                    const isEditingNote = editingNote?.productId === item.product.id
                    return (
                      <div key={item.product.id} className="flex flex-col gap-2 bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#FFF5F0] text-[#D0543A] font-black flex items-center justify-center shrink-0">{item.quantity}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#4B2E2D] truncate text-[15px]">{item.product.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-bold text-gray-400">Bs. {item.product.price.toFixed(2)} c/u</span></div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="font-black text-[#4B2E2D]">Bs. {(item.product.price * item.quantity).toFixed(2)}</span>
                            <button onClick={() => removeOrderItem(activeTable.id, item.product.id)} className="text-red-400 hover:text-red-600 p-1 font-bold text-xs flex items-center gap-1"><X size={14} /> Cancelar 1</button>
                          </div>
                        </div>
                        {isEditingNote ? (
                          <div className="flex gap-2 mt-1">
                            <input type="text" value={editingNote.text} onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })} placeholder="Ej: Sin tomate..." className="flex-1 text-base sm:text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D0543A]" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { updateOrderItemNote(activeTable.id, item.product.id, editingNote.text); setEditingNote(null) } }} />
                            <button onClick={() => { updateOrderItemNote(activeTable.id, item.product.id, editingNote.text); setEditingNote(null) }} className="px-3 py-1.5 bg-[#4B2E2D] text-white text-xs font-bold rounded-lg">OK</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingNote({ productId: item.product.id, text: item.note || '' })} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#D0543A] self-start mt-1">
                            {item.note ? <><MessageSquare size={12} /> <span className="italic max-w-[200px] truncate">{item.note}</span> <Edit2 size={10} className="ml-1" /></> : <><Plus size={12} /> Agregar observación</>}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER (Acciones) */}
        {activeTable.status !== 'Esperando pago' && activeOrder.length > 0 && (
          <div className="p-5 sm:p-6 bg-white border-t border-[#FCE4D6]/60 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] shrink-0 flex flex-col gap-3">
            {isVipOrder && (
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#2C1A0E] to-[#4B2E2D] rounded-xl px-3.5 py-2.5 -mt-1">
                <Crown size={14} className="text-yellow-300 shrink-0" strokeWidth={2.5} />
                <p className="text-yellow-200 font-black text-[11px] uppercase tracking-wider flex-1">Prioridad VIP — Cocina primero</p>
                <Zap size={13} className="text-amber-400 shrink-0" strokeWidth={2.5} />
              </div>
            )}
            <div className="flex justify-between items-center mb-1">
              <span className="font-black text-gray-500">Total a Pagar</span>
              <span className="font-black text-2xl sm:text-3xl text-[#4B2E2D]">Bs. {orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {viewingMenu ? (
                <button onClick={() => setViewingMenu(false)} className="w-full py-4 rounded-2xl bg-[#F5E6D3] border-2 border-[#6B3E2E] text-[#2C2C2C] font-black shadow-sm transition-all text-[15px] flex items-center justify-center gap-2 hover:bg-[#E8D4BE]"><ShoppingBag size={20} /> Ver Pedido Actual</button>
              ) : showSummary ? (
                <button 
                  onClick={handleConfirmOrder} 
                  disabled={isSubmitting} 
                  className={`w-full py-4 rounded-2xl text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D96C4A] hover:bg-[#C25838]'}`}
                >
                  {isSubmitting ? 'Enviando a cocina...' : <><CheckCircle2 size={20} /> Confirmar y Enviar a Cocina</>}
                </button>
              ) : (activeTable.status === 'Disponible' || activeTable.status === 'Reservada') ? (
                <button onClick={() => setShowSummary(true)} className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Ver Resumen de Orden</button>
              ) : (
                <button onClick={() => setViewingMenu(true)} className="w-full py-4 rounded-2xl bg-[#F5E6D3] border-2 border-[#6B3E2E] text-[#2C2C2C] font-black shadow-sm transition-all text-[15px] flex items-center justify-center gap-2 hover:bg-[#E8D4BE]"><Plus size={20} /> Añadir Más Platos</button>
              )}

              {!viewingMenu && !showSummary && activeTable.status === 'Ocupada' && (
                <>
                  <button onClick={handlePrintOrder} className="w-full py-3 rounded-2xl bg-white border-2 border-[#6B3E2E] text-[#4B2E2D] hover:bg-[#F5E6D3] font-bold transition-all text-[14px] flex items-center justify-center gap-2"><Printer size={18} /> Imprimir Pedido</button>
                  <button onClick={() => requestBill(tableId)} className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2"><Receipt size={20} /> Pedir Cuenta</button>
                  <button onClick={handleClearOrder} className="w-full py-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:text-[#B91C1C] font-bold transition-all text-[15px] flex items-center justify-center gap-2 mt-1"><Trash2 size={18} /> Cancelar Pedido Completo</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}