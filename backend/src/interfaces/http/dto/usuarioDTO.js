// Serializa un usuario ocultando SIEMPRE el password_hash.
export function usuarioDTO(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    creadoEn: u.creadoEn,
  };
}
