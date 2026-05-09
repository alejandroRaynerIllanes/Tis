import { useState, useEffect } from 'react'
import { User, Lock, Eye, EyeOff, ChefHat, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { authService } from '../services/auth.service'
import { setToken, setStoredUser } from '../services/api'
import { toast } from 'sonner'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    const token = localStorage.getItem('authToken')
    if (userRole && token) {
      if (userRole === 'admin' || userRole === 'administrador') {
        navigate('/catalog', { replace: true })
      } else if (userRole === 'waiter' || userRole === 'mesero') {
        navigate('/waiter-view', { replace: true })
      } else if (userRole === 'chef' || userRole === 'cocinero') {
        navigate('/chef-view', { replace: true })
      } else if (userRole === 'cashier' || userRole === 'cajero') {
        navigate('/en-construccion', { replace: true })
      }
    }
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Obtenemos los datos completos (mejora de Gustavo)
      const { role, token, user } = await authService.login(username.trim(), password)

      // Guardamos la sesión usando las utilidades de la API
      setToken(token)
      setStoredUser(user)
      localStorage.setItem('userRole', role)

      // Validamos los roles (tu mejora)
      if (role === 'admin' || role === 'administrador') {
        navigate('/catalog', { replace: true })
      } else if (role === 'waiter' || role === 'mesero') {
        navigate('/waiter-view', { replace: true })
      } else if (role === 'chef' || role === 'cocinero') {
        navigate('/chef-view', { replace: true })
      } else {
        navigate('/en-construccion', { replace: true })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
      setPassword('') // Limpia únicamente el campo contraseña
      toast.error(message) // Muestra el mensaje flotante tipo Toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FCE4D6] font-sans overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600"
          alt=""
          aria-hidden="true"
          className="absolute w-full h-full object-cover pointer-events-none select-none scale-110"
          style={{ filter: 'blur(6px)', top: '-5%', left: '-5%', width: '110%', height: '110%' }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(217,108,74,0.5) 0%, rgba(75,46,45,0.6) 100%)'
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <div
          className="rounded-2xl p-10 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(217,108,74,0.2)'
          }}
        >
          <div className="flex items-center justify-center mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D96C4A 0%, #6B3E2E 100%)'
              }}
            >
              <ChefHat className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1
            className="text-3xl font-extrabold text-center mb-2 tracking-tight"
            style={{ color: '#4B2E2D' }}
          >
            Sabor & Gestión
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: '#6B3E2E' }}>
            Bienvenido · Inicia sesión para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#4B2E2D' }}
              >
                Usuario
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={20}
                  style={{ color: '#D96C4A', opacity: 0.7 }}
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    background: '#F5E6D3',
                    border: '2px solid rgba(217,108,74,0.25)',
                    color: '#4B2E2D'
                  }}
                  placeholder="Ingresa tu usuario"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
                style={{ color: '#4B2E2D' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={20}
                  style={{ color: '#D96C4A', opacity: 0.7 }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none"
                  style={{
                    background: '#F5E6D3',
                    border: '2px solid rgba(217,108,74,0.25)',
                    color: '#4B2E2D'
                  }}
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: '#D96C4A' }}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.3)'
                }}
              >
                <AlertCircle
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: '#DC2626' }}
                />
                <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D96C4A 0%, #6B3E2E 100%)'
              }}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-[#4B2E2D]/40 text-xs font-medium mt-6">
            © 2026 Sabor & Gestión · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
