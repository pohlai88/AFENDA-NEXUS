'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateProfileAction } from '../actions/portal.actions';
import { Loader2 } from 'lucide-react';
import type { PortalSupplier } from '../queries/portal.queries';

interface PortalProfileFormProps {
  supplier: PortalSupplier;
}

export function PortalProfileForm({ supplier }: PortalProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [supplierName, setSupplierName] = useState(supplier.supplierName);
  const [taxId, setTaxId] = useState(supplier.taxId ?? '');
  const [remittanceEmail, setRemittanceEmail] = useState(supplier.remittanceEmail ?? '');

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!supplierName) {
      setError('Supplier name is required.');
      return;
    }

    startTransition(async () => {
      const result = await updateProfileAction(supplier.supplierId, {
        supplierName,
        taxId: taxId || null,
        remittanceEmail: remittanceEmail || null,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Profile updated successfully.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supplierName">Supplier Name</Label>
            <Input
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input
              id="taxId"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="Tax identification number"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="remittanceEmail">Remittance Email</Label>
            <Input
              id="remittanceEmail"
              type="email"
              value={remittanceEmail}
              onChange={(e) => setRemittanceEmail(e.target.value)}
              placeholder="accounts@supplier.com"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
