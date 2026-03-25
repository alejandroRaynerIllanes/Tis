import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { username, password });
    // Navegamos a la nueva pantalla tras iniciar sesión
    navigate('/modules');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FCE4D6] font-sans text-[#4B2E2D]">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h1 className="text-4xl font-bold text-center mb-10 text-[#4B2E2D]">
            Sabor & Gestión
          </h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-bold text-[#4B2E2D]">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E57C5D]">
                  <User size={20} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:ring-offset-2 transition-all"
                  placeholder="Ingresa tu usuario"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-[#4B2E2D]">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E57C5D]">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-[#E57C5D] text-[#4B2E2D] focus:outline-none focus:ring-2 focus:ring-[#D0543A] focus:ring-offset-2 transition-all"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg font-bold text-white bg-[#D0543A] transition-all hover:bg-[#b5462f] shadow-md hover:shadow-lg active:scale-[0.98] mt-8 text-lg"
            >
              Ingresar
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="#" className="text-sm font-medium hover:underline transition-all text-[#4B2E2D] hover:text-[#D0543A]">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
