import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCzk } from "@/lib/money";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";
import { formatPragueDate } from "@/lib/time/format-prague";
import type { TenantSettings } from "@/lib/settings/schema";
import type { Customer } from "@prisma/client";

export type InvoicePdfData = {
  number: string;
  variableSymbol: string;
  issuedAt: Date;
  dueDate: Date;
  totalCents: number;
  items: {
    name: string;
    quantity: number;
    priceCents: number;
    lineTotalCents: number;
    category: string;
  }[];
  customer: Pick<
    Customer,
    "name" | "ico" | "dic" | "address" | "email" | "phone"
  >;
  settings: Pick<
    TenantSettings,
    "companyName" | "companyIco" | "companyDic" | "companyAddress" | "iban" | "bankAccount"
  >;
  qrDataUrl: string | null;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    padding: 36,
    lineHeight: 1.35,
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  section: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#444" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
    marginTop: 8,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  colName: { width: "46%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "22%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right" },
  total: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
    textAlign: "right",
  },
  qr: { width: 120, height: 120, marginTop: 12, alignSelf: "center" },
  muted: { fontSize: 9, color: "#555", marginTop: 4 },
});

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const supplier = data.settings.companyName || "Dodavatel";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Faktura {data.number}</Text>

        <View style={styles.section}>
          <Text style={{ fontWeight: 700 }}>Dodavatel</Text>
          <Text>{supplier}</Text>
          {data.settings.companyAddress ? (
            <Text>{data.settings.companyAddress}</Text>
          ) : null}
          {(data.settings.companyIco || data.settings.companyDic) && (
            <Text>
              {data.settings.companyIco
                ? `IČO ${data.settings.companyIco}`
                : ""}
              {data.settings.companyDic
                ? `  DIČ ${data.settings.companyDic}`
                : ""}
            </Text>
          )}
          {data.settings.bankAccount ? (
            <Text>Účet: {data.settings.bankAccount}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 700 }}>Odběratel</Text>
          <Text>{data.customer.name}</Text>
          {data.customer.address ? <Text>{data.customer.address}</Text> : null}
          {(data.customer.ico || data.customer.dic) && (
            <Text>
              {data.customer.ico ? `IČO ${data.customer.ico}` : ""}
              {data.customer.dic ? `  DIČ ${data.customer.dic}` : ""}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>
              <Text style={styles.label}>Datum vystavení: </Text>
              {formatPragueDate(data.issuedAt)}
            </Text>
            <Text>
              <Text style={styles.label}>Splatnost: </Text>
              {formatPragueDate(data.dueDate)}
            </Text>
          </View>
          <Text>
            <Text style={styles.label}>Variabilní symbol: </Text>
            {data.variableSymbol}
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Položka</Text>
          <Text style={styles.colQty}>Ks</Text>
          <Text style={styles.colPrice}>Cena</Text>
          <Text style={styles.colTotal}>Celkem</Text>
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <View style={styles.colName}>
              <Text>{item.name}</Text>
              <Text style={styles.muted}>
                {isPriceCategory(item.category)
                  ? PRICE_CATEGORY_LABELS[item.category]
                  : item.category}
              </Text>
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatCzk(item.priceCents)}</Text>
            <Text style={styles.colTotal}>{formatCzk(item.lineTotalCents)}</Text>
          </View>
        ))}

        <Text style={styles.total}>Celkem k úhradě: {formatCzk(data.totalCents)}</Text>

        {data.qrDataUrl ? (
          <View>
            <Text style={{ textAlign: "center", marginTop: 12 }}>
              Platba QR (SPAYD)
            </Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image */}
            <Image src={data.qrDataUrl} style={styles.qr} />
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
