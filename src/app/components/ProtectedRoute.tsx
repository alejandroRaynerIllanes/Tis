import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    
    // Si no hay rol, redirigir al login
    if (!userRole) {
      navigate('/', { replace: true });
      setIsChecking(false);
      return;
    }

    // Si requiere admin y el usuario no es admin, redirigir
    if (requireAdmin && userRole !== 'admin' && userRole !== 'administrador') {
      navigate('/waiter-view', { replace: true });
      setIsChecking(false);
      return;
    }

    // Usuario autorizado
    setIsAuthorized(true);
    setIsChecking(false);
  }, [navigate, requireAdmin]);

  // Mostrar un fallback mientras se verifica
  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#4B2E2D]">
        <div className="text-white text-xl">Verificando...</div>
      </div>
    );
  }

  // Si no está autorizado, mostrar un mensaje (aunque se redirige)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#4B2E2D]">
        <div className="text-white text-xl">Redirigiendo...</div>
      </div>
    );
  }

  // Usuario autorizado, mostrar el contenido
  return <>{children}</>;
}