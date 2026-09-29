"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { PaymentSettingsForm } from "@/components/settings/payment-settings-form";
import { PricelistManager, type PriceItemRow } from "@/components/settings/pricelist-manager";
import { SequencesManager, type SequenceRow } from "@/components/settings/sequences-manager";
import { ReceiptTemplateEditor } from "@/components/settings/receipt-template-editor";
import { SmtpSettingsForm } from "@/components/settings/smtp-settings-form";
import { EmailTemplatesForm } from "@/components/settings/email-templates-form";
import { EetSettingsForm } from "@/components/settings/eet-settings-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import type { TenantSettings } from "@/lib/settings/schema";

export function SettingsTabs({
  csrf,
  settings,
  priceItems,
  sequenceRows,
  hasCert,
  userEmail,
}: {
  csrf: string;
  settings: TenantSettings;
  priceItems: PriceItemRow[];
  sequenceRows: SequenceRow[];
  hasCert: boolean;
  userEmail: string;
}) {
  return (
    <Tabs defaultValue="firma">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="firma">Firma a vzhled</TabsTrigger>
        <TabsTrigger value="platba">Platba</TabsTrigger>
        <TabsTrigger value="cenik">Ceník</TabsTrigger>
        <TabsTrigger value="cisla">Číselné řady</TabsTrigger>
        <TabsTrigger value="uctenka">Šablona účtenky</TabsTrigger>
        <TabsTrigger value="email">E-mail</TabsTrigger>
        <TabsTrigger value="eet">EET 2.0</TabsTrigger>
        <TabsTrigger value="ucet">Účet</TabsTrigger>
      </TabsList>

      <TabsContent value="firma">
        <CompanySettingsForm csrf={csrf} settings={settings} />
      </TabsContent>

      <TabsContent value="platba">
        <PaymentSettingsForm csrf={csrf} settings={settings} />
      </TabsContent>

      <TabsContent value="cenik">
        <PricelistManager csrf={csrf} items={priceItems} />
      </TabsContent>

      <TabsContent value="cisla">
        <SequencesManager csrf={csrf} rows={sequenceRows} />
      </TabsContent>

      <TabsContent value="uctenka">
        <ReceiptTemplateEditor csrf={csrf} settings={settings} />
      </TabsContent>

      <TabsContent value="email" className="space-y-8">
        <div>
          <h2 className="mb-2 text-lg font-semibold">E-mail (SMTP)</h2>
          <SmtpSettingsForm csrf={csrf} settings={settings} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">E-mailové šablony</h2>
          <EmailTemplatesForm csrf={csrf} settings={settings} />
        </div>
      </TabsContent>

      <TabsContent value="eet">
        <EetSettingsForm csrf={csrf} settings={settings} hasCert={hasCert} />
      </TabsContent>

      <TabsContent value="ucet">
        <ChangePasswordForm csrf={csrf} email={userEmail} />
      </TabsContent>
    </Tabs>
  );
}
