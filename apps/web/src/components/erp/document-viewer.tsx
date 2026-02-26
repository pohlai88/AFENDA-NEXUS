'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  File,
  FileSpreadsheet,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface DocumentViewerProps {
  files: DocumentFile[];
  selectedIndex?: number;
  onClose?: () => void;
  open?: boolean;
  side?: 'left' | 'right';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return FileSpreadsheet;
  }
  return File;
}

function isPreviewable(type: string): boolean {
  return type.startsWith('image/') || type === 'application/pdf';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Image Viewer ────────────────────────────────────────────────────────────

function ImageViewer({ file, zoom, rotation }: { file: DocumentFile; zoom: number; rotation: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-muted/50">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Image className="h-12 w-12" />
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={file.url}
          alt={file.name}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}

// ─── PDF Viewer ──────────────────────────────────────────────────────────────

function PDFViewer({ file }: { file: DocumentFile }) {
  return (
    <iframe
      src={`${file.url}#toolbar=0&navpanes=0`}
      title={file.name}
      className="h-full w-full border-0"
    />
  );
}

// ─── File Info Panel ─────────────────────────────────────────────────────────

function FileInfoPanel({ file }: { file: DocumentFile }) {
  const FileIcon = getFileIcon(file.type);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded bg-muted p-3">
          <FileIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{file.type}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {file.size && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        )}
        {file.uploadedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uploaded</span>
            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
          </div>
        )}
        {file.uploadedBy && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">By</span>
            <span>{file.uploadedBy}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <a href={file.url} download={file.name}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open in new tab</span>
          </a>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DocumentViewer({
  files,
  selectedIndex = 0,
  onClose,
  open = true,
  side = 'right',
}: DocumentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentFile = files[currentIndex];
  const canPreview = currentFile && isPreviewable(currentFile.type);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(files.length - 1, prev + 1));
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.25, prev - 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  if (files.length === 0 || !currentFile) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <SheetContent side={side} className="w-full sm:max-w-lg lg:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="truncate pr-4">{currentFile.name}</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Navigation & controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous file</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {files.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next file</span>
              </Button>
            </div>

            {canPreview && currentFile.type.startsWith('image/') && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.25}>
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Zoom out</span>
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom in</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                  <span className="sr-only">Rotate</span>
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2 w-fit">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            {canPreview ? (
              currentFile.type === 'application/pdf' ? (
                <PDFViewer file={currentFile} />
              ) : (
                <ImageViewer file={currentFile} zoom={zoom} rotation={rotation} />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="rounded-full bg-muted p-4">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Preview not available</p>
                  <p className="text-sm text-muted-foreground">
                    Download the file to view its contents
                  </p>
                </div>
                <Button asChild>
                  <a href={currentFile.url} download={currentFile.name}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="flex-1 m-0 overflow-auto">
            <ScrollArea className="h-full">
              <FileInfoPanel file={currentFile} />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* File thumbnails */}
        {files.length > 1 && (
          <div className="border-t p-2">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <button
                      type="button"
                      key={file.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setZoom(1);
                        setRotation(0);
                      }}
                      className={cn(
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded border transition-colors',
                        index === currentIndex
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      )}
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Attachments Panel ───────────────────────────────────────────────────────

interface AttachmentsPanelProps {
  files: DocumentFile[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  canEdit?: boolean;
  className?: string;
}

export function AttachmentsPanel({
  files,
  onUpload,
  onDelete,
  canEdit = false,
  className,
}: AttachmentsPanelProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* File list */}
      {files.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <File className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No attachments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => openViewer(index)}
              >
                <div className="rounded bg-muted p-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer */}
      <DocumentViewer
        files={files}
        selectedIndex={selectedIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
