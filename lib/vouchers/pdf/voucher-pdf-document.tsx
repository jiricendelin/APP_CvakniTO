import { Document, Page, Image, Text, View, StyleSheet } from "@react-pdf/renderer";

export type VoucherPdfProps = {
  frontImageSrc: Buffer | null;
  backImageSrc: Buffer | null;
  number: string;
  validUntilLabel: string;
  numberX: number;
  numberY: number;
  validX: number;
  validY: number;
  numberFontSize: number;
  validFontSize: number;
  fallbackTitle: string;
};

/**
 * A4 na výšku: přední strana DL, dělicí čára, zadní strana DL, stříhací čára
 * 5 mm pod zadní stranou. Karty jsou 200 × 95 mm kvůli netisknutelným
 * okrajům domácích tiskáren.
 */
const MM = 72 / 25.4;
const CARD_LEFT = 5 * MM;
const CARD_WIDTH = 200 * MM;
const CARD_HEIGHT = 95 * MM;
const FRONT_TOP = 5 * MM;
const BACK_TOP = 100 * MM;
const CUT_TOP = 200 * MM;
const OVERLAY_WIDTH = 300;

/** Text vycentrovaný na bod (x %, y %) zadní strany. */
function overlayPosition(xPercent: number, yPercent: number, fontSize: number) {
  return {
    left: (xPercent / 100) * CARD_WIDTH - OVERLAY_WIDTH / 2,
    top: (yPercent / 100) * CARD_HEIGHT - fontSize * 0.6,
    width: OVERLAY_WIDTH,
    fontSize,
  };
}

const styles = StyleSheet.create({
  page: {
    position: "relative",
    fontFamily: "Roboto",
  },
  card: {
    position: "absolute",
    left: CARD_LEFT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  fullImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  fallback: {
    padding: 20,
    fontSize: 18,
    height: "100%",
    borderWidth: 0.5,
    borderColor: "#cccccc",
  },
  overlay: {
    position: "absolute",
    textAlign: "center",
  },
  dividerLine: {
    position: "absolute",
    left: CARD_LEFT,
    width: CARD_WIDTH,
    top: BACK_TOP,
    borderTopWidth: 0.3,
    borderTopColor: "#bbbbbb",
  },
  cutLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: CUT_TOP,
    borderTopWidth: 0.5,
    borderTopColor: "#888888",
    borderTopStyle: "dashed",
  },
});

export function VoucherPdfDocument(props: VoucherPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.card, { top: FRONT_TOP }]}>
          {props.frontImageSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={props.frontImageSrc} style={styles.fullImage} />
          ) : (
            <View style={styles.fallback}>
              <Text>{props.fallbackTitle}</Text>
              <Text style={{ marginTop: 12, fontSize: 14 }}>
                Poukaz č. {props.number}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { top: BACK_TOP }]}>
          {props.backImageSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={props.backImageSrc} style={styles.fullImage} />
          ) : (
            <View style={styles.fallback}>
              <Text>Podmínky dárkového poukazu</Text>
            </View>
          )}
          <Text
            style={[
              styles.overlay,
              overlayPosition(props.numberX, props.numberY, props.numberFontSize),
            ]}
          >
            {props.number}
          </Text>
          <Text
            style={[
              styles.overlay,
              overlayPosition(props.validX, props.validY, props.validFontSize),
            ]}
          >
            {props.validUntilLabel}
          </Text>
        </View>

        <View style={styles.dividerLine} />
        <View style={styles.cutLine} />
      </Page>
    </Document>
  );
}
