import multer from 'multer';
import path from 'path';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'gestion-documental');

/** Extensión → mimetypes aceptados. Mismo set que el HTML de referencia (gdCargarArchivoDoc). */
const ALLOWED: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.doc':  ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls':  ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

/** Firma de bytes (magic number) real de cada extensión — el nombre/mimetype que manda el cliente no se puede confiar. */
const MAGIC_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  '.pdf':  buf => buf.subarray(0, 4).toString('latin1') === '%PDF',
  '.png':  buf => buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.jpg':  buf => buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  '.jpeg': buf => buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  // .doc/.xls legado (OLE compound file) comparten la misma firma
  '.doc':  buf => buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  '.xls':  buf => buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  // .docx/.xlsx son ZIP (Office Open XML)
  '.docx': buf => buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  '.xlsx': buf => buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
};

export function isAllowedFile(originalname: string, mime: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  const mimes = ALLOWED[ext];
  return !!mimes && mimes.includes(mime);
}

/** Verifica que el contenido real del archivo coincida con la extensión declarada (evita spoofing de nombre/Content-Type). */
export function matchesMagicBytes(originalname: string, buffer: Buffer): boolean {
  const ext = path.extname(originalname).toLowerCase();
  const check = MAGIC_CHECKS[ext];
  return !!check && check(buffer);
}

export function docDir(recordId: string, docId: string): string {
  return path.join(UPLOAD_ROOT, recordId, docId);
}

/** archivoId ya fue resuelto contra la metadata guardada — nunca se construye desde input crudo sin validar. */
export function archivoFilePath(recordId: string, docId: string, archivoId: string, nombre: string): string {
  const ext = path.extname(nombre).toLowerCase();
  return path.join(docDir(recordId, docId), `${archivoId}${ext}`);
}

// memoryStorage a propósito: el contenido se valida por magic bytes ANTES de escribir nada a disco (ver routes.ts).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedFile(file.originalname, file.mimetype)) {
      cb(new Error('Tipo de archivo no permitido. Usa PDF, JPG, PNG, DOC/DOCX o XLS/XLSX.'));
      return;
    }
    cb(null, true);
  },
});
