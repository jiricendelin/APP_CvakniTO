import { Document, Page, Image, Text, View, StyleSheet } from "@react-pdf/renderer";

export type VoucherPdfProps = {
  frontImageSrc: string | null;
  backImageSrc: string | null;
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

const styles = StyleSheet.create({
  page: {
    position: "relative",
    width: "100%",
    height: "100%",
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
    padding: 40,
    fontSize: 18,
  },
  overlay: {
    position: "absolute",
  },
});

export function VoucherPdfDocument(props: VoucherPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
      </Page>
      <Page size="A4" style={styles.page}>
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
            {
              left: `${props.numberX}%`,
              top: `${props.numberY}%`,
              fontSize: props.numberFontSize,
              transform: "translate(-50%, -50%)",
            },
          ]}
        >
          {props.number}
        </Text>
        <Text
          style={[
            styles.overlay,
            {
              left: `${props.validX}%`,
              top: `${props.validY}%`,
              fontSize: props.validFontSize,
              transform: "translate(-50%, -50%)",
            },
          ]}
        >
          {props.validUntilLabel}
        </Text>
      </Page>
    </Document>
  );
}
