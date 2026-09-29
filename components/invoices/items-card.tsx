"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { deleteInvoiceItemAction } from "@/app/(app)/invoices/actions";
import { ItemFormDialog, type InvoiceItemRow } from "./item-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/lib/auth/csrf-shared";
import { formatCzk } from "@/lib/money";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";

export function ItemsCard({
  csrf,
  invoiceId,
  items,
  totalCents,
  editable,
}: {
  csrf: string;
  invoiceId: string;
  items: InvoiceItemRow[];
  totalCents: number;
  editable: boolean;
}) {
  return (
    <Card className="bg-background">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Položky</CardTitle>
        {editable && (
          <ItemFormDialog
            csrf={csrf}
            invoiceId={invoiceId}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
                Položka
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné položky.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Název</TableHead>
                <TableHead className="text-right">Množství</TableHead>
                <TableHead className="text-right">Cena/MJ</TableHead>
                <TableHead className="text-right">Celkem</TableHead>
                {editable && <TableHead className="text-right">Akce</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    {it.name}
                    <p className="text-xs text-muted-foreground">
                      {isPriceCategory(it.category)
                        ? PRICE_CATEGORY_LABELS[it.category]
                        : it.category}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCzk(it.priceCents)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCzk(it.priceCents * it.quantity)}
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ItemFormDialog
                          csrf={csrf}
                          invoiceId={invoiceId}
                          item={it}
                          trigger={
                            <Button variant="ghost" size="icon" title="Upravit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <form action={deleteInvoiceItemAction}>
                          <input type="hidden" name={CSRF_FIELD} value={csrf} />
                          <input type="hidden" name="invoiceId" value={invoiceId} />
                          <input type="hidden" name="itemId" value={it.id} />
                          <Button variant="ghost" size="icon" type="submit" title="Smazat">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <div className="flex w-full max-w-xs items-center justify-between">
            <span className="text-base font-semibold">K úhradě</span>
            <span className="text-lg font-bold text-primary">
              {formatCzk(totalCents)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
