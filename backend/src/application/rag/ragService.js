// =====================================================================
//  Servicio RAG (Retrieval-Augmented Generation).
//  Orquesta el pipeline completo a través de PUERTOS (no conoce Gemini,
//  Qdrant ni pdf-parse directamente):
//
//   Indexar:  PDF -> texto por página -> chunks -> embeddings -> Qdrant
//   Consultar: pregunta -> embedding -> búsqueda filtrada por equipo
//              -> prompt con contexto -> modelo de chat -> respuesta + citas
// =====================================================================

import { randomUUID } from 'node:crypto';
import { ValidationError } from '../errors.js';

// Modo ESTRICTO: solo responde con los manuales. Ideal para procedimientos críticos.
const PROMPT_ESTRICTO = `Eres un asistente técnico para ingenieros biomédicos. Respondes preguntas
sobre equipos médicos (mantenimiento, fallas, procedimientos) USANDO ÚNICAMENTE el contexto
extraído de los manuales que se te proporciona.

Reglas:
- Responde solo con información presente en el CONTEXTO. Si el contexto no contiene la respuesta,
  dilo claramente: "No encuentro esa información en los manuales disponibles de este equipo."
- NO inventes procedimientos, valores ni números de parte.
- Cita la fuente entre corchetes al final de cada afirmación relevante, p. ej. [Fuente 1].
- Sé conciso y técnico. Responde en español.
- Recuerda al usuario verificar siempre contra el manual oficial cuando la acción sea crítica.`;

// Modo ASESOR: usa el manual como fuente primaria PERO puede dar recomendaciones
// de buena práctica con su criterio, etiquetando claramente qué es del manual y
// qué es opinión. Respuesta estructurada por secciones.
const PROMPT_ASESOR = `Eres un asistente técnico senior para ingenieros biomédicos. Ayudas con
mantenimiento, diagnóstico de fallas y procedimientos de equipos médicos.

El CONTEXTO de los manuales es tu fuente PRIMARIA y autoritativa. Además puedes aportar
recomendaciones de buena práctica de ingeniería biomédica con tu criterio.

Estructura SIEMPRE la respuesta con estas secciones (omite una sección si no aplica):
📘 Según el manual — lo que indican los documentos, citando [Fuente n]. Si el contexto no lo cubre, dilo.
🧠 Recomendación — tu criterio y buenas prácticas. Deja claro que es recomendación, no del manual.
🌐 Referencias web — si usaste búsqueda en internet, resume lo encontrado y aclara que son fuentes EXTERNAS (no el manual). Las URLs se listan aparte automáticamente.
⚠️ Precaución — riesgos, seguridad eléctrica/del paciente, y cuándo escalar al fabricante o a un especialista.

Reglas:
- Jerarquía de confianza: manual del equipo > buenas prácticas/estándares > información web general.
- Si el manual y otra fuente difieren, PRIORIZA el manual y adviértelo.
- No inventes valores, números de parte ni procedimientos específicos como si fueran del manual.
- Si no hay manuales indexados para el equipo, dilo y responde con criterio general + web, marcándolo.
- Sé claro y técnico. Responde en español.`;

/** Selecciona el system prompt según el modo ('asesor' | 'estricto'). */
function sistemaPara(modo) {
  return modo === 'asesor' ? PROMPT_ASESOR : PROMPT_ESTRICTO;
}

// Prompt para generar un plan de mantenimiento preventivo estructurado.
const PROMPT_PLAN = `Eres un ingeniero biomédico. Genera un PLAN DE MANTENIMIENTO PREVENTIVO claro y
accionable para el equipo, basándote en el CONTEXTO de los manuales y en buenas prácticas.

Formato:
- Agrupa las tareas por frecuencia: Por uso/Diario, Mensual, Trimestral, Semestral, Anual.
- En cada tarea di qué hacer; si es crítica para la seguridad, márcala con ⚠️.
- Incluye, cuando apliquen: inspección visual, limpieza, pruebas funcionales, seguridad eléctrica y calibración.
- Cita [Fuente n] cuando la tarea provenga del manual; marca "(buena práctica)" lo que sea criterio propio.
- Si usaste internet, menciona la norma/estándar aplicable (p. ej. IEC 60601, IEC 62353).
- Cierra con una nota breve de seguridad y cuándo escalar al fabricante.
Responde en español, conciso y en formato de lista.`;

// Prompt para sugerir preguntas de seguimiento.
const PROMPT_SUGERENCIAS = `Eres un asistente técnico biomédico. A partir de la conversación, propón
preguntas de seguimiento útiles. Devuelve EXACTAMENTE 3 preguntas, una por línea, sin numeración,
sin viñetas y sin ningún otro texto. Deben ser cortas, concretas y en español.`;

