// Entidad de dominio: Documento (metadatos de un PDF).
// El archivo binario NO vive aquí; solo la "clave" para localizarlo en el storage.

export class Documento {
  constructor({
    id = null,
    equipoId,
    titulo,
    tipo = 'manual', // manual | datasheet | normativa | otro
    archivoClave,
    nombreOriginal = null,
    mimeType = 'application/pdf',
    tamanoBytes = null,
    hashSha256 = null,
    paginas = null,
    estadoIndexado = 'pendiente', // pendiente | procesando | indexado | error
    subidoPor = null,
    creadoEn = null,
    actualizadoEn = null,
  }) {
    this.id = id;
    this.equipoId = equipoId;
    this.titulo = titulo;
    this.tipo = tipo;
    this.archivoClave = archivoClave;
    this.nombreOriginal = nombreOriginal;
    this.mimeType = mimeType;
    this.tamanoBytes = tamanoBytes;
    this.hashSha256 = hashSha256;
    this.paginas = paginas;
    this.estadoIndexado = estadoIndexado;
    this.subidoPor = subidoPor;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }
}
