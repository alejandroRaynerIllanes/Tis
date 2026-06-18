import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  User,
  LogOut,
  ArrowRight,
  ChefHat,
  Trash2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { platosService } from '../services/platos.service'
import { categoriesService } from '../services/categories.service'
import { api, getStoredUser, getToken, setToken, setStoredUser } from '../services/api'
import { authService } from '../services/auth.service'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { CheckoutStepper } from './CheckoutStepper'

export function PublicMenu() {
  const [dishes, setDishes] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Flag para saber si mostramos el carrito o el proceso de pago
  const [isCheckoutStarted, setIsCheckoutStarted] = useState(false)

  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | 'forgot-password' | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Formularios
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  // Forgot Password modal states
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error('Por favor, ingresa tu correo electrónico')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail.trim())) {
      toast.error('Por favor, ingresa un correo electrónico válido')
      return
    }

    setForgotLoading(true)
    try {
      const res: any = await api.post('/auth/forgot-password', { email: forgotEmail.trim() })
      toast.success(res.mensaje || 'Si el correo está registrado, se enviará un enlace de recuperación')
      setShowAuthModal('login')
      setForgotEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la solicitud')
    } finally {
      setForgotLoading(false)
    }
  }
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    terms: false
  })

  const navigate = useNavigate()

  // 🔥 FIX: Usamos estados reactivos para que el menú se actualice instantáneamente al loguearse
  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const [userToken, setUserToken] = useState(getToken())

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 Como ya liberamos las rutas en el backend, podemos usar los servicios oficiales
        // Esto asegura que la URL base de Axios se aplique correctamente (adiós pantallas en blanco).
        const [catsData, platsData] = await Promise.all([
          categoriesService.getAll().catch((err) => {
            console.error('❌ ERROR REAL AL TRAER CATEGORÍAS:', err.message || err)
            return []
          }),
          platosService.getAll().catch((err) => {
            console.error('❌ ERROR REAL AL TRAER PLATOS:', err.message || err)
            return []
          })
        ])

        // Esto imprimirá en la consola F12 qué fue lo que respondió el backend exactamente
        console.log('📦 DATOS RECIBIDOS DE CATEGORÍAS:', catsData)
        console.log('📦 DATOS RECIBIDOS DE PLATOS:', platsData)

        setCategories(Array.isArray(catsData) ? catsData : [])

        const validPlats = Array.isArray(platsData) ? platsData : []
        setDishes(
          validPlats.map((p: any) => ({
            ...p,
            id: p._id || p.id,
            categoryName:
              p.categoria && typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria,
            precio: p.precio || p.price || 0
          }))
        )
      } catch (error) {
        console.error('Error cargando menú:', error)
      }
    }
    fetchData()
  }, [])

  // Reiniciar paso y pre-llenar datos del usuario cuando se abre el carrito
  useEffect(() => {
    if (isCartOpen) {
      setIsCheckoutStarted(false)
    }
  }, [isCartOpen, currentUser])

  const addToCart = (product: any) => {
    if (product.disponible === false || product.estado === 'Agotado' || product.estado === false) {
      toast.error('Este producto está agotado.')
      return
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.nombre || product.name} agregado al carrito.`)
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta
            return newQ > 0 ? { ...item, quantity: newQ } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product.precio || item.product.price) * item.quantity,
    0
  )

  const handleCheckoutClick = () => {
    if (!userToken) {
      setShowAuthModal('login')
      return
    }
    setIsCheckoutStarted(true)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      let authData: any;
      if (typeof (authService as any).login === 'function') {
        authData = await (authService as any).login(loginForm.email, loginForm.password)
      } else {
        try {
          authData = await (authService as any).loginClient(loginForm.email, loginForm.password)
        } catch (err: any) {
          authData = await (authService as any).loginStaff(loginForm.email, loginForm.password)
        }
      }
      const { role, token, user } = authData;
      setToken(token)
      setStoredUser(user)

      // Actualizar vista inmediatamente
      setUserToken(token)
      setCurrentUser(user as any)
      localStorage.setItem('userRole', role)

      const roleLower = role.toLowerCase().trim()
      if (roleLower === 'admin' || roleLower === 'administrador') navigate('/catalog')
      else if (roleLower === 'mesero' || roleLower === 'waiter') navigate('/waiter-view')
      else if (roleLower === 'cocinero' || roleLower === 'chef') navigate('/chef-view')
      else if (roleLower === 'cajero' || roleLower === 'cashier') navigate('/cashier-view')
      else if (roleLower === 'delivery' || roleLower === 'repartidor') navigate('/delivery')
      else if (roleLower === 'cliente' || roleLower === 'client') navigate('/perfil')
      else {
        setShowAuthModal(null)
        toast.success('Sesión iniciada correctamente')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!registerForm.terms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }
    setAuthLoading(true)
    try {
      await api.post('/clientes/auth/register', {
        nombre: registerForm.nombre,
        apellidos: registerForm.apellido,
        email: registerForm.email,
        telefono: registerForm.telefono,
        password: registerForm.password
      })
      toast.success('Registro exitoso. Iniciando sesión...')
      
      let authData: any;
      if (typeof (authService as any).login === 'function') {
        authData = await (authService as any).login(registerForm.email, registerForm.password)
      } else {
        authData = await (authService as any).loginClient(registerForm.email, registerForm.password)
      }
      const { role, token, user } = authData;
      
      setToken(token)
      setStoredUser(user)

      // Actualizar vista inmediatamente
      setUserToken(token)
      setCurrentUser(user as any)
      localStorage.setItem('userRole', role)
      setShowAuthModal(null)

      // Redirigir a perfil si es cliente
      const roleLower = role.toLowerCase().trim()
      if (roleLower === 'cliente' || roleLower === 'client') navigate('/perfil')
    } catch (err: any) {
      const errorMsg = err.message || ''
      if (
        errorMsg.includes('409') ||
        errorMsg.toLowerCase().includes('duplicado') ||
        errorMsg.includes('E11000') ||
        errorMsg.toLowerCase().includes('ya existe')
      ) {
        toast.error('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        toast.error(errorMsg || 'Error al registrar la cuenta')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const nombreStr = d.nombre || d.name || ''
      const matchesSearch = nombreStr.toLowerCase().includes(searchQuery.toLowerCase())
      const catId = d.categoria && typeof d.categoria === 'object' ? d.categoria._id : d.categoria
      const matchesCategory = activeCategory === 'all' || catId === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [dishes, searchQuery, activeCategory])

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-gray-800 relative"
      style={{ backgroundColor: '#EAD4C4' }}
    >
      {/* Fondo con imagen sutil */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* HEADER PUBLICO */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(234, 212, 196, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(217, 108, 74, 0.15)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D96C4A] to-[#b5462f] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#D96C4A]/30">
              <ChefHat size={20} strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl text-[#4B2E2D] hidden sm:block">
              Sabor & Gestión
            </span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar platillos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full focus:outline-none shadow-sm transition-all border border-transparent focus:border-[#D96C4A] focus:shadow-md"
                style={{ color: '#4B2E2D' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-[#D96C4A] transition-colors"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-[#D96C4A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            {userToken ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/perfil')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4B2E2D] to-[#6B3E2E] text-white flex items-center justify-center font-black text-sm shadow-sm border border-[#E0D0C5]">
                    {currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-bold text-[#4B2E2D] hidden sm:block">
                    {currentUser?.nombre}
                  </span>
                </button>
                <button
                  onClick={() => {
                    localStorage.clear()
                    navigate(0)
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal('login')}
                className="flex items-center gap-2 bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <User size={16} /> <span className="hidden sm:inline">INICIAR SESIÓN</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CATALOGO */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div
          className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12 mb-10 shadow-2xl transition-transform hover:scale-[1.01] duration-500"
          style={{ background: 'linear-gradient(135deg, #4B2E2D 0%, #b5462f 100%)' }}
        >
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-[#F2A98A] opacity-20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm mb-6 backdrop-blur-md shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFF',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <span className="animate-bounce">🍽️</span> Delivery a domicilio
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mt-1">
              ¿Qué se te antoja <span style={{ color: '#FCE4D6' }}>hoy?</span>
            </h1>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-4 mb-8 [&::-webkit-scrollbar]:hidden px-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 ${activeCategory === 'all' ? 'shadow-lg hover:scale-105' : 'hover:-translate-y-1'}`}
            style={
              activeCategory === 'all'
                ? {
                    background: '#D96C4A',
                    color: 'white',
                    boxShadow: '0 10px 25px -5px rgba(217,108,74,0.4)'
                  }
                : {
                    background: 'white',
                    color: '#4B2E2D',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }
            }
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c._id || c.id}
              onClick={() => setActiveCategory(c._id || c.id)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-300 ${activeCategory === (c._id || c.id) ? 'shadow-lg hover:scale-105' : 'hover:-translate-y-1'}`}
              style={
                activeCategory === (c._id || c.id)
                  ? {
                      background: '#D96C4A',
                      color: 'white',
                      boxShadow: '0 10px 25px -5px rgba(217,108,74,0.4)'
                    }
                  : {
                      background: 'white',
                      color: '#4B2E2D',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }
              }
            >
              {c.nombre || c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => {
            const isAvailable =
              dish.disponible !== false && dish.estado !== 'Agotado' && dish.estado !== false
            return (
              <div
                key={dish.id}
                className="bg-white rounded-[2rem] overflow-hidden group flex flex-col transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-[#FCE4D6]"
                style={{ boxShadow: '0 10px 30px -10px rgba(75,46,45,0.08)' }}
              >
                <div className="relative h-52 overflow-hidden bg-[#FCE4D6]">
                  <img
                    src={
                      dish.imagenUrl ||
                      dish.image ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
                    }
                    alt={dish.nombre || dish.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black px-3 py-1 rounded-md tracking-widest shadow-lg transform -rotate-12">
                        AGOTADO
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute top-4 right-4 px-4 py-1.5 rounded-xl font-black shadow-lg backdrop-blur-md"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#4B2E2D' }}
                  >
                    Bs. {(dish.precio || dish.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="font-black text-xl leading-tight mb-1 line-clamp-1"
                    style={{ color: '#4B2E2D' }}
                  >
                    {dish.nombre || dish.name || 'Sin nombre'}
                  </h3>
                  <p className="text-xs text-[#D96C4A] font-bold uppercase tracking-wider mb-2">
                    {dish.categoryName || 'General'}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {dish.descripcion || dish.description || ''}
                  </p>
                  <button
                    onClick={() => addToCart(dish)}
                    disabled={!isAvailable}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${isAvailable ? 'hover:shadow-md hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}`}
                    style={
                      isAvailable
                        ? { background: '#FCE4D6', color: '#D96C4A' }
                        : { background: '#F3F4F6', color: '#9CA3AF' }
                    }
                  >
                    <Plus size={18} /> {isAvailable ? 'Agregar al pedido' : 'Agotado'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* MODAL DEL CARRITO Y CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-[500px] h-[90vh] sm:h-[700px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {!isCheckoutStarted ? (
              <>
                <div className="p-6 border-b flex items-center justify-between bg-[#FCE4D6]/30 shrink-0">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="text-[#D96C4A]" size={24} />
                    <h2 className="text-xl font-black text-[#4B2E2D]">Tu Pedido</h2>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 text-[#4B2E2D]/50 hover:text-[#D96C4A] transition-colors bg-white rounded-full shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <ShoppingCart size={48} className="opacity-20" />
                      <p className="font-medium">Tu carrito está vacío</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="px-6 py-2 bg-[#FCE4D6] text-[#D96C4A] font-bold rounded-full"
                      >
                        Explorar Menú
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative"
                      >
                        <img
                          src={
                            item.product.imagenUrl ||
                            item.product.image ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
                          }
                          alt={item.product.nombre}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar del pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex-1 flex flex-col justify-between pr-6">
                          <div>
                            <h4 className="font-bold text-[#4B2E2D] line-clamp-1">
                              {item.product.nombre || item.product.name}
                            </h4>
                            <span className="text-[#D96C4A] font-black text-sm">
                              Bs. {(item.product.precio || item.product.price).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-[#4B2E2D] w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-8 h-8 rounded-full bg-[#FCE4D6] flex items-center justify-center text-[#D96C4A] hover:bg-[#D96C4A] hover:text-white transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 bg-white border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-2 duration-300 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-500 font-bold">Total a pagar:</span>
                      <span className="text-2xl font-black text-[#4B2E2D]">
                        Bs. {cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleCheckoutClick}
                      className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black text-lg shadow-lg hover:bg-[#b5462f] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      {userToken ? 'Confirmar Pedido' : 'Iniciar Sesión para Pedir'}{' '}
                      <ArrowRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <CheckoutStepper
                cart={cart}
                cartTotal={cartTotal}
                currentUser={currentUser as any}
                onClose={() => setIsCheckoutStarted(false)}
                onOrderSuccess={() => {
                  setCart([])
                  setIsCheckoutStarted(false)
                  setIsCartOpen(false)
                  navigate('/perfil')
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICACIÓN (LOGIN/REGISTRO) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => {
                setShowAuthModal(null)
                setForgotEmail('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {showAuthModal === 'login' ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[#4B2E2D]">Bienvenido</h2>
                  <p className="text-sm text-gray-500 mt-1">Inicia sesión para realizar pedidos</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A]/20 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-[#4B2E2D]">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAuthModal('forgot-password')}
                        className="text-xs font-bold hover:underline focus:outline-none"
                        style={{ color: '#D96C4A' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A]/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-[#4B2E2D] text-white rounded-xl font-bold hover:bg-[#3A2222] transition-colors mt-2"
                  >
                    {authLoading ? 'Verificando...' : 'Iniciar Sesión'}
                  </button>
                </form>
                <p className="text-center mt-6 text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setShowAuthModal('register')}
                    className="text-[#D96C4A] font-bold hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </>
            ) : showAuthModal === 'forgot-password' ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[#4B2E2D]">¿Olvidaste tu contraseña?</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
                      placeholder="ejemplo@correo.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A]/20 outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 bg-[#4B2E2D] text-white rounded-xl font-bold hover:bg-[#3A2222] transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal('login')}
                    className="text-[#D96C4A] font-bold hover:underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-[#4B2E2D]">Crear Cuenta</h2>
                </div>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#4B2E2D] mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        value={registerForm.nombre}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, nombre: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={registerForm.apellido}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, apellido: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4B2E2D] mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={registerForm.telefono}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, telefono: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4B2E2D] mb-1">
                        Confirmar
                      </label>
                      <input
                        type="password"
                        required
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={registerForm.terms}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, terms: e.target.checked })
                      }
                      className="w-4 h-4 text-[#D96C4A]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      Acepto los términos y condiciones
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-[#4B2E2D] text-white rounded-xl font-bold hover:bg-[#3A2222] mt-2"
                  >
                    {authLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </button>
                </form>
                <p className="text-center mt-4 text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setShowAuthModal('login')}
                    className="text-[#D96C4A] font-bold hover:underline"
                  >
                    Inicia sesión
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
