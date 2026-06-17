import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import { toast } from 'sonner'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      const msg = 'El token de recuperación es inválido o no está presente en la URL.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!password || !confirmPassword) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Contraseña restablecida correctamente. Ya puedes iniciar sesión.')
      navigate('/login', { replace: true })
    } catch (err: any) {
      const msg = err.message || 'Error al restablecer la contraseña'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF7F2] font-sans p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#D96C4A] blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#4B2E2D] blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#E0D0C5]/40 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#D96C4A] flex items-center justify-center shadow-md border border-[#FFF5F0]">
              <ShieldCheck size={32} />
            </div>
          </div>

          <h2 className="text-3xl font-black text-center text-[#4B2E2D] mb-2">Restablecer Contraseña</h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
          </p>

          {!token ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 mb-6">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Token no encontrado</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  El enlace de recuperación es inválido o no incluye el token necesario. 
                  Por favor, solicita un nuevo enlace de recuperación.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/50 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium leading-relaxed">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4B2E2D] text-white rounded-xl font-bold shadow-lg hover:bg-[#3A2222] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-bold text-[#D96C4A] hover:underline"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
