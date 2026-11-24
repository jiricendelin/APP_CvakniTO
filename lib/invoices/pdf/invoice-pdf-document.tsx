import React from "react";
import {
  Document,
  Image,
  Link,
  Page,
  Polygon,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  formatInvoiceAmountFromCents,
  formatInvoiceTotalFromCents,
} from "./amount-format";

export type InvoicePdfData = {
  number: string;
  variableSymbol: string;
  issuedAt: Date;
  dueDate: Date;
  totalCents: number;
  items: {
    name: string;
    quantity: number;
    lineTotalCents: number;
  }[];
  customer: {
    name: string;
    ico: string;
    dic: string;
    address: string;
  };
  settings: {
    companyName: string;
    companyIco: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    companySignature: string;
    bankAccount: string;
    iban: string;
    swift: string;
  };
  qrDataUrl: string | null;
  logoSrc: string | null;
};

const ML = 28;
const MR = 28;
const GREEN_DARK = "#006933";
const GREEN = "#006933";
const GREEN_ACCENT = "#006933";
const GRAY_BG = "#e6e7e8";
const GRAY_LABEL = "#808285";
const GRAY_MUTED = "#58595b";
const GRAY_ON_GREEN = "#c9cacc";
const TEXT = "#231f20";
const WHITE = "#ffffff";

const RADIUS = 5.7;
const PAYMENT_H = 86;
/** Timmy logo 493×154 — šířka podle výšky, ať se necentroje v širším boxu. */
const LOGO_H = 43;
const LOGO_W = Math.round((LOGO_H * 493) / 154);
/** WTime: logo 179 + gap 68 → badge od 247; u užšího loga doplnit gap. */
const TITLE_BADGE_MARGIN_LEFT = 179 + 68 - LOGO_W;
const QR_W = 86;
const PAYMENT_W = 428;
const PAYMENT_GAP = 24;
const PAY_LABEL_W = 92;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingLeft: ML,
    paddingRight: MR,
    fontSize: 8,
    color: TEXT,
    fontFamily: "Arimo",
    fontWeight: 400,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logo: { width: LOGO_W, height: LOGO_H, objectFit: "contain" },
  titleBadge: {
    marginLeft: TITLE_BADGE_MARGIN_LEFT,
    width: 291,
    minHeight: LOGO_H,
    backgroundColor: GREEN_DARK,
    borderRadius: RADIUS,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  titleText: { fontSize: 14, color: WHITE, fontWeight: 600 },
  partiesRow: { flexDirection: "row", marginBottom: 16 },
  supplierCol: { width: 235, paddingTop: 15, paddingRight: 8 },
  customerCol: {
    width: 294,
    marginLeft: "auto",
    backgroundColor: GRAY_BG,
    borderRadius: RADIUS,
    borderWidth: 0.5,
    borderColor: GRAY_MUTED,
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  sectionLabel: {
    fontSize: 8,
    color: GRAY_LABEL,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nameText: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  line: { fontSize: 8, marginBottom: 1 },
  smallLine: { fontSize: 6, marginBottom: 1 },
  icoBlock: { marginTop: 12 },
  icoRow: { flexDirection: "row" },
  neplatce: { marginLeft: 24 },
  sigBlock: { marginTop: 8 },
  contactLine: { marginTop: 8, fontSize: 8, fontWeight: 700, color: TEXT },
  contactLabel: { fontSize: 8, fontWeight: 400, color: GRAY_MUTED },
  paymentRow: { flexDirection: "row", marginBottom: 3 },
  paymentShape: {
    width: PAYMENT_W,
    height: PAYMENT_H,
    position: "relative",
  },
  paymentInner: {
    flexDirection: "row",
    height: PAYMENT_H,
    paddingLeft: 16,
  },
  paymentLeft: {
    width: 227,
    justifyContent: "center",
    paddingVertical: 6,
  },
  payRow: { flexDirection: "row" },
  payRowSm: { flexDirection: "row", marginBottom: 1 },
  paySubBlock: { marginTop: 8 },
  payLabelBig: { width: PAY_LABEL_W, fontSize: 15, fontWeight: 700, color: WHITE },
  payValueBig: { fontSize: 15, fontWeight: 700, color: WHITE },
  payLabelMd: { width: PAY_LABEL_W, fontSize: 12, fontWeight: 700, color: WHITE },
  payValueMd: { fontSize: 12, fontWeight: 700, color: WHITE },
  payLabelSm: { width: PAY_LABEL_W, fontSize: 6, color: WHITE },
  payValueSm: { fontSize: 6, color: WHITE },
  paymentDivider: {
    width: 1,
    backgroundColor: WHITE,
    marginTop: 15,
    marginBottom: 12,
  },
  paymentRight: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 19,
    paddingRight: 20,
  },
  payLabelLight: { fontSize: 12, color: GRAY_ON_GREEN, marginBottom: 8 },
  payAmount: { fontSize: 17, color: WHITE, fontWeight: 700, marginBottom: 10 },
  payDue: { fontSize: 12, color: GRAY_ON_GREEN },
  qrCol: { width: QR_W, marginLeft: PAYMENT_GAP },
  qrFrame: {
    height: PAYMENT_H,
    borderWidth: 0.5,
    borderColor: TEXT,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImg: { width: 70, height: 70 },
  qrCaptionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    flexDirection: "row",
    justifyContent: "center",
  },
  qrCaption: {
    backgroundColor: WHITE,
    paddingHorizontal: 4,
    fontSize: 7,
    color: TEXT,
  },
  datesRow: {
    flexDirection: "row",
    marginBottom: 22,
  },
  dateItem: { flexDirection: "row" },
  dateLabel: { fontSize: 8, color: GRAY_MUTED },
  dateValue: { fontSize: 8, color: TEXT, fontWeight: 700 },
  table: { marginBottom: 6 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: GRAY_BG,
    paddingVertical: 6,
    paddingLeft: 13,
    paddingRight: 22,
  },
  th: { fontSize: 8, fontWeight: 700, color: TEXT },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingLeft: 13,
    paddingRight: 22,
  },
  tableRowAlt: { backgroundColor: GRAY_BG },
  td: { fontSize: 8, color: GRAY_MUTED },
  cDesc: { width: "62%" },
  cQty: { width: "20%", textAlign: "right" },
  cTotal: { width: "18%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    borderTopWidth: 0.5,
    borderTopColor: TEXT,
    paddingTop: 5,
    paddingRight: 16,
    marginTop: 2,
  },
  totalLabel: { marginLeft: 334, fontSize: 11, fontWeight: 700, color: GREEN_ACCENT },
  totalValue: { marginLeft: "auto", fontSize: 11, fontWeight: 700, color: GREEN_ACCENT },
  footer: {
    position: "absolute",
    bottom: 17,
    left: ML,
    right: MR,
    borderTopWidth: 1,
    borderTopColor: GREEN_ACCENT,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: GRAY_MUTED, textAlign: "center" },
  footerLink: { color: GREEN_ACCENT, textDecoration: "none" },
});

function formatPdfDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function splitLines(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function formatPdfQuantity(n: number): string {
  return n.toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function PaymentShape() {
  return (
    <Svg
      width={PAYMENT_W}
      height={PAYMENT_H}
      viewBox={`0 0 ${PAYMENT_W} ${PAYMENT_H}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <Polygon
        points={`0,0 ${PAYMENT_W - 20},0 ${PAYMENT_W},${PAYMENT_H / 2} ${PAYMENT_W - 20},${PAYMENT_H} 0,${PAYMENT_H}`}
        fill={GREEN}
      />
    </Svg>
  );
}

function QrBox({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <View style={styles.qrCol}>
      <View style={styles.qrFrame}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image */}
        <Image style={styles.qrImg} src={qrDataUrl} />
        <View style={styles.qrCaptionWrap}>
          <Text style={styles.qrCaption}>QR platba</Text>
        </View>
      </View>
    </View>
  );
}

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const totalFormatted = formatInvoiceTotalFromCents(data.totalCents);
  const account = data.settings.bankAccount.trim() || "—";
  const supplierAddress = splitLines(data.settings.companyAddress);
  const supplierSignature = splitLines(data.settings.companySignature);
  const clientAddress = splitLines(data.customer.address);
  const contactParts = [
    data.settings.companyPhone.trim(),
    data.settings.companyEmail.trim(),
  ].filter(Boolean);
  const footerName = data.settings.companyName || "Salon Timmy";
  const year = new Date(data.issuedAt).getFullYear();
  const iban = data.settings.iban.trim() || "—";
  const swift = data.settings.swift.trim() || "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {data.logoSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image
            <Image style={styles.logo} src={data.logoSrc} />
          ) : (
            <Text style={[styles.nameText, { color: GREEN_DARK, width: LOGO_W }]}>
              {data.settings.companyName}
            </Text>
          )}
          <View style={styles.titleBadge}>
            <Text style={styles.titleText}>
              FAKTURA - Daňový doklad {data.number}
            </Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.supplierCol}>
            <Text style={styles.sectionLabel}>Dodavatel:</Text>
            <Text style={styles.nameText}>{data.settings.companyName}</Text>
            {supplierAddress.map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
            <View style={[styles.icoBlock, styles.icoRow]}>
              {data.settings.companyIco ? (
                <Text style={styles.line}>IČO: {data.settings.companyIco}</Text>
              ) : null}
              <Text style={[styles.line, styles.neplatce]}>Neplátce DPH</Text>
            </View>
            {supplierSignature.length > 0 ? (
              <View style={styles.sigBlock}>
                {supplierSignature.map((line) => (
                  <Text key={line} style={styles.smallLine}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : null}
            {contactParts.length > 0 ? (
              <Text style={styles.contactLine}>
                <Text style={styles.contactLabel}>Kontakt: </Text>
                {contactParts.join("  /  ")}
              </Text>
            ) : null}
          </View>

          <View style={styles.customerCol}>
            <Text style={styles.sectionLabel}>Odběratel:</Text>
            <Text style={styles.nameText}>{data.customer.name}</Text>
            {clientAddress.slice(0, 4).map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
            {(data.customer.ico || data.customer.dic) && (
              <View style={styles.icoBlock}>
                {data.customer.ico ? (
                  <Text style={styles.line}>IČO: {data.customer.ico}</Text>
                ) : null}
                {data.customer.dic ? (
                  <Text style={styles.line}>DIČ: {data.customer.dic}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.paymentShape}>
            <PaymentShape />
            <View style={styles.paymentInner}>
              <View style={styles.paymentLeft}>
                <View style={styles.payRow}>
                  <Text style={styles.payLabelBig}>Číslo účtu:</Text>
                  <Text style={styles.payValueBig}>{account}</Text>
                </View>
                <View style={[styles.payRow, { marginTop: 2 }]}>
                  <Text style={styles.payLabelMd}>VS:</Text>
                  <Text style={styles.payValueMd}>{data.variableSymbol}</Text>
                </View>
                <View style={styles.paySubBlock}>
                  <View style={styles.payRowSm}>
                    <Text style={styles.payLabelSm}>Forma úhrady:</Text>
                    <Text style={styles.payValueSm}>Převodem</Text>
                  </View>
                  <View style={styles.payRowSm}>
                    <Text style={styles.payLabelSm}>IBAN:</Text>
                    <Text style={styles.payValueSm}>{iban}</Text>
                  </View>
                  <View style={styles.payRowSm}>
                    <Text style={styles.payLabelSm}>SWIFT:</Text>
                    <Text style={styles.payValueSm}>{swift}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.paymentDivider} />
              <View style={styles.paymentRight}>
                <Text style={styles.payLabelLight}>K ÚHRADĚ CELKEM</Text>
                <Text style={styles.payAmount}>{totalFormatted}</Text>
                <Text style={styles.payDue}>
                  nejpozději do {formatPdfDate(data.dueDate)}
                </Text>
              </View>
            </View>
          </View>
          {data.qrDataUrl ? <QrBox qrDataUrl={data.qrDataUrl} /> : null}
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Datum vystavení: </Text>
            <Text style={styles.dateValue}>{formatPdfDate(data.issuedAt)}</Text>
          </View>
          <View style={[styles.dateItem, { marginLeft: 28 }]}>
            <Text style={styles.dateLabel}>Datum zd. plnění: </Text>
            <Text style={styles.dateValue}>{formatPdfDate(data.issuedAt)}</Text>
          </View>
          <View style={[styles.dateItem, { marginLeft: 28 }]}>
            <Text style={styles.dateLabel}>Datum splatnosti: </Text>
            <Text style={styles.dateValue}>{formatPdfDate(data.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.cDesc]}>POPIS</Text>
            <Text style={[styles.th, styles.cQty]}>MNOŽSTVÍ</Text>
            <Text style={[styles.th, styles.cTotal]}>CELKEM</Text>
          </View>
          {data.items.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
              ]}
            >
              <Text style={[styles.td, styles.cDesc]}>{item.name}</Text>
              <Text style={[styles.td, styles.cQty]}>
                {formatPdfQuantity(item.quantity)}
              </Text>
              <Text style={[styles.td, styles.cTotal]}>
                {formatInvoiceAmountFromCents(item.lineTotalCents, "line")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>CELKEM K ÚHRADĚ</Text>
          <Text style={styles.totalValue}>{totalFormatted}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Faktura byla vytvořena a odeslána v aplikaci na míru{" "}
            <Link
              src="https://cendelin.cz/sluzby/aplikace-na-miru/"
              style={styles.footerLink}
            >
              CvakniTO
            </Link>
            , která vznikla v dílně{" "}
            <Link src="https://cendelin.cz/" style={styles.footerLink}>
              IT & DESIGN – Jiří Cendelín
            </Link>
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            (c) {footerName} {year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
