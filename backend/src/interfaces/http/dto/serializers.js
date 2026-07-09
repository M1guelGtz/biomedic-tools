// Serializadores: convierten entidades de dominio en la forma JSON que ve el
// cliente. Aquí se decide qué campos se exponen (p.ej. NO exponemos
// archivo_clave, que es interno del storage).

export function equipoDTO(e) {
  return {
    id: e.id,
    nombre: e.nombre,
    modelo: e.modelo,
    fabricante: e.fabricante,
    categoria: e.categoria,
    areaId: e.areaId ?? null,
    areaNombre: e.areaNombre ?? null,
    descripcion: e.descripcion,
    // URL pública de la imagen (o null si no tiene). El binario se sirve aparte.
    imagenUrl: e.imagenClave ? `/api/equipos/${e.id}/imagen` : null,
    creadoEn: e.creadoEn,
    actualizadoEn: e.actualizadoEn,
  };
}

export function areaDTO(a) {
  return {
    id: a.id,
    nombre: a.nombre,
    descripcion: a.descripcion,
    totalEquipos: a.totalEquipos ?? undefined,
    creadoEn: a.creadoEn,
  };
}

export function documentoDTO(d) {
  return {
    id: d.id,
    equipoId: d.equipoId,
    titulo: d.titulo,
    tipo: d.tipo,
    nombreOriginal: d.nombreOriginal,
    tamanoBytes: d.tamanoBytes,
    paginas: d.paginas,
    estadoIndexado: d.estadoIndexado,
    creadoEn: d.creadoEn,
    // URL para descargar/visualizar el PDF (no exponemos la clave interna).
    downloadUrl: `/api/documentos/${d.id}/download`,
  };
}

// Para listados globales (Manuales / Normativas): incluye el nombre del equipo.
export function documentoListadoDTO(d) {
  return {
    ...documentoDTO(d),
    equipoNombre: d.equipoNombre ?? null,
  };
}
