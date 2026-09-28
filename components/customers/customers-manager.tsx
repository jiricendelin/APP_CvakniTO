"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
  type CustomerActionState,
} from "@/app/(app)/customers/actions";
import { CsrfField } from "@/components/csrf-field";

export type CustomerRow = {
  id: string;
  name: string;
  ico: string;
  dic: string;
  address: string;
  email: string;
  phone: string;
  note: string;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : label}
    </button>
  );
}

function AresHint({ formId }: { formId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFromAres() {
    setError(null);
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const icoInput = form.elements.namedItem("ico") as HTMLInputElement | null;
    const ico = icoInput?.value?.trim() ?? "";
    if (!ico) {
      setError("Nejdřív zadejte IČO.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/ares/${encodeURIComponent(ico)}`);
      const data = (await res.json()) as {
        error?: string;
        name?: string;
        dic?: string;
        address?: string;
        ico?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "ARES nevrátil data.");
        return;
      }
      const set = (name: string, value: string) => {
        const el = form.elements.namedItem(name) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        if (el) el.value = value;
      };
      set("name", data.name ?? "");
      set("dic", data.dic ?? "");
      set("address", data.address ?? "");
      if (data.ico) set("ico", data.ico);
    } catch {
      setError("Načtení z ARES selhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void loadFromAres()}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
      >
        {busy ? "Načítám z ARES…" : "Načíst z ARES"}
      </button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CustomerFields({
  formId,
  defaults,
}: {
  formId: string;
  defaults?: Partial<CustomerRow>;
}) {
  return (
    <div className="space-y-3">
      <input
        name="ico"
        placeholder="IČO"
        defaultValue={defaults?.ico ?? ""}
        inputMode="numeric"
        className={fieldClass}
      />
      <AresHint formId={formId} />
      <input
        name="name"
        placeholder="Název / jméno"
        required
        defaultValue={defaults?.name ?? ""}
        className={fieldClass}
      />
      <input
        name="dic"
        placeholder="DIČ"
        defaultValue={defaults?.dic ?? ""}
        className={fieldClass}
      />
      <textarea
        name="address"
        placeholder="Adresa"
        rows={2}
        defaultValue={defaults?.address ?? ""}
        className={fieldClass}
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        defaultValue={defaults?.email ?? ""}
        className={fieldClass}
      />
      <input
        name="phone"
        placeholder="Telefon"
        defaultValue={defaults?.phone ?? ""}
        className={fieldClass}
      />
      <textarea
        name="note"
        placeholder="Poznámka"
        rows={2}
        defaultValue={defaults?.note ?? ""}
        className={fieldClass}
      />
    </div>
  );
}

function AddCustomerForm({ csrf }: { csrf: string }) {
  const formId = useId();
  const router = useRouter();
  const [state, formAction] = useActionState<
    CustomerActionState,
    FormData
  >(createCustomerAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form
      id={formId}
      action={formAction}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <p className="text-sm font-medium">Nový zákazník</p>
      <CsrfField token={csrf} />
      <CustomerFields formId={formId} />
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          Zákazník uložen.
        </p>
      )}
      <SubmitButton label="Přidat zákazníka" />
    </form>
  );
}

function EditCustomerForm({
  csrf,
  customer,
  onDone,
}: {
  csrf: string;
  customer: CustomerRow;
  onDone: () => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [state, formAction] = useActionState<
    CustomerActionState,
    FormData
  >(updateCustomerAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
  }, [state.success, router, onDone]);

  return (
    <form
      id={formId}
      action={formAction}
      className="mt-3 space-y-3 border-t border-border pt-3"
    >
      <CsrfField token={csrf} />
      <input type="hidden" name="id" value={customer.id} />
      <CustomerFields formId={formId} defaults={customer} />
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <SubmitButton label="Uložit změny" />
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}

function DeleteCustomerButton({
  csrf,
  customer,
}: {
  csrf: string;
  customer: CustomerRow;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    CustomerActionState,
    FormData
  >(deleteCustomerAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(`Opravdu smazat zákazníka „${customer.name}"?`)
        ) {
          e.preventDefault();
        }
      }}
    >
      <CsrfField token={csrf} />
      <input type="hidden" name="id" value={customer.id} />
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50"
      >
        Smazat
      </button>
      {state.error && (
        <p className="mt-1 text-xs text-red-700">{state.error}</p>
      )}
    </form>
  );
}

function CustomerListItem({
  csrf,
  customer,
}: {
  csrf: string;
  customer: CustomerRow;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{customer.name}</p>
          {customer.ico && (
            <p className="text-sm text-muted-foreground">
              IČO {customer.ico}
              {customer.dic ? ` · DIČ ${customer.dic}` : ""}
            </p>
          )}
          {customer.address && (
            <p className="text-sm text-muted-foreground">{customer.address}</p>
          )}
          {(customer.email || customer.phone) && (
            <p className="text-xs text-muted-foreground">
              {[customer.email, customer.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Upravit
            </button>
          )}
          <DeleteCustomerButton csrf={csrf} customer={customer} />
        </div>
      </div>
      {editing && (
        <EditCustomerForm
          csrf={csrf}
          customer={customer}
          onDone={() => setEditing(false)}
        />
      )}
    </li>
  );
}

export function CustomersManager({
  csrf,
  customers,
}: {
  csrf: string;
  customers: CustomerRow[];
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Zákazníci</h1>
        <p className="text-sm text-muted-foreground">
          Adresář pro faktury. U firem načtěte údaje z ARES podle IČO.
        </p>
      </div>

      <AddCustomerForm csrf={csrf} />

      <ul className="space-y-3">
        {customers.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Zatím žádní zákazníci.
          </li>
        ) : (
          customers.map((c) => (
            <CustomerListItem key={c.id} csrf={csrf} customer={c} />
          ))
        )}
      </ul>
    </div>
  );
}
