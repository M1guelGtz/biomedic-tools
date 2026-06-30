export default function AcercaPage() {
  return (
    <section className="acerca">
      <h2 className="page-title">Acerca de BioMed Tools</h2>
      <p>
        <strong>BioMed Tools</strong> es una plataforma para centralizar la documentación
        técnica de equipos médicos (manuales, datasheets y normativas) y consultarla
        mediante un asistente de IA especializado en ingeniería biomédica.
      </p>

      <div className="acerca-grid">
        <div className="card">
          <h3>🗄️ Repositorio</h3>
          <p>Sube y organiza los manuales por equipo. Los archivos se guardan de forma
          segura y se indexan automáticamente para el asistente.</p>
        </div>
        <div className="card">
          <h3>🤖 Asistente con RAG</h3>
          <p>El asistente responde <em>solo</em> con la información de los manuales del
          equipo seleccionado y cita la fuente (documento y página). No inventa.</p>
        </div>
        <div className="card">
          <h3>🔐 Roles</h3>
          <p><strong>Admin</strong>: gestiona equipos, documentos y usuarios.
          <strong> Técnico</strong>: consulta el repositorio y el asistente.</p>
        </div>
        <div className="card">
          <h3>⚕️ Uso responsable</h3>
          <p>La información es de apoyo. Verifica siempre contra el manual oficial del
          fabricante y los protocolos clínicos antes de cualquier intervención.</p>
        </div>
      </div>

      <p className="muted acerca-pie">
        Proyecto desarrollado para estudiantes e ingenieros de Ingeniería Biomédica.
      </p>
    </section>
  );
}
