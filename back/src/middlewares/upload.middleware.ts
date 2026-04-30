import multer from 'multer';

/**
 * Middleware de subida de archivos configurado con memoryStorage.
 * El archivo no toca el disco local: el buffer se envía directo a Supabase.
 * - Límite: 10 MB por archivo
 * - Solo acepta archivos de tipo imagen (image/*)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

export default upload;
