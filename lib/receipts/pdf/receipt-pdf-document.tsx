import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatCzk } from "@/lib/money";

export type ReceiptPdfData = {
  companyName: string;
  companyIco: string;
  companyAddress: string;
  number: string;
  variableSymbol: string;
  totalCents: number;
  paymentTypeLabel: string;
  issuedAtLabel: string;
  items: { name: string; quantity: number; lineTotalCents: number }[];
  qrDataUrl: string | null;
  kindLabel: string;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  muted: { color: "#555", marginBottom: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
    marginTop: 16,
    marginBottom: 6,
  },
  itemRow: { flexDirection: "row", marginBottom: 3 },
  colName: { flex: 1 },
  colQty: { width: 40, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  total: { marginTop: 12, fontSize: 14, fontWeight: "bold" },
  qr: { marginTop: 20, width: 140, height: 140 },
});

export function ReceiptPdfDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Účtenka {data.number}</Text>
        <Text>{data.companyName}</Text>
        {data.companyIco ? <Text style={styles.muted}>IČO: {data.companyIco}</Text> : null}
        {data.companyAddress ? (
          <Text style={styles.muted}>{data.companyAddress}</Text>
        ) : null}
        <Text style={styles.muted}>Typ: {data.kindLabel}</Text>
        <Text>Vystaveno: {data.issuedAtLabel}</Text>
        <Text>Platba: {data.paymentTypeLabel}</Text>
        <Text>VS: {data.variableSymbol}</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Položka</Text>
          <Text style={styles.colQty}>ks</Text>
          <Text style={styles.colPrice}>Cena</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatCzk(item.lineTotalCents)}</Text>
          </View>
        ))}

        <Text style={styles.total}>Celkem: {formatCzk(data.totalCents)}</Text>

        {data.qrDataUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.qrDataUrl} style={styles.qr} />
        ) : null}
      </Page>
    </Document>
  );
}
