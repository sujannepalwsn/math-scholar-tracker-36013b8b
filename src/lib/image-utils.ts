/**
 * Compresses an image file to a target size in KB.
 * @param file The image file to compress
 * @param targetSizeKB The target size in KB (e.g., 100)
 * @param maxWidth The maximum width of the output image
 * @param maxHeight The maximum height of the output image
 * @returns A promise that resolves to the compressed Blob
 */
export async function compressImage(
  file: File,
  targetSizeKB: number = 100,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<Blob | File> {
  // If file is already smaller than target, return it as is
  if (file.size <= targetSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality and decrease until size is met
        let quality = 0.9;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas toBlob failed"));
                return;
              }

              if (blob.size <= targetSizeKB * 1024 || quality <= 0.1) {
                resolve(blob);
              } else {
                quality -= 0.1;
                compress();
              }
            },
            'image/jpeg',
            quality
          );
        };

        compress();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
