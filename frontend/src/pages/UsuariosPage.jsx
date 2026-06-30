import { useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import Modal from '../components/Modal.jsx';

const VACIO = { nombre: '', email: '', password: '', rol: 'tecnico' };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargar() {
    try {
      setUsuarios(await authApi.listarUsuarios());
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrir() {
    setForm(VACIO);
    setError(null);
    setModalAbierto(true);
  }

  function cerrar() {
    setModalAbierto(false);
    setForm(VACIO);
  }

  async function crear(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await authApi.crearUsuario(form);
      cerrar();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <h2 className="page-title">Usuarios</h2>
        <button className="btn btn-primary" onClick={abrir}>+ Nuevo usuario</button>
      </div>

      {error && !modalAbierto && <p className="err">⚠ {error}</p>}

      <table className="docs-table">
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td><span className={`rol-tag rol-${u.rol}`}>{u.rol}</span></td>
              <td>{u.activo ? 'activo' : 'inactivo'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo="Nuevo usuario" onClose={cerrar}>
          <form onSubmit={crear}>
            <div className="grid-2">
              <label>Nombre *
                <input value={form.nombre} required autoFocus
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label>Email *
                <input type="email" value={form.email} required
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>Contraseña * (mín. 6)
                <input type="password" value={form.password} required minLength={6}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <label>Rol
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="tecnico">técnico</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            {error && <p className="err">⚠ {error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Creando…' : 'Crear usuario'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
