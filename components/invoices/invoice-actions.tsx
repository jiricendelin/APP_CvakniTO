"use client";

import { CheckCircle2, Ban, Trash2, Undo2, Copy, FileDown } from "lucide-react";
import {
  issueInvoiceAction,
  revertToDraftAction,
  duplicateInvoiceAsDraftAction,
  cancelInvoiceAction,
  deleteDraftAction,
  markInvoicePaidAction,
} from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { CSRF_FIELD } from "@/lib/auth/csrf-shared";
import { isKonceptNumber } from "@/lib/invoices/status";

function ConfirmForm({
  action,
  csrf,
  id,
  confirmText,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  csrf: string;
  id: string;
  confirmText?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name={CSRF_FIELD} value={csrf} />
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}

export function InvoiceActions({
  csrf,
  invoice,
  sendSlot,
}: {
  csrf: string;
  invoice: { id: string; number: string; status: string; sentAt: Date | null; paidAt: Date | null };
  sendSlot?: React.ReactNode;
}) {
  const isDraft = invoice.status === "koncept";
  const isCancelled = invoice.status === "stornovana";
  const isIssued = invoice.status === "vystavena";
  const isPaid = invoice.status === "zaplacena";
  const canRevertToDraft = isIssued && !invoice.sentAt && !invoice.paidAt;
  const canDuplicate = !isDraft;
  const canDeleteDraft = isDraft && isKonceptNumber(invoice.number);

  return (
    <div className="flex flex-wrap gap-2">
      {isDraft && (
        <>
          <ConfirmForm
            action={issueInvoiceAction}
            csrf={csrf}
            id={invoice.id}
            confirmText="Vystavit fakturu? Po vystavení ji lze upravit jen vrácením do konceptu."
          >
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" />
              Vystavit
            </Button>
          </ConfirmForm>
          {canDeleteDraft && (
            <ConfirmForm
              action={deleteDraftAction}
              csrf={csrf}
              id={invoice.id}
              confirmText="Opravdu smazat koncept?"
            >
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4" />
                Smazat koncept
              </Button>
            </ConfirmForm>
          )}
        </>
      )}

      {!isDraft && !isCancelled && (
        <a href={`/api/invoices/${invoice.id}/pdf`}>
          <Button variant="outline">
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
        </a>
      )}

      {(isIssued || isPaid) && sendSlot}

      {canDuplicate && (
        <ConfirmForm
          action={duplicateInvoiceAsDraftAction}
          csrf={csrf}
          id={invoice.id}
          confirmText="Vytvořit nový koncept s položkami této faktury?"
        >
          <Button type="submit" variant="outline">
            <Copy className="h-4 w-4" />
            Zduplikovat jako koncept
          </Button>
        </ConfirmForm>
      )}

      {canRevertToDraft && (
        <ConfirmForm
          action={revertToDraftAction}
          csrf={csrf}
          id={invoice.id}
          confirmText="Vrátit fakturu do konceptu? Číslo faktury zůstane, po opravě ji znovu vystavíte."
        >
          <Button type="submit" variant="outline">
            <Undo2 className="h-4 w-4" />
            Vrátit do konceptu
          </Button>
        </ConfirmForm>
      )}

      {isIssued && (
        <ConfirmForm
          action={markInvoicePaidAction}
          csrf={csrf}
          id={invoice.id}
          confirmText="Označit fakturu jako zaplacenou?"
        >
          <Button type="submit" variant="outline">
            <CheckCircle2 className="h-4 w-4" />
            Označit jako zaplacenou
          </Button>
        </ConfirmForm>
      )}

      {(isIssued || isPaid) && (
        <ConfirmForm
          action={cancelInvoiceAction}
          csrf={csrf}
          id={invoice.id}
          confirmText="Opravdu zrušit fakturu?"
        >
          <Button type="submit" variant="ghost" className="text-destructive">
            <Ban className="h-4 w-4" />
            Zrušit
          </Button>
        </ConfirmForm>
      )}

      {isCancelled && (
        <p className="text-sm text-muted-foreground">Faktura je zrušena.</p>
      )}
    </div>
  );
}
