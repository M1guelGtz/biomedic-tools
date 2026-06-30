import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/equipos');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={enviar}>
        <div className="brand login-brand">⏚ BioMed Tools</div>
        <h2>Iniciar sesión</h2>
        <label>Email
          <input type="email" value={email} required autoFocus
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Contraseña
          <input type="password" value={password} required
            onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="err">⚠ {error}</p>}
        <button className="btn btn-primary login-btn" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
