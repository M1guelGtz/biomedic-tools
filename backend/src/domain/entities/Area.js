// Entidad de dominio: Área (ubicación/servicio del hospital).

export class Area {
  constructor({ id = null, nombre, descripcion = null, creadoEn = null, actualizadoEn = null }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }
}
