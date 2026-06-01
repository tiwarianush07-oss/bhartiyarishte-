/**
 * compressImage — client-side compression before Supabase storage upload.
 * Uses HTMLCanvasElement to resize and re-encode. Returns a File blob.
 *
 * @param file       The original File from an <input type="file">
 * @param maxPx      Max width OR height in pixels (default 800)
 * @param quality    JPEG quality 0–1 (default 0.82)
 */
export async function compressImage(
  file: File,
  maxPx = 800,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Compute new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width = maxPx;
        } else {
          width = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob returned null'));
          // Preserve original filename but mark as jpeg
          const outName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], outName, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
