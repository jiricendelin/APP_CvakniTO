"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  updateInvoiceHeaderAction,
  type InvoiceActionState,
} from "@/app/(app)/invoices/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { CsrfField } from "@/components/csrf-field";
import { formatPragueDate, formatPragueDateForInput } from "@/lib/time/format-prague";

type CustomerOption = { id: string; name: string };

export function InvoiceHeaderCard({
  csrf,
  invoiceId,
  dueDate,
  customer,
  customers,
  editable,
}: {
  csrf: string;
  invoiceId: string;
  dueDate: Date;
  customer: { id: string; name: string; ico: string; dic: string; address: string };
  customers: CustomerOption[];
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<InvoiceActionState, FormData>(
    updateInvoiceHeaderAction,
    {}
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card className="bg-background">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Odběratel</CardTitle>
        {editable && (
          <Button variant="ghost" size="icon" title="Upravit" onClick={() => setOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="font-medium">{customer.name}</p>
        {customer.address && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {customer.address}
          </p>
        )}
        {(customer.ico || customer.dic) && (
          <p className="text-sm text-muted-foreground">
            {customer.ico ? `IČO ${customer.ico}` : ""}
            {customer.dic ? ` · DIČ ${customer.dic}` : ""}
          </p>
        )}
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Splatnost</dt>
            <dd>{formatPragueDate(dueDate)}</dd>
          </div>
        </dl>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit fakturu</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <CsrfField token={csrf} />
            <input type="hidden" name="id" value={invoiceId} />

            <div className="space-y-2">
              <Label htmlFor="customerId">Zákazník *</Label>
              <NativeSelect
                id="customerId"
                name="customerId"
                defaultValue={customer.id}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Splatnost</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={formatPragueDateForInput(dueDate)}
              />
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Zrušit
              </Button>
              <SubmitButton>Uložit</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
