// Entidad de dominio: Equipo médico.
// Es POJO puro, sin dependencias de frameworks ni de la base de datos.

export class Equipo {
  constructor({
    id = null,
    nombre,
    modelo = null,
    fabricante = null,
    categoria = null,
    descripcion = null,
    imagenUrl = null,
    creadoEn = null,
    actualizadoEn = null,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.modelo = modelo;
    this.fabricante = fabricante;
    this.categoria = categoria;
    this.descripcion = descripcion;
    this.imagenUrl = imagenUrl;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }
}
