// Controlador de Documentos.

import { documentoDTO, documentoListadoDTO } from '../dto/serializers.js';

export function documentoController({ documentoUseCases }) {
  return {
    async listarPorEquipo(req, res) {
      const docs = await documentoUseCases.listarPorEquipo(Number(req.params.id));
      res.json(docs.map(documentoDTO));
    },

    async listarTodos(req, res) {
      // ?tipo=manual,datasheet  &q=texto  &page=1  &pageSize=10
      const tipos = req.query.tipo
        ? String(req.query.tipo).split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const { items, total, page, pageSize } = await documentoUseCases.listarTodos({
        tipos,
        q: req.query.q || '',
        page: req.query.page,
        pageSize: req.query.pageSize,
      });
      res.json({ items: items.map(documentoListadoDTO), total, page, pageSize });
    },

    async subir(req, res) {
      const doc = await documentoUseCases.subir(Number(req.params.id), req.file, {
        titulo: req.body?.titulo,
        tipo: req.body?.tipo,
      });
      res.status(201).json(documentoDTO(doc));
    },

    async descargar(req, res) {
      const { documento, buffer } = await documentoUseCases.descargar(Number(req.params.id));
      res.setHeader('Content-Type', documento.mimeType);
      // inline -> se visualiza en el navegador; el nombre se usa si se descarga.
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(documento.nombreOriginal || 'documento.pdf')}"`,
      );
      res.send(buffer);
    },

    async eliminar(req, res) {
      await documentoUseCases.eliminar(Number(req.params.id));
      res.status(204).send();
    },

    async reindexar(req, res) {
      await documentoUseCases.reindexar(Number(req.params.id));
      res.status(202).json({ mensaje: 'Reindexado iniciado' });
    },
  };
}
