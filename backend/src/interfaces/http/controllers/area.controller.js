import { areaDTO } from '../dto/serializers.js';

export function areaController({ areaUseCases }) {
  return {
    async listar(req, res) {
      const areas = await areaUseCases.listar();
      res.json(areas.map(areaDTO));
    },

    async crear(req, res) {
      const area = await areaUseCases.crear(req.body);
      res.status(201).json(areaDTO(area));
    },

    async actualizar(req, res) {
      const area = await areaUseCases.actualizar(Number(req.params.id), req.body);
      res.json(areaDTO(area));
    },

    async eliminar(req, res) {
      await areaUseCases.eliminar(Number(req.params.id));
      res.status(204).send();
    },
  };
}
