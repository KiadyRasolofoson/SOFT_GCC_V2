import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// Définir les styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: '1px solid #e4e4e4',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  image: {
    width: 200,
    height: 100,
    marginBottom: 10,
  },
  link: {
    fontSize: 12,
    color: 'blue',
    textDecoration: 'underline',
  },
});

// Composant PDF
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Rapport généré avec react-pdf</Text>
      <View style={styles.section}>
        <Text style={styles.text}>Voici un exemple de section avec un contenu textuel.</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Image intégrée :</Text>
        <Image style={styles.image} src="https://via.placeholder.com/200x100" />
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Lien cliquable :</Text>
        <Text style={styles.link}>
          <a href="https://react-pdf.org">Documentation React-pdf</a>
        </Text>
      </View>
    </Page>
  </Document>
);

// Composant principal
const ExportPDF = () => (
  <div>
    <h1>Exporter un document PDF</h1>
    <PDFDownloadLink document={<MyDocument />} fileName="rapport.pdf">
      {({ loading }) => (loading ? 'Génération en cours...' : 'Télécharger le PDF')}
    </PDFDownloadLink>
  </div>
);

export default ExportPDF;
