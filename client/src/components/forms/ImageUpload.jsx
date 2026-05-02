import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiPhotograph, HiX } from 'react-icons/hi';

export default function ImageUpload({ file, preview, onFileChange, onClear }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      onFileChange(f, URL.createObjectURL(f));
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-primary-300 dark:border-primary-700">
          <img src={preview} alt="Preview" className="w-full h-56 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center h-56 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
            }`}
        >
          <input {...getInputProps()} />
          <HiPhotograph className="w-10 h-10 text-surface-400 mb-2" />
          <p className="text-sm text-surface-500 font-medium">
            {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-surface-400 mt-1">JPEG, PNG or WebP (max 5MB)</p>
        </div>
      )}
    </div>
  );
}
