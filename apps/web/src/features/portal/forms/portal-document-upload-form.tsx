'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadDocumentAction } from '../actions/portal.actions';
import { Loader2, Upload } from 'lucide-react';

interface PortalDocumentUploadFormProps {
  supplierId: string;
}

export function PortalDocumentUploadForm({ supplierId }: PortalDocumentUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [mimeType, setMimeType] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      setFileContent(base64);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!title || !category || !fileName || !fileContent) {
      setError('Title, category, and file are required.');
      return;
    }

    startTransition(async () => {
      const result = await uploadDocumentAction(supplierId, {
        title,
        category,
        fileName,
        mimeType,
        content: fileContent,
        expiresAt: expiresAt || undefined,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
      setTitle('');
      setCategory('');
      setExpiresAt('');
      setFileName('');
      setFileContent('');
      setMimeType('');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Document uploaded successfully.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="docTitle">Title</Label>
            <Input
              id="docTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tax Clearance Certificate"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docCategory">Category</Label>
            <Input
              id="docCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="TAX_CLEARANCE"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docExpires">Expires (optional)</Label>
            <Input
              id="docExpires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docFile">File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="docFile"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            { fileName ? <p className="text-xs text-muted-foreground">{fileName}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
