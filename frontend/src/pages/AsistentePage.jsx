import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { equiposApi } from '../api/equipos.js';
import { asistenteApi } from '../api/asistente.js';
import Modal from '../components/Modal.jsx';

function fechaCorta(iso) {
  try {
    return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
}

export default function AsistentePage() {
  const [params] = useSearchParams();
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState(params.get('equipo') || '');
  const [pregunta, setPregunta] = useState('');
  const [mensajes, setMensajes] = useState([]); // { rol, texto, fuentes, fuentesWeb }
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false);
  const [modo, setModo] = useState('estricto'); // 'estricto' | 'asesor'
  const [sugerencias, setSugerencias] = useState([]);
  const [plan, setPlan] = useState(null); // { plan, fuentes, fuentesWeb } | 'cargando' | null
  const finRef = useRef(null);

  useEffect(() => {
    equiposApi.listar().then(setEquipos).catch(() => {});
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  async function cargarHistorial() {
    try {
      setHistorial(await asistenteApi.historial(30));
    } catch {
      /* silencioso */
    }
  }

  // Núcleo de la consulta (reutilizable por el form y por los chips).
  async function lanzar(texto) {
    if (!equipoId) {
      setError('Selecciona primero un equipo.');
      return;
    }
    const q = (texto || '').trim();
    if (!q || cargando) return;

    setPregunta('');
    setError(null);
    setSugerencias([]);
    setMensajes((m) => [...m, { rol: 'user', texto: q }, { rol: 'ia', texto: '', fuentes: [] }]);
    setCargando(true);

    const idxIA = (prev) => prev.length - 1;
    let completo = '';
    try {
      const { fuentes, fuentesWeb } = await asistenteApi.consultarStream(
        Number(equipoId),
        q,
        (tok) => {
          completo += tok;
          setMensajes((m) => {
            const copia = [...m];
            copia[idxIA(copia)] = { ...copia[idxIA(copia)], texto: copia[idxIA(copia)].texto + tok };
            return copia;
          });
        },
        modo,
      );
      setMensajes((m) => {
        const copia = [...m];
        copia[idxIA(copia)] = { ...copia[idxIA(copia)], fuentes, fuentesWeb };
        return copia;
      });
      cargarHistorial();
      // Chips de seguimiento (no bloquean ni rompen el flujo).
      asistenteApi.sugerencias(q, completo).then(setSugerencias).catch(() => {});
    } catch (err) {
      setError(err.message);
      setMensajes((m) => {
        const copia = [...m];
        const i = idxIA(copia);
        if (!copia[i].texto) copia[i] = { ...copia[i], texto: '⚠ No se pudo obtener respuesta.' };
        return copia;
      });
    } finally {
      setCargando(false);
    }
  }

  function preguntar(e) {
    e.preventDefault();
    lanzar(pregunta);
  }

  async function generarPlan() {
    if (!equipoId) {
      setError('Selecciona primero un equipo.');
      return;
    }
    setPlan('cargando');
    try {
      setPlan(await asistenteApi.plan(Number(equipoId), modo));
    } catch (err) {
      setPlan(null);
      setError(err.response?.data?.error || 'No se pudo generar el plan.');
    }
  }

  function toggleHistorial() {
    const nuevo = !verHistorial;
    setVerHistorial(nuevo);
    if (nuevo) cargarHistorial();
  }

  const nombreEquipo = equipos.find((eq) => String(eq.id) === String(equipoId))?.nombre;

  return (
    <section className="asistente">
      <div className="asistente-head">
        <h2 className="page-title">Asistente IA</h2>
        <button className="btn btn-sm btn-ghost" onClick={toggleHistorial}>
          {verHistorial ? 'Ocultar historial' : 'Ver historial'}
        </button>
      </div>
      <p className="muted">
        Pregunta sobre mantenimiento, fallas o procedimientos sobre el equipo seleccionado.
      </p>

      <div className="modo-toggle" role="radiogroup" aria-label="Modo del asistente">
        <button type="button" role="radio" aria-checked={modo === 'estricto'}
          className={`modo-opt ${modo === 'estricto' ? 'activo' : ''}`}
          onClick={() => setModo('estricto')}>🔒 Estricto</button>
        <button type="button" role="radio" aria-checked={modo === 'asesor'}
          className={`modo-opt ${modo === 'asesor' ? 'activo' : ''}`}
          onClick={() => setModo('asesor')}>💬 Asesor</button>
      </div>
      <p className="modo-hint muted">
        {modo === 'estricto'
          ? 'Estricto: responde solo con los manuales indexados, citando la fuente.'
          : 'Asesor: añade recomendaciones de buena práctica (criterio propio) e información de internet, además del manual.'}
      </p>

      {verHistorial && (
        <div className="card historial">
          <h3>Tus consultas recientes</h3>
          {historial.length === 0 && <p className="muted">Aún no tienes consultas.</p>}
          <ul>
            {historial.map((h) => (
              <li key={h.id}>
                <div className="hist-q">❓ {h.pregunta}</div>
                <div className="hist-meta">{h.equipoNombre || 'Equipo'} · {fechaCorta(h.creadoEn)}</div>
                <div className="hist-a">{h.respuesta}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="asistente-controls">
        <label>Equipo
          <select value={equipoId} onChange={(e) => { setEquipoId(e.target.value); setMensajes([]); setSugerencias([]); }}>
            <option value="">— Selecciona un equipo —</option>
            {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
          </select>
        </label>
        <button className="btn btn-sm btn-ghost plan-btn" onClick={generarPlan} disabled={!equipoId || plan === 'cargando'}>
          📋 {plan === 'cargando' ? 'Generando plan…' : 'Plan preventivo'}
        </button>
      </div>

      <div className="chat-box">
        {mensajes.length === 0 && (
          <p className="muted chat-empty">
            {equipoId ? `Haz una pregunta sobre "${nombreEquipo}".` : 'Selecciona un equipo para comenzar.'}
          </p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`burbuja ${m.rol === 'user' ? 'burbuja-user' : 'burbuja-ia'}`}>
            <div className="burbuja-texto">
              {m.texto}
              {m.rol === 'ia' && cargando && i === mensajes.length - 1 && <span className="cursor">▋</span>}
            </div>
            {m.fuentes?.length > 0 && (
              <div className="fuentes">
                <strong>📘 Fuentes (manual):</strong>
                <ul>
                  {m.fuentes.map((f) => (
                    <li key={`${f.documentoId}-${f.pagina}`}>[{f.indice}] {f.titulo} — pág. {f.pagina}</li>
                  ))}
                </ul>
              </div>
            )}
            {m.fuentesWeb?.length > 0 && (
              <div className="fuentes fuentes-web">
                <strong>🌐 Fuentes web:</strong>
                <ul>
                  {m.fuentesWeb.map((f, j) => (
                    <li key={j}><a href={f.url} target="_blank" rel="noreferrer noopener">{f.titulo}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        <div ref={finRef} />
      </div>

      {sugerencias.length > 0 && !cargando && (
        <div className="chips" aria-label="Preguntas sugeridas">
          {sugerencias.map((s, i) => (
            <button key={i} className="chip" onClick={() => lanzar(s)}>{s}</button>
          ))}
        </div>
      )}

      {error && <p className="err">⚠ {error}</p>}

      <form className="chat-input" onSubmit={preguntar}>
        <input
          value={pregunta}
          placeholder="Ej: ¿cómo inicio un mantenimiento preventivo?"
          onChange={(e) => setPregunta(e.target.value)}
          disabled={!equipoId || cargando}
        />
        <button className="btn btn-primary" disabled={!equipoId || cargando}>Enviar</button>
      </form>

      <p className="disclaimer">
        ⚕️ Información de apoyo generada por IA. Verifica siempre contra el manual oficial del
        fabricante antes de cualquier intervención.
      </p>

      {plan && plan !== 'cargando' && (
        <Modal titulo={`Plan de mantenimiento — ${nombreEquipo || 'Equipo'}`} onClose={() => setPlan(null)}>
          <div className="plan-actions">
            <button className="btn btn-sm btn-ghost"
              onClick={() => navigator.clipboard?.writeText(plan.plan)}>📋 Copiar</button>
          </div>
          <div className="plan-texto">{plan.plan}</div>
          {plan.fuentesWeb?.length > 0 && (
            <div className="fuentes fuentes-web">
              <strong>🌐 Fuentes web:</strong>
              <ul>
                {plan.fuentesWeb.map((f, i) => (
                  <li key={i}><a href={f.url} target="_blank" rel="noreferrer noopener">{f.titulo}</a></li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
