export type JsonObject = Record<string, any>;

export interface AttestationSection {
  id: number;
  content: string;
}

export interface CompanyInfo {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  site: string;
  reseaux: string;
}

export const DEFAULT_SECTION =
  'Nous, Société {{Société}}, attestons par la présente que {{Civilité}} {{Nom}} {{Prenom}} travaille avec un contrat à durée indéterminée, au sein de notre établissement en qualité de {{Poste}} dépuis le {{Date_embauche}} {{Civilité}} {{Nom}} {{Prenom}} n\'est actuellement ni démissionnaire ni en procédure de licenciement. En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.';

export const ATTESTATION_VARIABLES = ['Nom', 'Prenom', 'Date_embauche', 'Poste', 'Société', 'Ancienneté'];

export const FALLBACK_EMAIL = 'chalmaninssa1962002@gmail.com';

export const EMPTY_COMPANY: CompanyInfo = {
  nom: '',
  adresse: '',
  telephone: '',
  email: '',
  site: '',
  reseaux: '',
};

/** Modèle mutable du document d'attestation, partagé entre le formulaire et l'aperçu. */
export interface AttestationFormModel {
  certificateTypeId: string | null;
  certificateTypeName: string;
  reference: string;
  place: string;
  date: string;
  reason: string;
  signatoryPosition: string;
  signatoryName: string;
  logoPreview: string | null;
  sections: AttestationSection[];
  variableMenuFor: number | null;
}

export function createAttestationForm(): AttestationFormModel {
  return {
    certificateTypeId: null,
    certificateTypeName: '',
    reference: '',
    place: '',
    date: '',
    reason: '',
    signatoryPosition: '',
    signatoryName: '',
    logoPreview: null,
    sections: [{ id: 1, content: DEFAULT_SECTION }],
    variableMenuFor: null,
  };
}
