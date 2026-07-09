import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { equiposApi } from '../api/equipos.js';
import { areasApi } from '../api/areas.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Modal from '../components/Modal.jsx';

const VACIO = { nombre: '', modelo: '', fabricante: '', categoria: '', areaId: '', descripcion: '' };

export default function EquiposPage() {
  const { esAdmin } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [filtroArea, setFiltroArea] = useState(''); // '' = todas · 'sin' = sin área · id

  async function cargar() {
    setCargando(true);
    try {
      const [eqs, ars] = await Promise.all([equiposApi.listar(), areasApi.listar().catch(() => [])]);
      setEquipos(eqs);
      setAreas(ars);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  // Categorías ya usadas, para el datalist (consistencia sin obligar).
  const categorias = useMemo(
    () => [...new Set(equipos.map((e) => e.categoria).filter(Boolean))].sort(),
    [equipos],
  );

  // Equipos visibles según el filtro de área.
  const visibles = useMemo(() => {
    if (!filtroArea) return equipos;
    if (filtroArea === 'sin') return equipos.filter((e) => !e.areaId);
    return equipos.filter((e) => String(e.areaId) === filtroArea);
  }, [equipos, filtroArea]);

  function abrirNuevo() {
    setEditId(null);
    setForm(VACIO);
    setImagenFile(null);
    setImagenPreview(null);
    setError(null);
    setModalAbierto(true);
  }

  function editar(eq) {
    setEditId(eq.id);
    setForm({
      nombre: eq.nombre || '',
      modelo: eq.modelo || '',
      fabricante: eq.fabricante || '',
      categoria: eq.categoria || '',
      areaId: eq.areaId ? String(eq.areaId) : '',
      descripcion: eq.descripcion || '',
    });
    setImagenFile(null);
    setImagenPreview(eq.imagenUrl ? equiposApi.imagenSrc(eq) : null);
    setError(null);
    setModalAbierto(true);
  }

  function cerrar() {
    setModalAbierto(false);
    setEditId(null);
    setForm(VACIO);
    setImagenFile(null);
    setImagenPreview(null);
  }

  function elegirImagen(e) {
    const f = e.target.files[0];
    setImagenFile(f || null);
    setImagenPreview(f ? URL.createObjectURL(f) : null);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const eq = editId
        ? await equiposApi.actualizar(editId, form)
        : await equiposApi.crear(form);
      // Si se eligió una imagen nueva, súbela después de crear/actualizar.
      if (imagenFile) await equiposApi.subirImagen(eq.id, imagenFile);
      cerrar();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este equipo y todos sus documentos?')) return;
    try {
      await equiposApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h2 className="page-title">Equipos médicos</h2>
        {esAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo equipo</button>}
      </div>

      {error && !modalAbierto && <p className="err">⚠ {error}</p>}

      <div className="filtro-bar">
        <label className="filtro-area">Área
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            <option value="sin">Sin área</option>
          </select>
        </label>
        <span className="muted filtro-conteo">
          {visibles.length} {visibles.length === 1 ? 'equipo' : 'equipos'}
        </span>
      </div>

      {cargando ? (
        <p>Cargando equipos…</p>
      ) : (
        <div className="equipos-grid">
          {visibles.map((eq) => (
            <div className="card equipo-card" key={eq.id}>
              <div className="equipo-thumb-wrap">
                {eq.imagenUrl
                  ? <img className="equipo-thumb" src={equiposApi.imagenSrc(eq)} alt={eq.nombre} loading="lazy" />
                  : <div className="equipo-thumb equipo-thumb-vacio">sin imagen</div>}
              </div>
              <div className="equipo-cat">{eq.categoria || 'Sin categoría'}</div>
              <h3>{eq.nombre}</h3>
              <p className="muted">{[eq.fabricante, eq.modelo].filter(Boolean).join(' · ') || '—'}</p>
              {eq.areaNombre && <div className="equipo-area">📍 {eq.areaNombre}</div>}
              {eq.descripcion && <p className="equipo-desc">{eq.descripcion}</p>}
              <div className="equipo-actions">
                <Link to={`/equipos/${eq.id}`} className="btn btn-sm btn-primary">Documentos</Link>
                {esAdmin && <button className="btn btn-sm btn-ghost" onClick={() => editar(eq)}>Editar</button>}
                {esAdmin && <button className="btn btn-sm btn-danger" onClick={() => eliminar(eq.id)}>Eliminar</button>}
              </div>
            </div>
          ))}
          {visibles.length === 0 && (
            <p className="muted">
              {equipos.length === 0
                ? <>No hay equipos todavía. {esAdmin && 'Crea el primero con “+ Nuevo equipo”.'}</>
                : 'Ningún equipo en esta área.'}
            </p>
          )}
        </div>
      )}

      {modalAbierto && (
        <Modal titulo={editId ? 'Editar equipo' : 'Nuevo equipo'} onClose={cerrar}>
          <form onSubmit={guardar}>
            <div className="grid-2">
              <label>Nombre *
                <input value={form.nombre} required autoFocus
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label>Modelo
                <input value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
              </label>
              <label>Fabricante
                <input value={form.fabricante}
                  onChange={(e) => setForm({ ...form, fabricante: e.target.value })} />
              </label>
              <label>Categoría
                <input list="categorias-lista" value={form.categoria}
                  placeholder="Ej: Monitoreo, Laboratorio…"
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                <datalist id="categorias-lista">
                  {categorias.map((c) => <option key={c} value={c} />)}
                </datalist>
              </label>
              <label>Área
                <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
                  <option value="">— Sin área —</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </label>
              <label>Imagen (opcional)
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={elegirImagen} />
              </label>
            </div>

            {imagenPreview && (
              <div className="img-preview-wrap">
                <img className="img-preview" src={imagenPreview} alt="Vista previa" />
              </div>
            )}

            <label>Descripción
              <textarea rows="3" value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>

            {areas.length === 0 && (
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                ¿No hay áreas? Créalas en la sección <strong>Áreas</strong>.
              </p>
            )}
            {error && <p className="err">⚠ {error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editId ? 'Actualizar' : 'Crear equipo'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