/** Convierte el texto del modelo en una lista limpia de hasta 3 sugerencias. */
function parsearSugerencias(texto) {
  return (texto || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function createRagService({
  documentoRepo,
  chunkRepo,
  consultaRepo,
  fileStorage,
  pdfExtractor,
  embeddingProvider,
  vectorStore,
  chatModel,
  ragConfig,
  webGrounding = true, // permite que el modo Asesor busque en internet
}) {
  /** Parte un texto en fragmentos con solapamiento. */
  function trocear(texto, size, overlap) {
    const chunks = [];
    let i = 0;
    while (i < texto.length) {
      const fragmento = texto.slice(i, i + size).trim();
      if (fragmento) chunks.push(fragmento);
      i += size - overlap;
    }
    return chunks;
  }

  /**
   * Recupera los fragmentos relevantes de un equipo para una pregunta.
   * Compartido por consultar() y consultarStream().
   */
  async function recuperar(equipoId, pregunta) {
    const [qVector] = await embeddingProvider.embeber([pregunta], { tipo: 'consulta' });
    const hits = await vectorStore.buscar(qVector, { equipoId, topK: ragConfig.topK });

    const contexto = hits
      .map(
        (h, i) =>
          `[Fuente ${i + 1}] (${h.payload.documentoTitulo}, pág. ${h.payload.pagina})\n${h.payload.texto}`,
      )
      .join('\n\n');

    // Fuentes únicas por documento + página.
    const vistas = new Set();
    const fuentes = [];
    hits.forEach((h, i) => {
      const clave = `${h.payload.documentoId}-${h.payload.pagina}`;
      if (!vistas.has(clave)) {
        vistas.add(clave);
        fuentes.push({
          indice: i + 1,
          documentoId: h.payload.documentoId,
          titulo: h.payload.documentoTitulo,
          pagina: h.payload.pagina,
        });
      }
    });

    return { hits, contexto, fuentes };
  }

  const SIN_INFO =
    'No encuentro información indexada para este equipo. Sube manuales (PDF) y espera a que se procesen.';

  return {
    /** Crea la colección de vectores si no existe. */
    init: () => vectorStore.asegurarColeccion(),

    /**
     * Indexa un documento ya guardado. Pensado para correr en segundo plano.
     * Actualiza el estado_indexado del documento según avanza.
     */
    indexar: async (documento) => {
      try {
        await documentoRepo.actualizarEstadoIndexado(documento.id, 'procesando');

        const buffer = await fileStorage.leer(documento.archivoClave);
        const { paginas, totalPaginas } = await pdfExtractor.extraer(buffer);

        // Construir chunks con su número de página.
        const items = [];
        paginas.forEach((textoPagina, idx) => {
          const trozos = trocear(textoPagina, ragConfig.chunkSize, ragConfig.chunkOverlap);
          trozos.forEach((texto) => items.push({ texto, pagina: idx + 1 }));
        });

        if (items.length === 0) {
          // PDF sin texto extraíble (probablemente escaneado / solo imágenes).
          await documentoRepo.actualizarEstadoIndexado(documento.id, 'error');
          console.warn(`[RAG] Documento ${documento.id} sin texto extraíble (¿PDF escaneado?).`);
          return;
        }

        // Embeddings de todos los chunks.
        const vectores = await embeddingProvider.embeber(
          items.map((it) => it.texto),
          { tipo: 'documento' },
        );

        // Puntos para Qdrant + filas de trazabilidad para MySQL.
        const puntos = [];
        const filas = [];
        items.forEach((it, i) => {
          const pointId = randomUUID();
          puntos.push({
            id: pointId,
            vector: vectores[i],
            payload: {
              equipoId: documento.equipoId,
              documentoId: documento.id,
              documentoTitulo: documento.titulo,
              pagina: it.pagina,
              indiceChunk: i,
              texto: it.texto,
            },
          });
          filas.push({
            documentoId: documento.id,
            equipoId: documento.equipoId,
            qdrantPointId: pointId,
            indiceChunk: i,
            pagina: it.pagina,
          });
        });

        await vectorStore.upsert(puntos);
        await chunkRepo.crearMuchos(filas);
        await documentoRepo.actualizarIndexado(documento.id, 'indexado', totalPaginas);
        console.log(`[RAG] Documento ${documento.id} indexado: ${items.length} chunks.`);
      } catch (err) {
        await documentoRepo.actualizarEstadoIndexado(documento.id, 'error').catch(() => {});
        console.error(`[RAG] Error indexando documento ${documento.id}:`, err.message);
      }
    },

    /** Borra el índice de un documento (vectores + filas de chunks). */
    eliminarIndice: async (documentoId) => {
      await vectorStore.eliminarPorDocumento(documentoId).catch(() => {});
      await chunkRepo.eliminarPorDocumento(documentoId).catch(() => {});
    },

    /** Reindexa: borra el índice anterior y vuelve a indexar. */
    reindexar: async (documentoId) => {
      const documento = await documentoRepo.obtenerPorId(documentoId);
      if (!documento) throw new ValidationError('Documento no encontrado');
      await vectorStore.eliminarPorDocumento(documentoId).catch(() => {});
      await chunkRepo.eliminarPorDocumento(documentoId).catch(() => {});
      // No esperamos: indexado en segundo plano.
      return documento;
    },

    /**
     * Responde una pregunta sobre un equipo usando RAG.
     * @returns {Promise<{ respuesta:string, fuentes:Array }>}
     */
    consultar: async ({ equipoId, pregunta, usuarioId, modo = 'estricto' }) => {
      if (!pregunta || !pregunta.trim()) {
        throw new ValidationError('La pregunta no puede estar vacía');
      }

      const { hits, contexto, fuentes } = await recuperar(equipoId, pregunta);
      // Modo estricto sin manual: no responde. Modo asesor sí (con criterio general).
      if (hits.length === 0 && modo !== 'asesor') {
        return { respuesta: SIN_INFO, fuentes: [], fuentesWeb: [] };
      }

      const ctx = hits.length ? contexto : '(No hay manuales indexados para este equipo.)';
      const prompt = `CONTEXTO:\n${ctx}\n\nPREGUNTA: ${pregunta}`;
      const web = modo === 'asesor' && webGrounding;
      let fuentesWeb = [];

      const respuesta = await chatModel.generar({
        system: sistemaPara(modo),
        prompt,
        web,
        onFuentesWeb: (f) => { fuentesWeb = f; },
      });

      await consultaRepo
        .registrar({ equipoId, usuarioId, pregunta, respuesta, fuentes })
        .catch(() => {});

      return { respuesta, fuentes, fuentesWeb };
    },

    /**
     * Igual que consultar() pero en streaming: llama onToken(texto) por cada
     * fragmento. Devuelve la respuesta completa y las fuentes al terminar.
     */
    consultarStream: async ({ equipoId, pregunta, usuarioId, modo = 'estricto', onToken }) => {
      if (!pregunta || !pregunta.trim()) {
        throw new ValidationError('La pregunta no puede estar vacía');
      }

      const { hits, contexto, fuentes } = await recuperar(equipoId, pregunta);
      if (hits.length === 0 && modo !== 'asesor') {
        onToken(SIN_INFO);
        return { respuesta: SIN_INFO, fuentes: [], fuentesWeb: [] };
      }

      const ctx = hits.length ? contexto : '(No hay manuales indexados para este equipo.)';
      const prompt = `CONTEXTO:\n${ctx}\n\nPREGUNTA: ${pregunta}`;
      const system = sistemaPara(modo);
      const web = modo === 'asesor' && webGrounding;
      let fuentesWeb = [];
      const onFuentesWeb = (f) => { fuentesWeb = f; };
      let respuesta = '';

      if (typeof chatModel.generarStream === 'function') {
        for await (const tok of chatModel.generarStream({ system, prompt, web, onFuentesWeb })) {
          respuesta += tok;
          onToken(tok);
        }
      } else {
        // Fallback: el adaptador no soporta streaming.
        respuesta = await chatModel.generar({ system, prompt, web, onFuentesWeb });
        onToken(respuesta);
      }

      await consultaRepo
        .registrar({ equipoId, usuarioId, pregunta, respuesta, fuentes })
        .catch(() => {});

      return { respuesta, fuentes, fuentesWeb };
    },

    /**
     * Genera un plan de mantenimiento preventivo del equipo (manual + web si Asesor).
     * @returns {Promise<{ plan:string, fuentes:Array, fuentesWeb:Array }>}
     */
    generarPlan: async ({ equipoId, modo = 'asesor' }) => {
      const consulta =
        'mantenimiento preventivo: inspección, limpieza, pruebas funcionales, seguridad eléctrica, calibración y frecuencias';
      const { hits, contexto, fuentes } = await recuperar(equipoId, consulta);

      const ctx = hits.length ? contexto : '(No hay manuales indexados para este equipo.)';
      const prompt = `CONTEXTO (manuales):\n${ctx}\n\nGenera el plan de mantenimiento preventivo del equipo.`;
      const web = modo === 'asesor' && webGrounding;
      let fuentesWeb = [];

      const plan = await chatModel.generar({
        system: PROMPT_PLAN,
        prompt,
        temperature: 0.3,
        web,
        onFuentesWeb: (f) => { fuentesWeb = f; },
      });

      return { plan, fuentes, fuentesWeb };
    },

    /**
     * Sugiere hasta 3 preguntas de seguimiento a partir de la última interacción.
     * @returns {Promise<string[]>}
     */
    sugerencias: async ({ pregunta, respuesta }) => {
      const prompt = `Pregunta del usuario: "${pregunta}"\nRespuesta dada: "${(respuesta || '').slice(0, 800)}"`;
      try {
        const texto = await chatModel.generar({ system: PROMPT_SUGERENCIAS, prompt, temperature: 0.4 });
        return parsearSugerencias(texto);
      } catch {
        return []; // las sugerencias son un extra: nunca rompen el flujo
      }
    },

    /** Historial de consultas del usuario (paginado). */
    historial: ({ usuarioId, limit = 20, offset = 0 }) =>
      consultaRepo.listarPorUsuario(usuarioId, { limit, offset }),
  };
}
