/** Modèle déclaratif d'une entité paramètre (miroir EntityManager React). */

export type EntityFormKind = 'simple' | 'establishment' | 'department';

export interface EntityColumn {
  header: string;
  /** Champ texte à afficher. */
  field?: string;
  /** Affiche une image (logo/photo) via un endpoint par id. */
  image?: boolean;
  /** Endpoint pour récupérer l'image (avec placeholder {id}). */
  imageEndpoint?: string;
  /** Texte de remplacement si pas d'image. */
  imageFallback?: string;
  /** Classes CSS additionnelles de la cellule. */
  className?: string;
}

export interface EntityConfig {
  key: string;
  label: string;
  icon: string;
  apiEndpoint: string;
  idField: string;
  nameField: string;
  formLabel?: string;
  formKind: EntityFormKind;
  columns: EntityColumn[];
  searchFields: string[];
  /** Champs du formulaire complexe (establishment/department). */
  formFields?: {
    name: string;
    label: string;
    required?: boolean;
    type?: 'text' | 'file';
    placeholder?: string;
  }[];
}

/** Endpoint GET/POST/PUT/DELETE par défaut = apiEndpoint ; possibilité d'extra endpoints. */
export interface ExtraEndpoints {
  get?: string;
  post?: string;
  put?: string;
  delete?: string;
}

export interface EntityGroupConfig {
  title: string;
  subtitle: string;
  icon: string;
  entities: EntityConfig[];
}

const SIMPLE_COLUMNS: EntityColumn[] = [
  { header: '#', field: 'id' },
  { header: 'Désignation', field: 'name' },
];

/** Construit les colonnes par défaut (id + nom) pour une entité simple. */
function simpleColumns(idField: string, nameField: string, nameLabel = 'Désignation'): EntityColumn[] {
  return [
    { header: '#', field: idField },
    { header: nameLabel, field: nameField },
  ];
}

const ESTABLISHMENT_FIELDS = [
  { name: 'establishmentName', label: 'Désignation', required: true, placeholder: 'Nom de l\'établissement' },
  { name: 'adress', label: 'Adresse', placeholder: 'Adresse' },
  { name: 'phoneNumber', label: 'Téléphone', placeholder: 'Téléphone' },
  { name: 'email', label: 'Email', placeholder: 'Email' },
  { name: 'website', label: 'Site web', placeholder: 'Site web' },
  { name: 'socialMedia', label: 'Réseaux sociaux', placeholder: 'Réseaux sociaux' },
  { name: 'nif', label: 'NIF', placeholder: 'NIF' },
  { name: 'stat', label: 'STAT', placeholder: 'STAT' },
  { name: 'logo', label: 'Logo', type: 'file' },
] as const;

const DEPARTMENT_FIELDS = [
  { name: 'name', label: 'Nom du département', required: true, placeholder: 'Nom du département' },
  { name: 'photo', label: 'Photo du département', type: 'file' },
] as const;

