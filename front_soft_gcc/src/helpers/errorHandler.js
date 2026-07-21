/**
 * Détecte le type d'erreur à partir de divers formats (Axios, fetch, API).
 * Retourne un objet normalisé: { type, status, message, details }
 */
export function parseError(error) {
  // Erreur Axios avec réponse du serveur
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Extraction du message selon les formats de l'API
    let message = "";
    let details = null;

    if (typeof data === "string") {
      message = data;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      details = data.details || null;
    } else if (data?.Message) {
      message = data.Message;
    } else if (data?.title) {
      // ProblemDetails ASP.NET
      message = data.title;
      details = data.errors ? Object.values(data.errors).flat().join(", ") : null;
    } else {
      message = error.message || "Erreur inconnue";
    }

    return { type: typeFromStatus(status, data), status, message: cleanMessage(message), details };
  }

  // Erreur réseau (pas de réponse)
  if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED" || error.code === "ERR_CONNECTION_REFUSED" || error.message?.includes("Network Error")) {
    return { type: "network", status: 0, message: "Impossible de contacter le serveur.", details: null };
  }

  // Timeout
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return { type: "timeout", status: 0, message: "La requête a pris trop de temps.", details: null };
  }

  // Erreur Axios sans réponse (annulation, config)
  if (error.code === "ERR_CANCELED") {
    return { type: "canceled", status: 0, message: "Requête annulée.", details: null };
  }

  // Erreur JavaScript standard
  return { type: "unknown", status: 0, message: error.message || "Une erreur inattendue est survenue.", details: null };
}

function typeFromStatus(status, data) {
  if (status === 401) return "auth";
  if (status === 403) {
    if (data?.error === "license_invalid" || data?.reason) return "license";
    return "forbidden";
  }
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rateLimit";
  if (status >= 400 && status < 500) {
    if (status === 400 && data?.errors) return "validation";
    return "badRequest";
  }
  if (status >= 500) return "server";
  return "unknown";
}

