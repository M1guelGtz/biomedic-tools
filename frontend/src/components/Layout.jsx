import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Espina de instrumento: navegación vertical agrupada en 3 chunks
// (Biblioteca / Asistente / Sistema) para bajar la carga de decisión.
export default function Layout() {
  const { usuario, esAdmin, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const loc = useLocation();

  // Cerrar el drawer al navegar (mobile).
  useEffect(() => { setAbierto(false); }, [loc.pathname]);

  const lc = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <div className="app">
      <aside className={`spine ${abierto ? 'abierto' : ''}`}>
        <Link to="/" className="brand">BioMed <span className="brand-sub">TOOLS</span></Link>

        <nav className="nav">
          <NavLink to="/" end className={lc}>Inicio</NavLink>

          <div className="nav-group">
            <span className="nav-group-label">Biblioteca</span>
            <NavLink to="/equipos" className={lc}>Equipos</NavLink>
            <NavLink to="/manuales" className={lc}>Manuales</NavLink>
            <NavLink to="/normativas" className={lc}>Normativas</NavLink>
          </div>

          <div className="nav-group">
            <span className="nav-group-label">Asistente</span>
            <NavLink to="/asistente" className={lc}>Asistente IA</NavLink>
          </div>

          <div className="nav-group">
            <span className="nav-group-label">Sistema</span>
            {esAdmin && <NavLink to="/usuarios" className={lc}>Usuarios</NavLink>}
            <NavLink to="/acerca" className={lc}>Acerca de</NavLink>
          </div>
        </nav>

        <div className="userbox">
          <div className="userbox-id">
            <span className="user-name">{usuario?.nombre}</span>
            <span className={`rol-tag rol-${usuario?.rol}`}>{usuario?.rol}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </aside>

      <div className={`overlay ${abierto ? 'visible' : ''}`} onClick={() => setAbierto(false)} />

      <div className="main">
        <header className="appbar">
          <button className="menu-toggle" aria-label="Abrir menú" aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}>≡</button>
          <Link to="/" className="appbar-brand">BioMed Tools</Link>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          Información de apoyo · verifica siempre contra el manual oficial del fabricante.
        </footer>
      </div>

      {/* Botón flotante al asistente — presente en todas las vistas salvo la propia. */}
      {loc.pathname !== '/asistente' && (
        <Link to="/asistente" className="fab" aria-label="Abrir el asistente IA">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
            <path d="M9.5 10h5M9.5 13h3" />
          </svg>
          <span className="fab-label">Asistente</span>
        </Link>
      )}
    </div>
  );
}
