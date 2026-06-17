import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'
import type { ChatMessage } from '../../types'

interface DeliveryChatProps {
  pedidoId: string
  messages: ChatMessage[]
  onSendMessage: (text: string) => void
  onClose: () => void
}

export function DeliveryChat({ pedidoId, messages, onSendMessage, onClose }: DeliveryChatProps) {
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!draft.trim()) return
    onSendMessage(draft)
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg mx-auto rounded-3xl h-[70vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D96C4A] to-[#C25838] p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <MessageSquare size={22} />
            <span className="font-black text-lg">Chat con Cliente</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#F8F9FA] flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 my-auto flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare size={20} className="text-gray-400" />
              </div>
              <p className="font-bold">No hay mensajes aún</p>
              <p className="text-xs mt-1">Escribe para avisar al cliente que estás en camino.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === 'Repartidor' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl shadow-sm text-sm ${
                    msg.sender === 'Repartidor'
                      ? 'bg-[#D96C4A] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-[#4B2E2D] font-medium rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] font-bold text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20 rounded-full px-5 py-3 text-sm outline-none transition-all font-medium text-[#4B2E2D]"
            placeholder="Escribe un mensaje..."
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="w-12 h-12 bg-[#D96C4A] hover:bg-[#b5462f] text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors shadow-md shadow-[#D96C4A]/30"
          >
            <Send size={18} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
