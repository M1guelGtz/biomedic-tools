// Extrae el texto de un PDF, página por página, para poder citar la página
// de origen en las respuestas del asistente.
//
// Importamos el archivo interno de pdf-parse (no el index.js) porque el index
// ejecuta código de depuración que falla al importarse como módulo ESM.

import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export class PdfTextExtractor {
  /**
   * @param {Buffer} buffer
   * @returns {Promise<{ paginas: string[], totalPaginas: number }>}
   */
  async extraer(buffer) {
    const paginas = [];

    await pdfParse(buffer, {
      // Se llama por cada página, en orden; acumulamos su texto.
      pagerender: (pageData) =>
        pageData.getTextContent().then((tc) => {
          const texto = tc.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
          paginas.push(texto);
          return texto;
        }),
    });

    return { paginas, totalPaginas: paginas.length };
  }
}
