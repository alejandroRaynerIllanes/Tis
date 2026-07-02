//src/app/components/client/ClientProfile.tsx
import React, { useState, useEffect, useRef } from 'react'
import { User, MapPin, Package, Shield, ArrowLeft, LogOut, Plus, Trash2, Edit2, Loader2, Save, MessageSquare, X, Send } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getStoredUser, api, setStoredUser, getToken } from '../../services/api'
import { toast } from 'sonner'
import { User as UserType, Address, Order, OrderDetail, ChatMessage } from '../../types'
import { usersService } from '../../services/users.service'
import { useAppContext } from '../../context/AppContext'
import { DeliveryMap } from '../delivery/DeliveryMap'

export function ClientProfile() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const { socket } = useAppContext()

  const [activeTab, setActiveTab] = useState<'perfil' | 'direcciones' | 'historial' | 'seguridad'>('perfil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [originalProfileData, setOriginalProfileData] = useState({ nombre: '', apellidos: '', email: '', telefono: '' })

  // Data
  const [profileData, setProfileData] = useState({ nombre: '', apellidos: '', email: '', telefono: '' })
  const [addresses, setAddresses] = useState<Address[]>([])
  const [history, setHistory] = useState<Order[]>([])
  
  // Password Form
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' })

  // New Address Form
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ alias: 'Casa', detalle: '', referencia: '' })

  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeMapId, setActiveMapId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({})
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !getToken()) return
      try {
        // Obtener perfil actualizado desde el endpoint de clientes
        let me: any = user;
        try {
          const res: any = await api.get(`/clientes/${user.id}`);
          me = res.data || res;
        } catch (fetchErr) {
          console.warn('Could not fetch updated profile, using local storage user data.', fetchErr);
        }
        setProfileData({ 
          nombre: me.nombre || '', 
          apellidos: me.apellidos || me.apellido || '',
          email: me.email || '', 
          telefono: me.telefono || '' 
        })
        setAddresses(me.direcciones || [])

        // Obtener historial de pedidos (El parámetro mesero filtra por usuario en el backend)
        const ordersRes = await api.get<Order[]>(`/pedidos?mesero=${user.id}`)
        setHistory((ordersRes as any).data || ordersRes || [])
      } catch (error) {
        console.error('Error al cargar perfil:', error)
        toast.error('No se pudo cargar la información del perfil.')
      } finally {
        setLoading(false)
      }
    }
    loadData()

  }, [user?.id])

  useEffect(() => {
    if (!socket) return;

    const handleHistorial = (data: { pedidoId: string; mensajes: ChatMessage[] }) => {
      setChatMessages((prev) => ({ ...prev, [data.pedidoId]: data.mensajes }))
    }
    const handleNewMessage = (msg: ChatMessage) => {
        setChatMessages(prev => ({ ...prev, [msg.pedidoId]: [...(prev[msg.pedidoId] || []), msg] }))
        if(msg.sender === 'Repartidor') toast.info('Nuevo mensaje del repartidor')
    }
    socket.on('chat:historial', handleHistorial)
    socket.on('chat:nuevo_mensaje', handleNewMessage)
    
    return () => {
      socket.off('chat:historial', handleHistorial)
      socket.off('chat:nuevo_mensaje', handleNewMessage)
    }
  }, [socket])

  useEffect(() => {
    if (activeChatId && socket) {
      socket.emit('join_order_room', activeChatId)
    }
  }, [activeChatId, socket])

  const handleUpdateProfile = async () => {
    if (!profileData.nombre.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    try {
      await api.put(`/clientes/${user?.id}`, { 
        nombre: profileData.nombre, 
        apellidos: profileData.apellidos,
        telefono: profileData.telefono 
      })
      toast.success('Perfil actualizado correctamente') // Use UserType for setStoredUser
      setStoredUser({ ...user, nombre: profileData.nombre, apellidos: profileData.apellidos, telefono: profileData.telefono } as any)
      setIsEditing(false)
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.new !== passForm.confirm) return toast.error('Las nuevas contraseñas no coinciden')
    if (passForm.new.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres')
    
    setSaving(true)
    try {
      await api.put(`/clientes/${user?.id}`, { password: passForm.new })
      toast.success('Contraseña actualizada correctamente')
      setPassForm({ current: '', new: '', confirm: '' })
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAddress.detalle) return toast.error('La dirección es obligatoria')
    
    setSaving(true)
    const updatedAddresses = [...addresses, { id: Date.now().toString(), ...newAddress }]
    try {
      await api.put(`/clientes/${user?.id}`, { direcciones: updatedAddresses })
      setAddresses(updatedAddresses)
      setShowAddAddress(false)
      setNewAddress({ alias: 'Casa', detalle: '', referencia: '' })
      toast.success('Dirección guardada con éxito')
    } catch (e: any) {
      toast.error('Error al guardar la dirección')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    const updatedAddresses = addresses.filter(a => a.id !== id)
    try {
      await api.put(`/clientes/${user?.id}`, { direcciones: updatedAddresses })
      setAddresses(updatedAddresses)
      toast.success('Dirección eliminada')
    } catch (e) {
      toast.error('Error al eliminar la dirección')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const handleSendMessage = () => {
    if(!chatMessage.trim() || !activeChatId) return;
    const msg: ChatMessage = {
        pedidoId: activeChatId,
        sender: 'Cliente',
        text: chatMessage,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
    socket?.emit('chat:enviar_mensaje', msg)
    setChatMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }))
    setChatMessage('')
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, activeChatId])

  const activeOrders = history.filter(o => !['CERRADO', 'CANCELADO'].includes(o.estado))
  const pastOrders = history.filter(o => ['CERRADO', 'CANCELADO'].includes(o.estado))
  const activeOrderDetails = history.find(o => o._id === activeChatId)

  const renderOrderCard = (order: Order, isActive: boolean) => (
    <div key={order._id} className={`border rounded-2xl p-5 hover:shadow-md transition-shadow ${isActive ? 'border-[#D96C4A] bg-[#FFF5F0]' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.fechaHoraBolivia || order.createdAt).toLocaleDateString()}</span>
          <h4 className="font-black text-lg text-[#4B2E2D]">{order.codigo}</h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${order.estado === 'CERRADO' || order.estado === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' : order.estado === 'CANCELADO' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
          {order.estado === 'CERRADO' ? 'Pagado' : order.estado}
        </span>
      </div>
      
      <div className="bg-white/60 rounded-xl p-3 mb-3 space-y-1">
        {order.detalles?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="font-medium text-gray-600"><span className="text-gray-400 font-bold mr-1">{item.cantidad}x</span> {item.plato?.nombre || 'Plato'}</span>
            <span className="font-bold text-gray-700">Bs. {(item.subtotal || item.cantidad * (item.precioUnitario || item.plato?.precio)).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Total Pagado</span>
        <span className="text-xl font-black text-[#D96C4A]">Bs. {(order.total || 0).toFixed(2)}</span>
      </div>
      {(order as any).metodoEntrega === 'delivery' && isActive && (
        <>
          <div className="flex gap-2 mt-4">
            {(order as any).coordenadasEntrega && (
              <button onClick={() => setActiveMapId(activeMapId === order._id ? null : (order._id || null))} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors shadow-sm text-sm">
                <MapPin size={18} /> {activeMapId === order._id ? 'Ocultar Mapa' : 'Seguimiento GPS'}
              </button>
            )}
            <button onClick={() => setActiveChatId(order._id || null)} className="flex-1 py-3 bg-[#D96C4A] hover:bg-[#C25838] text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D96C4A]/30 text-sm">
              <MessageSquare size={18} /> Chat Delivery
            </button>
          </div>
          
          {activeMapId === order._id && (order as any).coordenadasEntrega && (
            <div className="h-56 w-full mt-4 rounded-2xl overflow-hidden border-2 border-blue-100 relative shadow-inner z-0 animate-in fade-in slide-in-from-top-2">
              <DeliveryMap destination={[(order as any).coordenadasEntrega.lat, (order as any).coordenadasEntrega.lng]} />
            </div>
          )}
        </>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D96C4A]" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 relative">
      {/* Fondo con imagen elegante */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000)',
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.5)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4B2E2D]/80 to-black/80 z-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col min-h-screen">

      {/* Header Simple */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-[#E0D0C5]/50">
        <div className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-[#D96C4A] font-bold transition-colors">
            <ArrowLeft size={20} /> Volver al Menú
          </button>
          <span className="font-black text-xl text-[#4B2E2D]">Mi Perfil</span>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0">
          {/* Tarjeta de Usuario */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E0D0C5] mb-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4B2E2D] to-[#D96C4A] text-white flex items-center justify-center font-black text-4xl shadow-xl mx-auto mb-4">
              {profileData.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-black text-[#4B2E2D]">{profileData.nombre}</h2>
            <p className="text-sm font-medium text-gray-500 mb-3">{profileData.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Cliente Normal · {history.length} pedidos entregados
            </div>
          </div>

          {/* Menú de Navegación */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E0D0C5] overflow-hidden flex flex-col">
            {[
              { id: 'perfil', label: 'Perfil', icon: <User size={18} /> },
              { id: 'direcciones', label: 'Direcciones', icon: <MapPin size={18} /> },
              { id: 'historial', label: 'Historial', icon: <Package size={18} /> },
              { id: 'seguridad', label: 'Seguridad', icon: <Shield size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  setIsEditing(false)
                }}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#FFF5F0] text-[#D96C4A] border-l-4 border-[#D96C4A]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#4B2E2D] border-l-4 border-transparent'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-all border-t border-gray-100 mt-2">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <section className="flex-1">
          {/* ════ TAB: PERFIL ════ */}
          {activeTab === 'perfil' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E0D0C5] p-6 sm:p-8 animate-in fade-in">
              <h3 className="text-2xl font-black text-[#4B2E2D] mb-6">Editar perfil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileData.nombre}
                    onChange={e => setProfileData({...profileData, nombre: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50 font-medium transition-all ${!isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Apellidos</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileData.apellidos}
                    onChange={e => setProfileData({...profileData, apellidos: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50 font-medium transition-all ${!isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Correo electrónico</label>
                  <input type="email" disabled value={profileData.email} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1 font-medium">El correo no puede modificarse.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={profileData.telefono}
                    onChange={e => setProfileData({...profileData, telefono: e.target.value})}
                    placeholder="Ej: 62729459"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50 font-medium transition-all ${!isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'}`}
                  />
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => {
                      setOriginalProfileData({ ...profileData });
                      setIsEditing(true);
                    }}
                    className="mt-4 px-6 py-3 bg-[#4B2E2D] hover:bg-[#3A2222] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center md:justify-start gap-2 md:col-span-2 w-fit"
                  >
                    <Edit2 size={18} />
                    Editar información
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-3 mt-4 md:col-span-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-[#D96C4A] text-white font-bold rounded-xl shadow-lg hover:bg-[#C25838] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                      Guardar cambios
                    </button>
                    <button
                      onClick={() => {
                        setProfileData({ ...originalProfileData });
                        setIsEditing(false);
                      }}
                      disabled={saving}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      <X size={18} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ TAB: DIRECCIONES ════ */}
          {activeTab === 'direcciones' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E0D0C5] p-6 sm:p-8 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#4B2E2D]">Mis Direcciones</h3>
                <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-1.5 px-4 py-2 bg-[#FCE4D6] text-[#D96C4A] font-bold rounded-lg hover:bg-[#E57C5D] hover:text-white transition-all text-sm">
                  <Plus size={16} /> Agregar
                </button>
              </div>

              {showAddAddress && (
                <form onSubmit={handleSaveAddress} className="mb-8 bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-[#4B2E2D]">Nueva Dirección</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Alias (Ej: Casa, Trabajo)</label>
                      <input required type="text" value={newAddress.alias} onChange={e => setNewAddress({...newAddress, alias: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#D96C4A]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Referencia (Opcional)</label>
                      <input type="text" value={newAddress.referencia} onChange={e => setNewAddress({...newAddress, referencia: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#D96C4A]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Dirección exacta</label>
                    <input required type="text" value={newAddress.detalle} onChange={e => setNewAddress({...newAddress, detalle: e.target.value})} placeholder="Ej: Calle Ayacucho Nro 123..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#D96C4A]" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddAddress(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold bg-[#D96C4A] text-white rounded-lg shadow-md hover:bg-[#C25838] transition-colors disabled:opacity-50">Guardar dirección</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl xl:col-span-2">
                    <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-500">No tienes direcciones guardadas.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#D96C4A]/30 hover:shadow-sm transition-all bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#D96C4A] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h4 className="font-black text-[#4B2E2D]">{addr.alias}</h4>
                          <p className="text-sm font-medium text-gray-600 mt-0.5">{addr.detalle}</p>
                          {addr.referencia && <p className="text-xs text-gray-400 mt-0.5">Ref: {addr.referencia}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════ TAB: HISTORIAL ════ */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E0D0C5] p-6 sm:p-8 animate-in fade-in">
              <h3 className="text-2xl font-black text-[#4B2E2D] mb-6">Historial de pedidos ({history.length})</h3>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {history.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl xl:col-span-2">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-bold text-gray-500">Sin pedidos en el historial.</p>
                    <p className="text-sm text-gray-400 mt-1">Tus compras aparecerán aquí.</p>
                  </div>
                ) : (
                  <>
                    {activeOrders.length > 0 && (
                      <div className="xl:col-span-2 mb-2">
                        <h4 className="font-bold text-lg text-[#D96C4A] mb-3 flex items-center gap-2">Pedidos en curso</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {activeOrders.map(order => renderOrderCard(order, true))}
                        </div>
                      </div>
                    )}
                    {pastOrders.length > 0 && (
                      <div className="xl:col-span-2">
                        <h4 className="font-bold text-lg text-gray-500 mb-3 flex items-center gap-2 mt-4">Pedidos anteriores</h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {pastOrders.map(order => renderOrderCard(order, false))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════ TAB: SEGURIDAD ════ */}
          {activeTab === 'seguridad' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E0D0C5] p-6 sm:p-8 animate-in fade-in">
              <h3 className="text-2xl font-black text-[#4B2E2D] mb-6">Cambiar contraseña</h3>
              <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Contraseña actual</label>
                  <input type="password" required value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nueva contraseña</label>
                  <input type="password" required minLength={8} value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirmar nueva contraseña</label>
                  <input type="password" required minLength={8} value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50" />
                </div>
                <button type="submit" disabled={saving} className="mt-4 px-6 py-3 bg-[#4B2E2D] text-white font-bold rounded-xl shadow-md hover:bg-[#3A2222] transition-all flex items-center justify-center md:justify-start gap-2 disabled:opacity-50 md:col-span-2 w-fit">
                  {saving ? <Loader2 size={18} className="animate-spin"/> : <Shield size={18} />}
                  Actualizar contraseña
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

  {/* Modal de Chat para el Cliente */}
  {activeChatId && (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg mx-auto rounded-3xl h-[70vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
              <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] p-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                      <MessageSquare size={22}/>
                      <span className="font-black text-lg">Chat con Repartidor {activeOrderDetails ? `(${activeOrderDetails.codigo})` : ''}</span>
                  </div>
                  <button onClick={() => setActiveChatId(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 p-5 overflow-y-auto bg-[#F8F9FA] flex flex-col gap-3">
                  {(chatMessages[activeChatId] || []).map((msg, i) => (
                      <div key={i} className={`flex flex-col max-w-[80%] ${msg.sender === 'Cliente' ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'Cliente' ? 'bg-[#D96C4A] text-white rounded-br-none' : 'bg-white border border-gray-200 text-[#4B2E2D] font-medium rounded-bl-none'}`}>
                              {msg.text}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 mt-1 px-1">{msg.time}</span>
                      </div>
                  ))}
                  {(chatMessages[activeChatId] || []).length === 0 && (
                      <div className="text-center text-gray-400 my-auto flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><MessageSquare size={20} className="text-gray-400"/></div>
                          <p className="font-bold">No hay mensajes aún</p>
                          <p className="text-xs mt-1">Escribe para dar instrucciones adicionales de llegada.</p>
                      </div>
                  )}
                  <div ref={chatEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                  <input type="text" value={chatMessage} onChange={e=>setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20 rounded-full px-5 py-3 text-sm outline-none transition-all font-medium text-[#4B2E2D]" placeholder="Escribe un mensaje..." />
                  <button onClick={handleSendMessage} disabled={!chatMessage.trim()} className="w-12 h-12 bg-[#D96C4A] hover:bg-[#b5462f] text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors shadow-md shadow-[#D96C4A]/30">
                      <Send size={18} className="-ml-0.5" />
                  </button>
              </div>
          </div>
      </div>
  )}
      </div>
    </div>
  )
}