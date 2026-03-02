// /app/middleware/upload-validation.ts
import { NextRequest } from 'next/server';

export function validateUpload(request: NextRequest) {
  // Vérifier la taille totale des fichiers
  const contentLength = request.headers.get('content-length');
  const maxSize = 50 * 1024 * 1024; // 50MB total
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error('La taille totale des fichiers dépasse 50MB');
  }
  
}