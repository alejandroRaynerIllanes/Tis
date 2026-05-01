import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Shield,
  ChefHat,
  UtensilsCrossed,
  CreditCard,
  Ban,
  CheckCircle2,
  X,
  Save,
  Trash2,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { usersService, type BackendUser } from '../services/users.service'

type Role = 'Administrador' | 'Mesero' | 'Cocinero' | 'Cajero'

// Mapeo de roles frontend ↔ backend (coincide con el enum del backend)
const ROLE_TO_BACKEND: Record<Role, string> = {
  Administrador: 'administrador',
  Mesero: 'mesero',
  Cocinero: 'cocinero',
  Cajero: 'cajero'
}

const ROLE_FROM_BACKEND: Record<string, Role> = {
  administrador: 'Administrador',
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero'
}

function mapUserFromBackend(
  u: BackendUser
): BackendUser & { displayRole: Role; displayName: string } {
  return {
    ...u,
    displayRole: ROLE_FROM_BACKEND[u.rol.toLowerCase()] || 'Mesero',
    displayName: `${u.nombre} ${u.apellido}`
  }
}

type DisplayUser = ReturnType<typeof mapUserFromBackend>

export function UserManagement() {
  const [users, setUsers] = useState<DisplayUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<DisplayUser | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Confirm delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<DisplayUser | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ci: '',
    email: '',
    password: '',
    role: 'Mesero' as Role
  })

  // Cargar usuarios del backend
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      setUsers(data.map(mapUserFromBackend))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayRole.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Administrador':
        return <Shield size={18} />
      case 'Cocinero':
        return <ChefHat size={18} />
      case 'Mesero':
        return <UtensilsCrossed size={18} />
      case 'Cajero':
        return <CreditCard size={18} />
    }
  }

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Administrador':
        return 'bg-[#6B3E2E] text-white border-[#4B2E2D]'
      case 'Cocinero':
        return 'bg-[#D96C4A] text-white border-[#C55A38]'
      case 'Mesero':
        return 'bg-[#E6A23C] text-[#2C2C2C] border-[#D4912B]'
      case 'Cajero':
        return 'bg-[#F5E6D3] text-[#2C2C2C] border-[#E3D3BF]'
    }
  }

  const handleOpenModal = (user?: DisplayUser) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        firstName: user.nombre,
        lastName: user.apellido,
        ci: user.ci,
        email: user.email,
        password: '',
        role: user.displayRole
      })
    } else {
      setEditingUser(null)
      setFormData({
        firstName: '',
        lastName: '',
        ci: '',
        email: '',
        password: '',
        role: 'Mesero'
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      if (editingUser) {
        // PUT /usuarios/:id
        await usersService.update(editingUser.id, {
          nombre: formData.firstName,
          apellido: formData.lastName,
          ci: formData.ci,
          email: formData.email,
          rol: ROLE_TO_BACKEND[formData.role],
          ...(formData.password ? { contraseña: formData.password } : {})
        })
        toast.success('Usuario actualizado correctamente')
      } else {
        // POST /usuarios
        if (!formData.password) {
          toast.error('La contraseña es obligatoria para nuevos usuarios')
          setSubmitLoading(false)
          return
        }
        await usersService.create({
          nombre: formData.firstName,
          apellido: formData.lastName,
          ci: formData.ci,
          email: formData.email,
          contraseña: formData.password,
          rol: ROLE_TO_BACKEND[formData.role]
        })
        toast.success('Usuario creado correctamente')
      }
      handleCloseModal()
      await fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar usuario'
      toast.error(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  // PATCH /usuarios/:id/estado
  const handleToggleStatus = async (user: DisplayUser) => {
    setActionLoading(user.id)
    try {
      await usersService.toggleStatus(user.id)
      const newEstado = !user.estado
      toast.success(`${user.displayName} ahora está ${newEstado ? 'activo' : 'inactivo'}`)
      await fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado'
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  // DELETE /usuarios/:id
  const handleDelete = async (user: DisplayUser) => {
    setActionLoading(user.id)
    try {
      await usersService.remove(user.id)
      toast.success(`${user.displayName} eliminado correctamente`)
      setDeleteConfirm(null)
      await fetchUsers()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar usuario'
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FCE4D6] font-sans selection:bg-[#E57C5D] selection:text-white relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] pointer-events-none"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1771574205963-0c1d84ac7354?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwYW1iaWFuY2V8ZW58MXx8fHwxNzc1NjgxNTU2fDA&ixlib=rb-4.1.0&q=80&w=1080)'
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(44, 25, 15, 0.65)' }}
      />

      {/* Header */}
      <header className="px-6 lg:px-10 py-6 lg:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-black/40 backdrop-blur-md z-20 shrink-0 border-b border-white/10">
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 drop-shadow-sm flex items-center gap-3">
            <Users className="text-[#E6A23C]" size={36} strokeWidth={2.5} />
            Gestión de Personal
          </h1>
          <p className="text-white/80 font-medium drop-shadow-sm text-sm sm:text-base">
            Administra los usuarios, roles y accesos del sistema
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <input
              type="text"
              placeholder="Buscar personal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/30 border border-white/20 text-white placeholder-white/50 rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 transition-all"
            />
          </div>
          <button
            onClick={() => fetchUsers()}
            className="bg-white/10 text-white p-2.5 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            title="Recargar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-[#D96C4A] to-[#C55A38] text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap border border-white/10"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#E6A23C] animate-spin mb-4" />
            <p className="text-white/80 font-medium">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-white/95 backdrop-blur-xl rounded-[24px] p-6 shadow-xl border border-white/50 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${!user.estado ? 'opacity-75 grayscale-[50%]' : ''}`}
              >
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F5E6D3] to-transparent z-0 opacity-50" />

                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#6B3E2E] to-[#D96C4A] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                    {user.nombre ? user.nombre.charAt(0).toUpperCase() : ''}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      user.estado
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {user.estado ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                    {user.estado ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <div className="relative z-10 mb-4 flex-1">
                  <h3 className="text-xl font-bold text-[#2C2C2C] leading-tight mb-1">
                    {user.displayName}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium flex items-center gap-1.5 mb-1">
                    {user.email}
                  </p>
                  <p className="text-gray-400 text-xs font-medium mb-3">CI: {user.ci}</p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${getRoleColor(user.displayRole)} shadow-sm`}
                  >
                    {getRoleIcon(user.displayRole)}
                    {user.displayRole}
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={actionLoading === user.id}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl font-semibold text-xs transition-colors border disabled:opacity-50 ${
                      user.estado
                        ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                    }`}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : user.estado ? (
                      <Ban size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {user.estado ? 'Deshab.' : 'Habilitar'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex items-center justify-center gap-1 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-xs hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user)}
                    className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold text-xs hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/30">
                <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-[#6B3E2E] opacity-50" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white drop-shadow-sm mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-white/80">Intenta con otro término de búsqueda.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Crear/Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  {editingUser ? (
                    <Edit2 size={20} className="text-white" />
                  ) : (
                    <UserPlus size={20} className="text-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-white text-lg leading-tight">
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h2>
                  <p className="text-[#F5E6D3] text-xs font-semibold mt-0.5">
                    {editingUser
                      ? 'Modifica los datos del personal'
                      : 'Completa el formulario para registrar'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5 ml-1">
                    Nombre(s)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Juan Carlos"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 focus:border-[#E6A23C] transition-all text-[#2C2C2C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5 ml-1">
                    Apellido(s)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Pérez Gómez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 focus:border-[#E6A23C] transition-all text-[#2C2C2C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5 ml-1">CI</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: 12345678"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 focus:border-[#E6A23C] transition-all text-[#2C2C2C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5 ml-1">
                    Correo Electrónico
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: juan.perez@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 focus:border-[#E6A23C] transition-all text-[#2C2C2C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-1.5 ml-1">
                    Contraseña{' '}
                    {editingUser && (
                      <span className="text-gray-400 font-normal text-xs">
                        (Dejar en blanco para mantener actual)
                      </span>
                    )}
                  </label>
                  <input
                    required={!editingUser}
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E6A23C]/50 focus:border-[#E6A23C] transition-all text-[#2C2C2C] font-medium"
                  />
                  {formData.password && (
                    <p className="text-[10px] text-green-600 font-semibold mt-1.5 ml-2 flex items-center gap-1">
                      <Shield size={10} /> La contraseña se almacenará encriptada en el servidor
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4B2E2D] mb-2 ml-1">
                    Rol en el sistema
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Administrador', 'Mesero', 'Cocinero', 'Cajero'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                          formData.role === r
                            ? 'border-[#D96C4A] bg-[#FFF5F0] text-[#D96C4A]'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {getRoleIcon(r)}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-gradient-to-r from-[#D96C4A] to-[#C55A38] hover:from-[#C55A38] hover:to-[#B44B2C] text-white py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#2C2C2C] mb-2">¿Eliminar usuario?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Se eliminará permanentemente a <strong>{deleteConfirm.displayName}</strong>. Esta
              acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {actionLoading === deleteConfirm.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
