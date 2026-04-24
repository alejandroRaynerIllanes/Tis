// src/app/components/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Users, Shield, UserCheck, UserCog } from 'lucide-react';
import { usersService, BackendUser } from '../../services/users.service';
import { toast } from 'sonner';

export function UserManagement() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditingId, setUserEditingId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({ firstName: '', lastName: '', ci: '', email: '', role: 'Mesero', password: '' });
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const cargarUsuarios = async () => {
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Error al cargar usuarios desde el backend:", error);
    }
  };

  // Se ejecuta al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleOpenAddUserModal = () => {
    setUserEditingId(null);
    setUserFormData({ firstName: '', lastName: '', ci: '', email: '', role: 'Mesero', password: '' });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: BackendUser) => {
    setUserEditingId(user._id);
    setUserFormData({ 
      firstName: user.nombre, 
      lastName: user.apellido, 
      ci: user.ci, 
      email: user.email, 
      role: user.rol, 
      password: '' 
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.ci || !userFormData.email || !userFormData.role) return;

    try {
      const payload: any = {
        nombre: userFormData.firstName,
        apellido: userFormData.lastName,
        ci: userFormData.ci,
        email: userFormData.email,
        rol: userFormData.role,
      };

      if (userEditingId) {
        if (userFormData.password) payload.password = userFormData.password;
        await usersService.update(userEditingId, payload);
      } else {
        payload.password = userFormData.password;
        await usersService.create(payload);
      }

      await cargarUsuarios();
      setIsUserModalOpen(false);
    } catch (error) {
      console.error("Error al guardar usuario en BD:", error);
      toast.error("Hubo un error al guardar.", { description: "Verifica la consola para más detalles." });
    }
  };

  const toggleUserStatus = async (user: BackendUser) => {
    try {
      const nuevoEstado = !user.estado;
      await usersService.toggleStatus(user._id, nuevoEstado);
      setUsers(users.map(u => u._id === user._id ? { ...u, estado: nuevoEstado } : u));
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleDeleteUser = async (id: string | null) => {
    if (!id) return;
    try {
      await usersService.remove(id);
      setUsers(users.filter(u => u._id !== id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Administrador') return { bg: 'bg-[#D0543A]/15', text: 'text-[#D0543A]', border: 'border-[#D0543A]/30', icon: <Shield size={12} /> };
    if (role === 'Mesero') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: <UserCheck size={12} /> };
    return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', icon: <UserCog size={12} /> };
  };

  return (
    <>
      <header className="px-10 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-4xl font-bold text-[#4B2E2D] mb-2">Gestión de Usuarios</h1>
          <p className="text-[#4B2E2D]/70 font-medium">Administra las cuentas del personal (Conectado a DB)</p>
        </div>
        <button
          onClick={handleOpenAddUserModal}
          className="flex items-center gap-2 bg-[#D0543A] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={3} />
          Nuevo Usuario
        </button>
      </header>

      <div className="p-10 pt-4">
        <div className="bg-white rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all overflow-hidden">
          <div className="px-8 py-6 border-b border-[#FCE4D6]">
            <h2 className="text-2xl font-bold text-[#4B2E2D]">
              Usuarios Registrados ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#FCE4D6] bg-[#FCE4D6]/20">
                  <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Nombre</th>
                  <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Email</th>
                  <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Rol</th>
                  <th className="text-left py-4 px-6 font-bold text-[#4B2E2D]">Estado</th>
                  <th className="text-right py-4 px-6 font-bold text-[#4B2E2D]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const badge = getRoleBadge(user.rol); 
                  const fullName = `${user.nombre} ${user.apellido}`; 
                  
                  return (
                    <tr key={user._id} className="border-b border-[#FCE4D6] hover:bg-[#FCE4D6]/20 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FCE4D6] flex items-center justify-center text-[#D0543A] font-bold shrink-0">
                            {user.nombre.charAt(0)}
                          </div>
                          <span className="font-bold text-[#4B2E2D]">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-[#4B2E2D]/70 font-medium">{user.email}</td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.icon}
                          {user.rol}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${user.estado ? 'bg-[#E57C5D]' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${user.estado ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                          <span className={`text-sm font-bold ${user.estado ? 'text-[#E57C5D]' : 'text-gray-400'}`}>
                            {user.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditUserModal(user)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#FCE4D6] rounded-lg transition-all"
                            aria-label="Editar usuario"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setUserToDelete(user._id)}
                            className="p-2 text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-[#D0543A]/10 rounded-lg transition-all"
                            aria-label="Eliminar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#FCE4D6] flex items-center justify-center mb-4">
                  <Users size={28} className="text-[#E57C5D]" />
                </div>
                <p className="font-bold text-[#4B2E2D] text-lg">No hay usuarios en la base de datos</p>
                <p className="text-[#4B2E2D]/60 font-medium mt-1">Asegúrate de que tu backend está corriendo y usa el botón para agregar personal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nuevo/Editar Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[520px] border-[6px] border-[#4B2E2D] rounded-3xl p-8 relative my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-4 right-4 text-[#4B2E2D]/50 hover:text-[#D0543A] transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-bold text-[#4B2E2D] mb-6">{userEditingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <form className="space-y-5" onSubmit={handleSaveUser}>
              <div><label className="block text-sm font-bold text-[#4B2E2D] mb-2">Nombre(s)</label><input type="text" required value={userFormData.firstName} onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="Ej: Juan Carlos" /></div>
              <div><label className="block text-sm font-bold text-[#4B2E2D] mb-2">Apellido(s)</label><input type="text" required value={userFormData.lastName} onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="Ej: Pérez Gómez" /></div>
              <div><label className="block text-sm font-bold text-[#4B2E2D] mb-2">CI</label><input type="text" required value={userFormData.ci} onChange={(e) => setUserFormData({ ...userFormData, ci: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="Ej: 12345678" /></div>
              <div><label className="block text-sm font-bold text-[#4B2E2D] mb-2">Correo Electrónico</label><input type="email" required value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder="correo@restaurante.com" /></div>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">Rol</label>
                <select value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all bg-white appearance-none cursor-pointer" required>
                  <option value="Administrador">Administrador</option>
                  <option value="Mesero">Mesero</option>
                  <option value="Cocinero">Cocinero</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4B2E2D] mb-2">{userEditingId ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
                <input type="password" required={!userEditingId} value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:border-transparent transition-all placeholder:text-[#4B2E2D]/40" placeholder={userEditingId ? 'Dejar en blanco para no cambiar' : '••••••••'} />
              </div>
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#FCE4D6]">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-6 py-3 font-bold text-[#4B2E2D]/60 hover:bg-[#FCE4D6]/50 hover:text-[#4B2E2D] rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all">{userEditingId ? 'Actualizar Usuario' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {userToDelete !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FCE4D6] w-full max-w-[400px] border-[4px] border-[#D0543A] rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#D0543A]/10 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32} className="text-[#D0543A]" /></div>
            <h2 className="text-2xl font-bold text-[#4B2E2D] mb-3">¿Eliminar Usuario?</h2>
            <p className="text-[#4B2E2D]/80 mb-8 leading-relaxed font-medium">Esta acción eliminará la cuenta del usuario permanentemente de la Base de Datos y no se puede deshacer.</p>
            <div className="flex items-center justify-center gap-4 w-full">
              <button onClick={() => setUserToDelete(null)} className="flex-1 py-3 px-4 font-bold text-[#4B2E2D] bg-transparent border-2 border-[#4B2E2D] rounded-xl hover:bg-[#4B2E2D] hover:text-white transition-all">Cancelar</button>
              <button onClick={() => handleDeleteUser(userToDelete)} className="flex-1 py-3 px-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg hover:bg-[#b5462f] hover:shadow-xl active:scale-[0.98] transition-all border-2 border-[#D0543A]">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}