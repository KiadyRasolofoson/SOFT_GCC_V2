import axios from 'axios';

// Domaine d'url pour les appels api
async function Fetcher(url) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5189/api'}${url}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erreur 404 : L'endpoint n'a pas été trouvé.", error.response);
    } else {
      console.error("Erreur lors de l'appel API :", error);
    }
    throw error;
  }
}

export default Fetcher;