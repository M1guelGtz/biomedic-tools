// Entidad de dominio: Usuario.
// El password_hash nunca debe salir hacia la capa HTTP; se filtra en los DTOs.

export class Usuario {
  constructor({
    id = null,
    nombre,
    email,
    passwordHash = null,
    rol = 'tecnico', // admin | tecnico
    activo = true,
    creadoEn = null,
    actualizadoEn = null,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.activo = activo;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }

  esAdmin() {
    return this.rol === 'admin';
  }
}
