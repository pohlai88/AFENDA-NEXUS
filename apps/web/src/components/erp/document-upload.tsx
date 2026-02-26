'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, File, X, FileText, Image, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
  /** Raw File for form submit (when not uploaded to storage) */
  file?: File;
}

interface DocumentUploadProps {
  onUpload: (files: File[]) => Promise<UploadedFile[]>;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  className?: string;
}

// ─── File Icon Helper ────────────────────────────────────────────────────────

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return FileSpreadsheet;
  }
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Default Accept Types ────────────────────────────────────────────────────

const defaultAccept = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function DocumentUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = defaultAccept,
  disabled = false,
  className,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const errors = rejection.errors.map((err) => err.message).join(', ');
        toast.error(`${rejection.file.name}: ${errors}`);
      });

      if (acceptedFiles.length === 0) return;

      // Create placeholders for uploading files
      const uploadingFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading' as const,
      }));

      setFiles((prev) => [...prev, ...uploadingFiles]);
      setIsUploading(true);

      try {
        const uploaded = await onUpload(acceptedFiles);
        
        setFiles((prev) =>
          prev.map((f) => {
            if (f.status === 'uploading') {
              const match = uploaded.find((u) => u.name === f.name);
              return match ?? { ...f, status: 'error' as const, error: 'Upload failed' };
            }
            return f;
          })
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: 'Upload failed' }
              : f
          )
        );
        toast.error('Failed to upload files');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
    disabled: disabled || isUploading,
    noClick: false,
    noKeyboard: false,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm font-medium">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground">
                PDF, images, Excel/CSV up to {formatFileSize(maxSize)} each
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3',
                  file.status === 'error' && 'border-destructive bg-destructive/5'
                )}
              >
                <div className="rounded bg-muted p-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  {file.status === 'uploading' && file.progress !== undefined && (
                    <Progress value={file.progress} className="mt-1 h-1" />
                  )}
                  {file.status === 'error' && file.error && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{file.error}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
