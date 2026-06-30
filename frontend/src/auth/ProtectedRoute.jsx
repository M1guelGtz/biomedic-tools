import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Envuelve rutas que requieren sesión. Con soloAdmin, exige rol admin.
export default function ProtectedRoute({ children, soloAdmin = false }) {
  const { estaAutenticado, esAdmin, cargando } = useAuth();

  if (cargando) return <div className="content"><p>Cargando…</p></div>;
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  if (soloAdmin && !esAdmin) return <Navigate to="/equipos" replace />;
  return children;
}
