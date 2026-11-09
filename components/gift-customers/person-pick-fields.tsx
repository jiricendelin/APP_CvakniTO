"use client";

import { useMemo, useState } from "react";

export type PersonPickCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function PersonPickFields({
  namePrefix,
  customers,
  fieldClass,
  requireName,
  emailRequired,
  onMissingEmailChange,
}: {
  namePrefix: string;
  customers: PersonPickCustomer[];
  fieldClass: string;
  requireName?: boolean;
  emailRequired?: boolean;
  onMissingEmailChange?: (missing: boolean) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customerId, customers]
  );
  const manualMode = !customerId;
  const selectedMissingEmail = !!(selected && !selected.email.trim());

  function selectCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    const missing = !!(c && !c.email.trim());
    onMissingEmailChange?.(id ? missing : false);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={`${namePrefix}GiftCustomerId`} value={customerId} />

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Zákazník</span>
        <select
          className={fieldClass}
          value={customerId}
          onChange={(e) => selectCustomer(e.target.value)}
        >
          <option value="">— Ručně / nový —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.lastName} {c.firstName}
              {c.email ? ` · ${c.email}` : ""}
            </option>
          ))}
        </select>
      </label>

      {!manualMode && selected ? (
        <div className="space-y-1 text-sm">
          <p>
            {selected.lastName} {selected.firstName}
          </p>
          {selectedMissingEmail ? (
            <p className="text-destructive">
              {emailRequired
                ? "Zákazník nemá e-mail — doplňte ho v kartotéce, nebo zvolte ruční zadání."
                : "Zákazník nemá e-mail."}
            </p>
          ) : selected.email ? (
            <p>
              <span className="text-muted-foreground">E-mail: </span>
              {selected.email}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Příjmení</span>
            <input
              name={`${namePrefix}LastName`}
              required={requireName}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Jméno</span>
            <input
              name={`${namePrefix}FirstName`}
              required={requireName}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">E-mail</span>
            <input
              name={`${namePrefix}Email`}
              type="email"
              required={emailRequired}
              className={fieldClass}
            />
          </label>
        </div>
      )}
    </div>
  );
}
