import React, { useRef, useState } from "react";
import { UploadedImage } from "../types.ts";
import { processImageFile, formatFileSize } from "../lib/image.ts";
import {
  UploadCloud,
  X,
} from "lucide-react";

interface ImageUploaderProps {
  images: UploadedImage[];
  onAddImages: (newImages: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  onError,
  disabled,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = 6;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      onError(`You can upload a maximum of ${maxImages} images.`);
      return;
    }

    setIsProcessing(true);
    try {
      const processed: UploadedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          onError(`File "${file.name}" is not an image.`);
          continue;
        }
        const img = await processImageFile(file, 1280);
        processed.push(img);
      }
      if (processed.length > 0) {
        onAddImages(processed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing image file";
      onError(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && images.length < maxImages) {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
            : "border-slate-300 dark:border-neutral-800 hover:border-violet-500 dark:hover:border-violet-400 bg-slate-50/70 dark:bg-neutral-900/40 hover:bg-slate-100 dark:hover:bg-neutral-900/70"
        } ${disabled || images.length >= maxImages ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold theme-text-main">
              Drop event photos or slides
            </span>
            <span className="text-xs theme-text-sub"> or click to browse</span>
          </div>
          <div className="text-[10px] theme-text-muted font-mono">
            JPG, PNG, WebP • Auto-resized to 1280px • ({images.length}/{maxImages})
          </div>
        </div>
      </div>

      {/* Image Thumbnails with notes from analysis */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="group relative rounded-lg border theme-border theme-panel overflow-hidden flex flex-col shadow-sm"
            >
              <div className="relative aspect-video w-full bg-black overflow-hidden">
                <img
                  src={img.dataUrl}
                  alt={img.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(img.id);
                  }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>

                <span className="absolute bottom-1 left-1.5 text-[9px] font-mono font-bold bg-black/70 text-neutral-300 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  #{idx + 1}
                </span>
              </div>

              {/* Analysis Note if available */}
              {img.analysisNote ? (
                <div className="p-1.5 text-[10px] theme-subpanel border-t theme-border space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-medium capitalize">
                      {img.analysisNote.bestUseFor}
                    </span>
                  </div>
                  <p className="theme-text-sub line-clamp-2 leading-tight">
                    {img.analysisNote.description}
                  </p>
                </div>
              ) : (
                <div className="p-1.5 text-[10px] theme-text-muted font-mono truncate flex items-center justify-between">
                  <span className="truncate max-w-[80px]">{img.fileName}</span>
                  <span>{formatFileSize(img.fileSize)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
