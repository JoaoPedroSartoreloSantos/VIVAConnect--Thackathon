/**
 * High-performance client-side image compressor for mobile and desktop OCR.
 * Resizes large smartphone camera photos (e.g., 12MP-48MP, 15MB+) to an optimal
 * resolution (max 1600px) and ~250-400KB JPEG in milliseconds.
 */
export async function compressImageForOcr(
  dataUrlOrFile: string | File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let objectUrlToRevoke: string | null = null;

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
            return;
          }

          // Clear white background for receipts/prescriptions
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Falha no canvas de compressão, usando original:', canvasErr);
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
        }
      };

      img.onerror = () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      };

      if (typeof dataUrlOrFile === 'string') {
        img.src = dataUrlOrFile;
      } else {
        objectUrlToRevoke = URL.createObjectURL(dataUrlOrFile);
        img.src = objectUrlToRevoke;
      }
    } catch (err) {
      console.warn('Erro ao inicializar compressão de imagem:', err);
      resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
    }
  });
}