export const CARRIERES_ENTITIES: EntityConfig[] = [
  {
    key: 'assignmentType',
    label: "Type d'affectation",
    icon: 'swap_horiz',
    apiEndpoint: '/AssignmentType',
    idField: 'assignmentTypeId',
    nameField: 'assignmentTypeName',
    formKind: 'simple',
    columns: simpleColumns('assignmentTypeId', 'assignmentTypeName'),
    searchFields: ['assignmentTypeName'],
  },
  {
    key: 'certificateType',
    label: 'Type de certificat',
    icon: 'workspace_premium',
    apiEndpoint: '/CertificateType',
    idField: 'certificateTypeId',
    nameField: 'certificateTypeName',
    formKind: 'simple',
    columns: simpleColumns('certificateTypeId', 'certificateTypeName'),
    searchFields: ['certificateTypeName'],
  },
  {
    key: 'echelon',
    label: 'Échelon',
    icon: 'stairs',
    apiEndpoint: '/Echelon',
    idField: 'echelonId',
    nameField: 'echelonName',
    formKind: 'simple',
    columns: simpleColumns('echelonId', 'echelonName'),
    searchFields: ['echelonName'],
  },
  {
    key: 'employeeType',
    label: 'Type de contrat',
    icon: 'badge',
    apiEndpoint: '/EmployeeType',
    idField: 'employeeTypeId',
    nameField: 'employeeTypeName',
    formKind: 'simple',
    columns: simpleColumns('employeeTypeId', 'employeeTypeName'),
    searchFields: ['employeeTypeName'],
  },
  {
    key: 'establishment',
    label: 'Établissement',
    icon: 'apartment',
    apiEndpoint: '/Establishment',
    idField: 'establishmentId',
    nameField: 'establishmentName',
    formKind: 'establishment',
    formLabel: 'Nom de l\'établissement',
    columns: [
      { header: '#', field: 'establishmentId' },
      { header: 'Logo', image: true, imageEndpoint: '/Establishment/logo/{id}', imageFallback: 'Pas de photo' },
      { header: 'Désignation', field: 'establishmentName' },
      { header: 'Adresse', field: 'address' },
      { header: 'Contact', field: 'phoneNumber' },
    ],
    searchFields: ['establishmentName', 'address', 'phoneNumber', 'email'],
    formFields: ESTABLISHMENT_FIELDS as any,
  },
  {
    key: 'fonction',
    label: 'Fonction',
    icon: 'work',
    apiEndpoint: '/Fonction',
    idField: 'fonctionId',
    nameField: 'fonctionName',
    formKind: 'simple',
    columns: simpleColumns('fonctionId', 'fonctionName'),
    searchFields: ['fonctionName'],
  },
  {
    key: 'indication',
    label: 'Indice',
    icon: 'star',
    apiEndpoint: '/Indication',
    idField: 'indicationId',
    nameField: 'indicationName',
    formKind: 'simple',
    columns: simpleColumns('indicationId', 'indicationName'),
    searchFields: ['indicationName'],
  },
  {
    key: 'legalClass',
    label: 'Classe légale',
    icon: 'gavel',
    apiEndpoint: '/LegalClass',
    idField: 'legalClassId',
    nameField: 'legalClassName',
    formKind: 'simple',
    columns: simpleColumns('legalClassId', 'legalClassName'),
    searchFields: ['legalClassName'],
  },
  {
    key: 'newsletterTemplate',
    label: 'Bulletin',
    icon: 'newspaper',
    apiEndpoint: '/NewsletterTemplate',
    idField: 'newsletterTemplateId',
    nameField: 'newsletterTemplateName',
    formKind: 'simple',
    columns: simpleColumns('newsletterTemplateId', 'newsletterTemplateName'),
    searchFields: ['newsletterTemplateName'],
  },
  {
    key: 'paymentMethod',
    label: 'Méthode de paiement',
    icon: 'credit_card',
    apiEndpoint: '/PaymentMethod',
    idField: 'paymentMethodId',
    nameField: 'paymentMethodName',
    formKind: 'simple',
    columns: simpleColumns('paymentMethodId', 'paymentMethodName'),
    searchFields: ['paymentMethodName'],
  },
  {
    key: 'position',
    label: 'Poste',
    icon: 'work',
    apiEndpoint: '/Position',
    idField: 'positionId',
    nameField: 'positionName',
    formKind: 'simple',
    columns: simpleColumns('positionId', 'positionName'),
    searchFields: ['positionName'],
  },
  {
    key: 'professionalCategory',
    label: 'Catégorie professionnelle',
    icon: 'badge',
    apiEndpoint: '/ProfessionalCategory',
    idField: 'professionalCategoryId',
    nameField: 'professionalCategoryName',
    formKind: 'simple',
    columns: simpleColumns('professionalCategoryId', 'professionalCategoryName'),
    searchFields: ['professionalCategoryName'],
  },
  {
    key: 'socioCategory',
    label: 'Catégorie socio-professionnelle',
    icon: 'badge',
    apiEndpoint: '/SocioCategoryProfessional',
    idField: 'socioCategoryProfessionalId',
    nameField: 'socioCategoryProfessionalName',
    formKind: 'simple',
    columns: simpleColumns('socioCategoryProfessionalId', 'socioCategoryProfessionalName'),
    searchFields: ['socioCategoryProfessionalName'],
  },
];

export const COMPETENCES_ENTITIES: EntityConfig[] = [
  {
    key: 'degree',
    label: "Niveau d'étude",
    icon: 'school',
    apiEndpoint: '/Degree',
    idField: 'degreeId',
    nameField: 'name',
    formKind: 'simple',
    columns: simpleColumns('degreeId', 'name'),
    searchFields: ['name'],
  },
  {
    key: 'department',
    label: 'Département',
    icon: 'apartment',
    apiEndpoint: '/Department',
    idField: 'departmentId',
    nameField: 'name',
    formKind: 'department',
    formLabel: 'Nom du département',
    columns: [
      { header: '#', field: 'departmentId' },
      { header: 'Photo', image: true, imageEndpoint: '/Department/photo/{id}', imageFallback: 'Pas de photo' },
      { header: 'Nom', field: 'name' },
    ],
    searchFields: ['name'],
    formFields: DEPARTMENT_FIELDS as any,
  },
  {
    key: 'language',
    label: 'Langue',
    icon: 'translate',
    apiEndpoint: '/Language',
    idField: 'languageId',
    nameField: 'name',
    formKind: 'simple',
    columns: simpleColumns('languageId', 'name'),
    searchFields: ['name'],
  },
  {
    key: 'school',
    label: 'École',
    icon: 'school',
    apiEndpoint: '/School',
    idField: 'schoolId',
    nameField: 'name',
    formKind: 'simple',
    columns: simpleColumns('schoolId', 'name'),
    searchFields: ['name'],
  },
  {
    key: 'studyPath',
    label: 'Filière',
    icon: 'library_books',
    apiEndpoint: '/StudyPath',
    idField: 'studyPathId',
    nameField: 'studyPathName',
    formKind: 'simple',
    columns: simpleColumns('studyPathId', 'studyPathName'),
    searchFields: ['studyPathName'],
  },
];

export const PARAMETRES_CARRIERES: EntityGroupConfig = {
  title: 'Paramètre des carrières',
  subtitle: 'Gérez les référentiels du module carrières.',
  icon: 'settings',
  entities: CARRIERES_ENTITIES,
};

export const PARAMETRES_COMPETENCES: EntityGroupConfig = {
  title: 'Nomenclatures compétences',
  subtitle: 'Écoles, langues, diplômes, filières et départements. Le catalogue compétences est dans le référentiel.',
  icon: 'settings',
  entities: COMPETENCES_ENTITIES,
};
