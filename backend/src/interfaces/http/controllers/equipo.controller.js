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
  };
}
