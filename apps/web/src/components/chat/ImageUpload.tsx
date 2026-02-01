'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon, X, AlertCircle, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  botId: string;
  conversationId: string;
  onUploadComplete: (mediaUploadId: string, ocrResultId: string) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function ImageUpload({ botId, conversationId, onUploadComplete, onCancel }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('botId', botId);

      setProgress(30);

      const uploadResponse = await fetch('/api/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const mediaUploadId = uploadData.mediaUploadId;

      setProgress(60);
      setUploading(false);
      setProcessing(true);

      // Step 2: Process with OCR
      const processResponse = await fetch('/api/ocr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUploadId,
          provider: 'google-vision', // or 'tesseract'
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const processData = await processResponse.json();
      const ocrResultId = processData.ocrResultId;

      setProgress(100);

      // Call completion callback
      onUploadComplete(mediaUploadId, ocrResultId);
    } catch (err) {
      console.error('Upload/OCR error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(0);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="max-w-2xl w-full bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald" />
          <h3 className="text-lg font-semibold text-charcoal">Upload Image for OCR</h3>
        </div>
        <button onClick={onCancel} className="text-muted-gray hover:text-charcoal">
          ✕
        </button>
      </div>

      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-muted-gray mx-auto mb-3" />
            <p className="text-charcoal font-medium mb-1">
              Drag and drop your image here
            </p>
            <p className="text-sm text-muted-gray mb-4">or click to browse</p>
            <Button variant="outline" className="pointer-events-none">
              Choose File
            </Button>
            <p className="text-xs text-muted-gray mt-4">
              Supported: JPEG, PNG, GIF, WebP • Maximum: 5MB
            </p>
          </div>
        )}

        {/* Preview */}
        {file && preview && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-slate-100">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              {!uploading && !processing && (
                <button
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-slate-50"
                >
                  <X className="w-4 h-4 text-charcoal" />
                </button>
              )}
            </div>

            {/* File Info */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-emerald" />
                <div>
                  <p className="text-sm font-medium text-charcoal">{file.name}</p>
                  <p className="text-xs text-muted-gray">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {(uploading || processing) && (
                <Loader2 className="w-5 h-5 text-emerald animate-spin" />
              )}
            </div>

            {/* Progress Bar */}
            {(uploading || processing) && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-charcoal font-medium">
                    {uploading ? 'Uploading...' : 'Processing with OCR...'}
                  </span>
                  <span className="text-muted-gray">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            {!uploading && !processing && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>What happens next:</strong>
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Your image will be uploaded securely</li>
                  <li>Text will be extracted using OCR technology</li>
                  <li>We'll search for matches in your knowledge base</li>
                  <li>You'll see results with match scores</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              handleFileSelect(selectedFile);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={uploading || processing}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || processing}
          className="bg-emerald hover:bg-emerald/90 text-white"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
