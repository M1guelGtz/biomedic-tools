import { useEffect, useState } from 'react';
import { areasApi } from '../api/areas.js';
import Modal from '../components/Modal.jsx';

const VACIO = { nombre: '', descripcion: '' };

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    try {
      setAreas(await areasApi.listar());
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNueva() { setEditId(null); setForm(VACIO); setError(null); setModalAbierto(true); }
  function editar(a) { setEditId(a.id); setForm({ nombre: a.nombre || '', descripcion: a.descripcion || '' }); setError(null); setModalAbierto(true); }
  function cerrar() { setModalAbierto(false); setEditId(null); setForm(VACIO); }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editId) await areasApi.actualizar(editId, form);
      else await areasApi.crear(form);
      cerrar();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta área? Los equipos quedarán sin área (no se borran).')) return;
    try {
      await areasApi.eliminar(id);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h2 className="page-title">Áreas</h2>
        <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva área</button>
      </div>
      <p className="muted">Ubicaciones o servicios del hospital (UCI, Quirófano, Laboratorio…). Asigna equipos a un área al darlos de alta.</p>

      {error && !modalAbierto && <p className="err">⚠ {error}</p>}

      <table className="docs-table">
        <thead>
          <tr><th>Área</th><th>Descripción</th><th>Equipos</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {areas.map((a) => (
            <tr key={a.id}>
              <td>{a.nombre}</td>
              <td className="muted">{a.descripcion || '—'}</td>
              <td><span className="tag">{a.totalEquipos ?? 0}</span></td>
              <td className="doc-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => editar(a)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => eliminar(a.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {areas.length === 0 && (
            <tr><td colSpan="4" className="muted">No hay áreas todavía. Crea la primera con “+ Nueva área”.</td></tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo={editId ? 'Editar área' : 'Nueva área'} onClose={cerrar}>
          <form onSubmit={guardar}>
            <label>Nombre *
              <input value={form.nombre} required autoFocus
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label>Descripción
              <textarea rows="2" value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            {error && <p className="err">⚠ {error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editId ? 'Actualizar' : 'Crear área'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
