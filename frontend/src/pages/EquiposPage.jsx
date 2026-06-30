import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equiposApi } from '../api/equipos.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Modal from '../components/Modal.jsx';

const VACIO = { nombre: '', modelo: '', fabricante: '', categoria: '', descripcion: '' };

export default function EquiposPage() {
  const { esAdmin } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      setEquipos(await equiposApi.listar());
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirNuevo() {
    setEditId(null);
    setForm(VACIO);
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
      descripcion: eq.descripcion || '',
    });
    setError(null);
    setModalAbierto(true);
  }

  function cerrar() {
    setModalAbierto(false);
    setEditId(null);
    setForm(VACIO);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editId) await equiposApi.actualizar(editId, form);
      else await equiposApi.crear(form);
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

      {cargando ? (
        <p>Cargando equipos…</p>
      ) : (
        <div className="equipos-grid">
          {equipos.map((eq) => (
            <div className="card equipo-card" key={eq.id}>
              <div className="equipo-cat">{eq.categoria || 'Sin categoría'}</div>
              <h3>{eq.nombre}</h3>
              <p className="muted">
                {[eq.fabricante, eq.modelo].filter(Boolean).join(' · ') || '—'}
              </p>
              {eq.descripcion && <p className="equipo-desc">{eq.descripcion}</p>}
              <div className="equipo-actions">
                <Link to={`/equipos/${eq.id}`} className="btn btn-sm btn-primary">Documentos</Link>
                {esAdmin && <button className="btn btn-sm btn-ghost" onClick={() => editar(eq)}>Editar</button>}
                {esAdmin && <button className="btn btn-sm btn-danger" onClick={() => eliminar(eq.id)}>Eliminar</button>}
              </div>
            </div>
          ))}
          {equipos.length === 0 && (
            <p className="muted">No hay equipos todavía. {esAdmin && 'Crea el primero con “+ Nuevo equipo”.'}</p>
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
                <input value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
              </label>
            </div>
            <label>Descripción
              <textarea rows="3" value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
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
