// Casos de uso de autenticación y gestión de usuarios.
// Depende de puertos: repositorio de usuarios, hasher y servicio de tokens.

import { Usuario } from '../../domain/entities/Usuario.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../errors.js';

const ROLES_VALIDOS = ['admin', 'tecnico'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuthUseCases({ usuarioRepo, passwordHasher, tokenService }) {
  /** Construye el payload del token a partir del usuario. */
  function payloadDe(usuario) {
    return { sub: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
  }

  return {
    /** Verifica credenciales y devuelve { token, usuario }. */
    login: async ({ email, password }) => {
      if (!email || !password) {
        throw new ValidationError('Email y contraseña son obligatorios');
      }
      const usuario = await usuarioRepo.obtenerPorEmail(email.trim().toLowerCase());
      // Mensaje genérico para no revelar si el email existe.
      if (!usuario || !usuario.activo) {
        throw new UnauthorizedError('Credenciales inválidas');
      }
      const ok = await passwordHasher.comparar(password, usuario.passwordHash);
      if (!ok) {
        throw new UnauthorizedError('Credenciales inválidas');
      }
      const token = tokenService.firmar(payloadDe(usuario));
      return { token, usuario };
    },

    /** Crea un usuario (acción reservada a admin en la capa HTTP). */
    crearUsuario: async ({ nombre, email, password, rol = 'tecnico' }) => {
      if (!nombre?.trim() || !email?.trim() || !password) {
        throw new ValidationError('Nombre, email y contraseña son obligatorios');
      }
      if (!EMAIL_RE.test(email)) {
        throw new ValidationError('El email no tiene un formato válido');
      }
      if (password.length < 6) {
        throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
      }
      if (!ROLES_VALIDOS.includes(rol)) {
        throw new ValidationError(`Rol inválido. Use: ${ROLES_VALIDOS.join(', ')}`);
      }
      const emailNorm = email.trim().toLowerCase();
      if (await usuarioRepo.obtenerPorEmail(emailNorm)) {
        throw new ConflictError('Ya existe un usuario con ese email');
      }
      const passwordHash = await passwordHasher.hash(password);
      return usuarioRepo.crear(
        new Usuario({ nombre: nombre.trim(), email: emailNorm, passwordHash, rol }),
      );
    },

    listarUsuarios: () => usuarioRepo.listar(),

    obtenerPerfil: (id) => usuarioRepo.obtenerPorId(id),
  };
}
