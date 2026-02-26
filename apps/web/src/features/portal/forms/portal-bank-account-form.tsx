'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addBankAccountAction } from '../actions/portal.actions';
import { Loader2 } from 'lucide-react';

interface PortalBankAccountFormProps {
  supplierId: string;
}

export function PortalBankAccountForm({ supplierId }: PortalBankAccountFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [isPrimary, setIsPrimary] = useState(false);

  function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!bankName || !accountName || !accountNumber || !currencyCode) {
      setError('Bank name, account name, account number, and currency are required.');
      return;
    }

    startTransition(async () => {
      const result = await addBankAccountAction(supplierId, {
        bankName,
        accountName,
        accountNumber,
        iban: iban || undefined,
        swiftBic: swiftBic || undefined,
        currencyCode,
        isPrimary,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      setIban('');
      setSwiftBic('');
      setCurrencyCode('USD');
      setIsPrimary(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Bank Account</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Bank account added successfully.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="First National Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Business Account"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency</Label>
            <Input
              id="currencyCode"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
              placeholder="USD"
              maxLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (optional)</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="GB82 WEST 1234 5698 7654 32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="swiftBic">SWIFT/BIC (optional)</Label>
            <Input
              id="swiftBic"
              value={swiftBic}
              onChange={(e) => setSwiftBic(e.target.value)}
              placeholder="WESTZZ1234"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Switch id="isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
          <Label htmlFor="isPrimary">Set as primary account</Label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
