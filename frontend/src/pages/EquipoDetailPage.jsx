import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { equiposApi } from '../api/equipos.js';
import { documentosApi } from '../api/documentos.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Modal from '../components/Modal.jsx';

const TIPOS = ['manual', 'datasheet', 'normativa', 'otro'];

function formatoTamano(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function EquipoDetailPage() {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const [equipo, setEquipo] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('manual');
  const [subiendo, setSubiendo] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargar() {
    try {
      const [eq, ds] = await Promise.all([
        equiposApi.obtener(id),
        documentosApi.listarPorEquipo(id),
      ]);
      setEquipo(eq);
      setDocs(ds);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirSubida() {
    setArchivo(null);
    setTitulo('');
    setTipo('manual');
    setError(null);
    setModalAbierto(true);
  }

  function cerrarSubida() {
    setModalAbierto(false);
    setArchivo(null);
    setTitulo('');
    setTipo('manual');
  }

  async function subir(e) {
    e.preventDefault();
    if (!archivo) {
      setError('Selecciona un archivo PDF');
      return;
    }
    setSubiendo(true);
    try {
      await documentosApi.subir(id, { archivo, titulo, tipo });
      cerrarSubida();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminarDoc(docId) {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      await documentosApi.eliminar(docId);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function reindexar(docId) {
    try {
      await documentosApi.reindexar(docId);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  if (!equipo) {
    return (
      <section>
        <Link to="/equipos" className="back-link">← Volver a equipos</Link>
        {error ? <p className="err">⚠ {error}</p> : <p>Cargando…</p>}
      </section>
    );
  }

  return (
    <section>
      <Link to="/equipos" className="back-link">← Volver a equipos</Link>
      <h2 className="page-title">{equipo.nombre}</h2>
      <p className="muted">
        {[equipo.fabricante, equipo.modelo, equipo.categoria].filter(Boolean).join(' · ') || '—'}
      </p>
      {equipo.descripcion && <p>{equipo.descripcion}</p>}

      {error && !modalAbierto && <p className="err">⚠ {error}</p>}

      <div className="docs-header">
        <h3 className="page-subtitle">Documentos ({docs.length})</h3>
        <div className="doc-actions">
          <button className="btn btn-sm btn-ghost" onClick={cargar}>↻ Actualizar estado</button>
          {esAdmin && <button className="btn btn-sm btn-primary" onClick={abrirSubida}>+ Subir documento</button>}
        </div>
      </div>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Título</th><th>Tipo</th><th>Tamaño</th><th>Estado IA</th><th>{esAdmin ? 'Acciones' : 'Ver'}</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>{d.titulo}</td>
              <td><span className="tag">{d.tipo}</span></td>
              <td>{formatoTamano(d.tamanoBytes)}</td>
              <td><span className={`estado estado-${d.estadoIndexado}`}>{d.estadoIndexado}</span></td>
              <td className="doc-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => documentosApi.abrir(d.id)}>Ver</button>
                {esAdmin && <button className="btn btn-sm btn-ghost" onClick={() => reindexar(d.id)}>Reindexar</button>}
                {esAdmin && <button className="btn btn-sm btn-danger" onClick={() => eliminarDoc(d.id)}>Eliminar</button>}
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr><td colSpan="5" className="muted">
              Sin documentos.{esAdmin && ' Usa “+ Subir documento”.'}
            </td></tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo="Subir documento (PDF)" onClose={cerrarSubida}>
          <form onSubmit={subir}>
            <label>Archivo PDF *
              <input type="file" accept="application/pdf"
                onChange={(e) => setArchivo(e.target.files[0])} />
            </label>
            <div className="grid-2">
              <label>Título
                <input value={titulo} placeholder="(por defecto: nombre del archivo)"
                  onChange={(e) => setTitulo(e.target.value)} />
              </label>
              <label>Tipo
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            {error && <p className="err">⚠ {error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={subiendo}>
                {subiendo ? 'Subiendo…' : 'Subir PDF'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cerrarSubida}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
