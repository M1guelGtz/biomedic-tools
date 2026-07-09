// Configuración de subida de archivos con multer.
// Usa almacenamiento en memoria: el buffer se pasa al caso de uso, que decide
// dónde persistirlo a través del puerto IFileStorage. Así la capa HTTP no
// conoce el disco ni S3.

import multer from 'multer';
import { ValidationError } from '../../../application/errors.js';

const LIMITE_MB = 25;

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new ValidationError('Solo se permiten archivos PDF'));
      return;
    }
    cb(null, true);
  },
}).single('archivo');

/** Traduce los errores de multer a errores de aplicación legibles. */
export function manejarUpload(req, res, next) {
  uploadPdf(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationError(`El archivo supera el límite de ${LIMITE_MB} MB`));
        return;
      }
      next(err);
      return;
    }
    next();
  });
}

// ---- Imágenes (para la foto del equipo) ----
const LIMITE_IMG_MB = 5;
const MIMES_IMG = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const uploadImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_IMG_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!MIMES_IMG.includes(file.mimetype)) {
      cb(new ValidationError('Solo se permiten imágenes PNG, JPG, WEBP o GIF'));
      return;
    }
    cb(null, true);
  },
}).single('imagen');

export function manejarImagen(req, res, next) {
  uploadImagen(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationError(`La imagen supera el límite de ${LIMITE_IMG_MB} MB`));
        return;
      }
      next(err);
      return;
    }
    next();
  });
}
