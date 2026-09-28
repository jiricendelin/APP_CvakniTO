import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import {
  listSequences,
  sequencePreview,
} from "@/lib/sequences/repository";
import { isSequenceKind } from "@/lib/sequences/kinds";
import { SequencesManager } from "@/components/settings/sequences-manager";

export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const sequences = await listSequences(tenantId);

  const rows = sequences
    .filter(
      (s): s is (typeof sequences)[number] & { kind: "receipt" | "invoice" } =>
        isSequenceKind(s.kind)
    )
    .map((s) => ({
      kind: s.kind,
      prefix: s.prefix,
      format: s.format,
      resetYearly: s.resetYearly,
      preview: sequencePreview(s),
      nextValue: s.nextValue,
    }));

  return <SequencesManager csrf={csrf} rows={rows} />;
}
