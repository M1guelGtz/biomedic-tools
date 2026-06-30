import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equiposApi } from '../api/equipos.js';

// Código de instrumento por categoría (mono) — en vez de emoji.
const COD_CAT = {
  Monitoreo: 'MON', Laboratorio: 'LAB', Quirófano: 'QX',
  Diagnóstico: 'DX', Terapia: 'TER', Imagenología: 'IMG',
};
const codigo = (cat) => COD_CAT[cat] || (cat ? cat.slice(0, 3).toUpperCase() : 'EQ');

// Iconos de línea (sin emoji): heredan el color del contenedor.
const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const CARACTERISTICAS = [
  {
    titulo: 'Repositorio por equipo',
    texto: 'Sube manuales, datasheets y normativas; quedan organizados por equipo y versionados.',
    icon: <Icono d={<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>} />,
  },
  {
    titulo: 'Responde con tus PDFs',
    texto: 'El asistente RAG contesta solo con la documentación del equipo seleccionado. No improvisa.',
    icon: <Icono d={<><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></>} />,
  },
  {
    titulo: 'Cita la página exacta',
    texto: 'Cada respuesta indica documento y página de origen, para verificar en segundos.',
    icon: <Icono d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>} />,
  },
  {
    titulo: 'Roles y trazabilidad',
    texto: 'Admin gestiona; técnico consulta. Cada consulta al asistente queda registrada.',
    icon: <Icono d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>} />,
  },
];

export default function HomePage() {
  const [equipos, setEquipos] = useState([]);

  useEffect(() => {
    equiposApi.listar().then((d) => setEquipos(d.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <span className="eyebrow">Repositorio técnico · Asistente RAG</span>
        <h1>El manual de cada equipo, y un asistente que cita la página.</h1>
        <p className="subtitle">
          Centraliza la documentación de tus equipos médicos y pregunta en lenguaje natural:
          el asistente responde solo con tus manuales e indica de qué documento y página lo sacó.
        </p>
        <div className="cta-row">
          <Link to="/equipos" className="btn btn-primary">Ver equipos</Link>
          <Link to="/asistente" className="btn btn-ghost">Abrir asistente</Link>
        </div>
      </section>

      <section className="seccion">
        <h2 className="seccion-titulo">Equipos en el repositorio</h2>
        <div className="destacados-grid">
          {equipos.map((eq) => (
            <Link to={`/equipos/${eq.id}`} className="destacado-card" key={eq.id}>
              <div className="destacado-icono">{codigo(eq.categoria)}</div>
              <div className="destacado-nombre">{eq.nombre}</div>
              <div className="destacado-cat">{eq.categoria || 'Equipo médico'}</div>
            </Link>
          ))}
          {equipos.length === 0 && (
            <p className="muted">Aún no hay equipos. Crea el primero en la sección Equipos.</p>
          )}
        </div>
      </section>

      <section className="seccion">
        <h2 className="seccion-titulo">Cómo ayuda</h2>
        <div className="features-grid">
          {CARACTERISTICAS.map((c) => (
            <div className="feature-card" key={c.titulo}>
              <div className="feature-icon">{c.icon}</div>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
