import { usuarioDTO } from '../dto/usuarioDTO.js';

export function authController({ authUseCases }) {
  return {
    async login(req, res) {
      const { token, usuario } = await authUseCases.login(req.body);
      res.json({ token, usuario: usuarioDTO(usuario) });
    },

    async me(req, res) {
      // req.user viene del middleware authenticate.
      const usuario = await authUseCases.obtenerPerfil(req.user.id);
      res.json(usuarioDTO(usuario));
    },

    async crearUsuario(req, res) {
      const usuario = await authUseCases.crearUsuario(req.body);
      res.status(201).json(usuarioDTO(usuario));
    },

    async listarUsuarios(req, res) {
      const usuarios = await authUseCases.listarUsuarios();
      res.json(usuarios.map(usuarioDTO));
    },
  };
}
