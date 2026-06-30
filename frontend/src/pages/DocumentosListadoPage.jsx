import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentosApi } from '../api/documentos.js';

const PAGE_SIZE = 10;

function formatoTamano(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Página genérica usada por Manuales (manual + datasheet) y Normativas (normativa).
// Paginación y búsqueda en el servidor.
export default function DocumentosListadoPage({ titulo, tipos, descripcion }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Al cambiar de sección (tipos), volver a la página 1.
  useEffect(() => {
    setPage(1);
    setBusqueda('');
  }, [tipos]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    documentosApi
      .listarTodos({ tipo: tipos.join(','), q: busqueda.trim(), page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!activo) return;
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((e) => activo && setError(e.response?.data?.error || e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [tipos, busqueda, page]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section>
      <h2 className="page-title">{titulo}</h2>
      <p className="muted">{descripcion}</p>

      <input
        className="buscador"
        placeholder="Buscar por título o equipo…"
        value={busqueda}
        onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
      />

      {error && <p className="err">⚠ {error}</p>}
      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <>
          <table className="docs-table">
            <thead>
              <tr><th>Título</th><th>Equipo</th><th>Tipo</th><th>Tamaño</th><th>Ver</th></tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.titulo}</td>
                  <td><Link to={`/equipos/${d.equipoId}`}>{d.equipoNombre}</Link></td>
                  <td><span className="tag">{d.tipo}</span></td>
                  <td>{formatoTamano(d.tamanoBytes)}</td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => documentosApi.abrir(d.id)}>Ver</button></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="5" className="muted">No hay documentos para mostrar.</td></tr>
              )}
            </tbody>
          </table>

          <div className="paginacion">
            <button className="btn btn-sm btn-ghost" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}>← Anterior</button>
            <span className="pag-info">
              Página {page} de {totalPaginas} · {total} documento{total === 1 ? '' : 's'}
            </span>
            <button className="btn btn-sm btn-ghost" disabled={page >= totalPaginas}
              onClick={() => setPage((p) => p + 1)}>Siguiente →</button>
          </div>
        </>
      )}
    </section>
  );
}
