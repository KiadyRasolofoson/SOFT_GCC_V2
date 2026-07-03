import axios from 'axios';

// Domaine d'url pour les appels api
async function Fetcher(url) {
  try {
    const response = await axios.get(`http://localhost:5189/api${url}`);
    // const response = await axios.get(`http://151.80.218.41:5003/api${url}`); // Serveur distant
    // const response = await axios.get(`https://localhost:7082/api${url}`); // Ancien port
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