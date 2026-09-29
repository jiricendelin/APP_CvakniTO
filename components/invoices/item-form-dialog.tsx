"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addInvoiceItemAction,
  updateInvoiceItemAction,
  type InvoiceActionState,
} from "@/app/(app)/invoices/actions";
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
import { PRICE_CATEGORIES, PRICE_CATEGORY_LABELS } from "@/lib/pricelist/categories";

export type InvoiceItemRow = {
  id: string;
  name: string;
  quantity: number;
  priceCents: number;
  category: string;
};

export function ItemFormDialog({
  csrf,
  invoiceId,
  item,
  trigger,
}: {
  csrf: string;
  invoiceId: string;
  item?: InvoiceItemRow;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!item;
  const action = isEdit ? updateInvoiceItemAction : addInvoiceItemAction;
  const [state, formAction] = useActionState<InvoiceActionState, FormData>(
    action,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upravit položku" : "Nová položka"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <CsrfField token={csrf} />
          <input type="hidden" name="invoiceId" value={invoiceId} />
          {isEdit && <input type="hidden" name="itemId" value={item.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Název *</Label>
            <Input id="name" name="name" defaultValue={item?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Množství *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={item?.quantity ?? 1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Cena za MJ (Kč) *</Label>
              <Input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                placeholder="např. 450,00"
                defaultValue={
                  item ? (item.priceCents / 100).toFixed(2).replace(".", ",") : ""
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <NativeSelect
              id="category"
              name="category"
              defaultValue={item?.category ?? "ostatni"}
            >
              {PRICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {PRICE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </NativeSelect>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <SubmitButton>{isEdit ? "Uložit" : "Přidat"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
