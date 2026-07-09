// Controlador de Equipos. Delgado: parsea la petición, llama al caso de uso
// y serializa la respuesta. La lógica vive en application/.

import { equipoDTO } from '../dto/serializers.js';

export function equipoController({ equipoUseCases }) {
  return {
    async listar(req, res) {
      const equipos = await equipoUseCases.listar();
      res.json(equipos.map(equipoDTO));
    },

    async obtener(req, res) {
      const equipo = await equipoUseCases.obtener(Number(req.params.id));
      res.json(equipoDTO(equipo));
    },

    async crear(req, res) {
      const equipo = await equipoUseCases.crear(req.body);
      res.status(201).json(equipoDTO(equipo));
    },

    async actualizar(req, res) {
      const equipo = await equipoUseCases.actualizar(Number(req.params.id), req.body);
      res.json(equipoDTO(equipo));
    },

    async eliminar(req, res) {
      await equipoUseCases.eliminar(Number(req.params.id));
      res.status(204).send();
    },

    async subirImagen(req, res) {
      const equipo = await equipoUseCases.subirImagen(Number(req.params.id), req.file);
      res.status(201).json(equipoDTO(equipo));
    },

    // Sirve la imagen del equipo (pública, para poder usarla en <img src>).
    async servirImagen(req, res) {
      const { buffer, mimeType } = await equipoUseCases.obtenerImagen(Number(req.params.id));
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=300');
      // El frontend (:8090) y la API (:4000) son orígenes distintos; sin esto,
      // helmet pone CORP=same-origin y el navegador bloquea la imagen en <img>.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.send(buffer);
    },
  };
}
