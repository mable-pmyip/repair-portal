/**
 * Compresses an image file to reduce its size before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width of the compressed image (default: 1920)
 * @param maxHeight - Maximum height of the compressed image (default: 1080)
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Compressed image as a Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple images
 * @param files - Array of image files to compress
 * @param onProgress - Optional callback for progress updates (index, total)
 * @returns Array of compressed image blobs with original filenames
 */
export async function compressImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ blob: Blob; filename: string }>> {
  const compressed: Array<{ blob: Blob; filename: string }> = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Only compress if it's an image
    if (file.type.startsWith('image/')) {
      try {
        const blob = await compressImage(file);
        compressed.push({ blob, filename: file.name });
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // If compression fails, use original file
        compressed.push({ blob: file, filename: file.name });
      }
    } else {
      compressed.push({ blob: file, filename: file.name });
    }
  }
  
  return compressed;
}
