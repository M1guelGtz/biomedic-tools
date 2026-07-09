// Entidad de dominio: Equipo médico.
// Es POJO puro, sin dependencias de frameworks ni de la base de datos.

export class Equipo {
  constructor({
    id = null,
    nombre,
    modelo = null,
    fabricante = null,
    categoria = null,
    areaId = null,
    areaNombre = null, // solo lectura (viene del JOIN), no se persiste directamente
    descripcion = null,
    imagenUrl = null,
    imagenClave = null,
    creadoEn = null,
    actualizadoEn = null,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.modelo = modelo;
    this.fabricante = fabricante;
    this.categoria = categoria;
    this.areaId = areaId;
    this.areaNombre = areaNombre;
    this.descripcion = descripcion;
    this.imagenUrl = imagenUrl;
    this.imagenClave = imagenClave;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }
}
