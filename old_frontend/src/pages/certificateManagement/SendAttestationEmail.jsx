import axios from 'axios';

const SendAttestationEmail = async ({ recipientEmail, subject, body, file }) => {
  try {
    const base64Pdf = await fileToBase64(file);

    const payload = {
      recipientEmail,
      subject,
      body,
      fileName: file.name,
      base64Pdf,
    };

    const response = await axios.post('/api/email/send-pdf', payload);
    console.log('Email envoyé :', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l’envoi :', error);
    throw error;
  }
};

export default SendAttestationEmail;