function cleanMessage(msg) {
  if (!msg) return "Erreur inconnue.";
  // Supprime les préfixes techniques
  return msg
    .replace(/^Error:\s*/i, "")
    .replace(/^Exception:\s*/i, "")
    .replace(/^System\.\S+Exception:\s*/i, "")
    .replace(/^Request failed with status code \d+\s*/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Messages utilisateur contextualisés
// ---------------------------------------------------------------------------

const CONTEXTS = {
  chargement: {
    title: "Échec du chargement",
    verb: "charger",
    noun: "les données",
  },
  insertion: {
    title: "Échec de l'enregistrement",
    verb: "enregistrer",
    noun: "cet élément",
  },
  modification: {
    title: "Échec de la modification",
    verb: "modifier",
    noun: "cet élément",
  },
  suppression: {
    title: "Échec de la suppression",
    verb: "supprimer",
    noun: "cet élément",
  },
  connexion: {
    title: "Échec de la connexion",
    verb: "vous connecter",
    noun: "",
  },
  authentification: {
    title: "Problème d'authentification",
    verb: "vous authentifier",
    noun: "",
  },
  export: {
    title: "Échec de l'export",
    verb: "exporter",
    noun: "le document",
  },
  import: {
    title: "Échec de l'import",
    verb: "importer",
    noun: "le fichier",
  },
  evaluation: {
    title: "Échec de l'évaluation",
    verb: "soumettre",
    noun: "l'évaluation",
  },
};

const SUGGESTIONS = {
  network:
    "Vérifiez que votre connexion internet fonctionne et que le serveur est accessible. Si le problème persiste, contactez le support technique.",
  timeout:
    "Le serveur met trop de temps à répondre. Réessayez dans quelques instants. Si le problème persiste, contactez le support technique.",
  auth:
    "Votre session a peut-être expiré. Veuillez vous reconnecter.",
  forbidden:
    "Vous n'avez pas les droits nécessaires pour effectuer cette action. Contactez votre administrateur si vous pensez que c'est une erreur.",
  notFound:
    "L'élément demandé est introuvable. Il a peut-être été supprimé ou déplacé.",
  server:
    "Le serveur rencontre un problème technique. Nos équipes sont peut-être déjà informées. Veuillez réessayer dans quelques minutes.",
  license:
    "Votre licence n'est plus valide. Contactez votre administrateur pour la renouveler.",
  validation:
    "Veuillez corriger les champs indiqués et réessayer.",
  conflict:
    "Un conflit est survenu. L'élément existe peut-être déjà ou a été modifié entre-temps. Rafraîchissez la page et réessayez.",
  rateLimit:
    "Vous avez effectué trop de requêtes. Veuillez patienter quelques instants avant de réessayer.",
  badRequest:
    "La requête n'a pas pu être traitée. Vérifiez les informations saisies et réessayez.",
  unknown:
    "Une erreur inattendue est survenue. Si le problème persiste, contactez le support technique.",
};

/**
 * Retourne un objet structuré prêt à être affiché à l'utilisateur.
 *
 * @param {*}      error    - L'erreur brute attrapée dans un catch
 * @param {string} [context="chargement"] - Contexte: "chargement", "insertion", "modification", "suppression", "connexion", "authentification", "export", "import", "evaluation"
 * @returns {{ title: string, message: string, suggestion: string, severity: "error"|"warning"|"info", type: string, status: number, rawMessage: string }}
 */
export function getUserMessage(error, context = "chargement") {
  const parsed = parseError(error);
  const ctx = CONTEXTS[context] || CONTEXTS.chargement;

  const title = ctx.title;
  const suggestion = SUGGESTIONS[parsed.type] || SUGGESTIONS.unknown;

  // Construit un message clair selon le type d'erreur
  let message;
  switch (parsed.type) {
    case "network":
      message = `Impossible de ${ctx.verb} ${ctx.noun}. Le serveur est injoignable.`;
      break;
    case "timeout":
      message = `Impossible de ${ctx.verb} ${ctx.noun}. Le serveur a mis trop de temps à répondre.`;
      break;
    case "auth":
      message = `Impossible de ${ctx.verb} ${ctx.noun} car votre session a expiré.`;
      break;
    case "forbidden":
      message = `Vous n'avez pas l'autorisation de ${ctx.verb} ${ctx.noun}.`;
      break;
    case "notFound":
      message = `${ctx.noun.charAt(0).toUpperCase() + ctx.noun.slice(1)} introuvable. Il a peut-être été supprimé.`;
      break;
    case "server":
      message = `Impossible de ${ctx.verb} ${ctx.noun} en raison d'une erreur du serveur.`;
      break;
    case "license":
      message = `Impossible de ${ctx.verb} ${ctx.noun} car la licence n'est plus valide.`;
      break;
    case "validation":
      message = `Impossible de ${ctx.verb} ${ctx.noun}. Des informations sont manquantes ou incorrectes.`;
      break;
    case "conflict":
      message = `Impossible de ${ctx.verb} ${ctx.noun} car un conflit est survenu.`;
      break;
    case "rateLimit":
      message = `Trop de tentatives. Veuillez patienter avant de ${ctx.verb} ${ctx.noun}.`;
      break;
    case "canceled":
      return {
        title: "Action annulée",
        message: "L'opération a été annulée.",
        suggestion: null,
        severity: "info",
        type: parsed.type,
        status: parsed.status,
        rawMessage: parsed.message,
      };
    default:
      // Pour badRequest et unknown, on peut enrichir avec le message serveur s'il est pertinent
      if (parsed.message && parsed.message.length > 5 && parsed.message.length < 150) {
        message = parsed.message;
      } else {
        message = `Impossible de ${ctx.verb} ${ctx.noun}. ${parsed.message || "Erreur inattendue."}`;
      }
      break;
  }

  return {
    title,
    message,
    suggestion,
    severity: parsed.type === "canceled" ? "info" : "error",
    type: parsed.type,
    status: parsed.status,
    rawMessage: parsed.message,
  };
}

export default { parseError, getUserMessage };
