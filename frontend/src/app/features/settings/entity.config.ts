/** Modèle déclaratif d'une entité paramètre (miroir EntityManager React). */

export type EntityFormKind = 'simple' | 'establishment' | 'department' | 'fields';

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
  /** Résolution du libellé d'une clé étrangère dans la liste (endpoint des options). */
  optionsEndpoint?: string;
  /** Pour optionsEndpoint : champ libellé. */
  optionLabel?: string;
  /** Pour optionsEndpoint : champ valeur. */
  optionValue?: string;
}

export type EntityFormFieldType = 'text' | 'number' | 'select' | 'file';

export interface EntityFormField {
  name: string;
  label: string;
  required?: boolean;
  type?: EntityFormFieldType;
  placeholder?: string;
  /** Pour type='select' : endpoint de chargement des options (cascades métier). */
  optionsEndpoint?: string;
  /** Pour type='select' : champ libellé dans la liste d'options. */
  optionLabel?: string;
  /** Pour type='select' : champ valeur dans la liste d'options. */
  optionValue?: string;
  /** Pour type='file' : endpoint d'affichage de l'image en édition ({id}). */
  imageEndpoint?: string;
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
  /** Champs du formulaire (texte, nombre, liste déroulante, fichier). */
  formFields?: EntityFormField[];
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
  { name: 'name', label: 'Nom du département', required: true, type: 'text', placeholder: 'Nom du département' },
  {
    name: 'establishmentId',
    label: 'Établissement',
    type: 'select',
    optionsEndpoint: '/Establishment',
    optionLabel: 'establishmentName',
    optionValue: 'establishmentId',
  },
  { name: 'photo', label: 'Photo du département', type: 'file', imageEndpoint: '/Department/photo/{id}' },
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
    formKind: 'fields',
    formLabel: 'Désignation de l\'échelon',
    columns: [
      { header: '#', field: 'echelonId' },
      { header: 'Désignation', field: 'echelonName' },
      {
        header: 'Classe légale',
        field: 'legalClassId',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
      {
        header: 'Indice',
        field: 'indicationId',
        optionsEndpoint: '/Indication',
        optionLabel: 'indicationName',
        optionValue: 'indicationId',
      },
      { header: 'Durée min (mois)', field: 'minMonths' },
    ],
    searchFields: ['echelonName'],
    formFields: [
      { name: 'echelonName', label: 'Désignation de l\'échelon', required: true, type: 'text', placeholder: 'Ex. Échelon 1' },
      {
        name: 'legalClassId',
        label: 'Classe légale',
        type: 'select',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
      {
        name: 'indicationId',
        label: 'Indice',
        type: 'select',
        optionsEndpoint: '/Indication',
        optionLabel: 'indicationName',
        optionValue: 'indicationId',
      },
      { name: 'minMonths', label: 'Durée minimale (mois)', type: 'number', placeholder: 'Ex. 24' },
    ],
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
    formKind: 'fields',
    formLabel: 'Désignation de l\'indice',
    columns: [
      { header: '#', field: 'indicationId' },
      { header: 'Désignation', field: 'indicationName' },
      {
        header: 'Classe légale',
        field: 'legalClassId',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
      { header: 'Valeur', field: 'indicationValue' },
      { header: 'Point', field: 'pointValue' },
    ],
    searchFields: ['indicationName'],
    formFields: [
      { name: 'indicationName', label: 'Désignation de l\'indice', required: true, type: 'text', placeholder: 'Ex. Indice 300' },
      {
        name: 'legalClassId',
        label: 'Classe légale',
        type: 'select',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
      { name: 'indicationValue', label: 'Valeur de l\'indice', type: 'number', placeholder: '300' },
      { name: 'pointValue', label: 'Valeur du point', type: 'number', placeholder: '50,00' },
    ],
  },
  {
    key: 'legalClass',
    label: 'Classe légale',
    icon: 'gavel',
    apiEndpoint: '/LegalClass',
    idField: 'legalClassId',
    nameField: 'legalClassName',
    formKind: 'fields',
    formLabel: 'Désignation de la classe légale',
    columns: [
      { header: '#', field: 'legalClassId' },
      { header: 'Désignation', field: 'legalClassName' },
      {
        header: 'Catégorie pro.',
        field: 'professionalCategoryId',
        optionsEndpoint: '/ProfessionalCategory',
        optionLabel: 'professionalCategoryName',
        optionValue: 'professionalCategoryId',
      },
      { header: 'Min. salaire', field: 'minSalary' },
    ],
    searchFields: ['legalClassName'],
    formFields: [
      { name: 'legalClassName', label: 'Désignation de la classe légale', required: true, type: 'text', placeholder: 'Ex. Classe 1' },
      {
        name: 'professionalCategoryId',
        label: 'Catégorie professionnelle',
        type: 'select',
        optionsEndpoint: '/ProfessionalCategory',
        optionLabel: 'professionalCategoryName',
        optionValue: 'professionalCategoryId',
      },
      { name: 'minSalary', label: 'Salaire minimum', type: 'number', placeholder: '150000,00' },
    ],
  },
  {
    key: 'newsletterTemplate',
    label: 'Bulletin',
    icon: 'newspaper',
    apiEndpoint: '/NewsletterTemplate',
    idField: 'newsletterTemplateId',
    nameField: 'newsletterTemplateName',
    formKind: 'fields',
    formLabel: 'Nom du modèle de bulletin',
    columns: [
      { header: '#', field: 'newsletterTemplateId' },
      { header: 'Désignation', field: 'newsletterTemplateName' },
      {
        header: 'Type de contrat',
        field: 'employeeTypeId',
        optionsEndpoint: '/EmployeeType',
        optionLabel: 'employeeTypeName',
        optionValue: 'employeeTypeId',
      },
      { header: 'Taux déduction %', field: 'deductionRate' },
    ],
    searchFields: ['newsletterTemplateName'],
    formFields: [
      { name: 'newsletterTemplateName', label: 'Nom du modèle de bulletin', required: true, type: 'text', placeholder: 'Ex. Standard Cadre 40h' },
      {
        name: 'employeeTypeId',
        label: 'Type de contrat',
        type: 'select',
        optionsEndpoint: '/EmployeeType',
        optionLabel: 'employeeTypeName',
        optionValue: 'employeeTypeId',
      },
      { name: 'deductionRate', label: 'Taux de déduction (%)', type: 'number', placeholder: '15,00' },
    ],
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
    formKind: 'fields',
    formLabel: 'Nom du poste',
    columns: [
      { header: '#', field: 'positionId' },
      { header: 'Désignation', field: 'positionName' },
      {
        header: 'Département',
        field: 'departmentId',
        optionsEndpoint: '/Department',
        optionLabel: 'name',
        optionValue: 'departmentId',
      },
      {
        header: 'Catégorie pro.',
        field: 'professionalCategoryId',
        optionsEndpoint: '/ProfessionalCategory',
        optionLabel: 'professionalCategoryName',
        optionValue: 'professionalCategoryId',
      },
      {
        header: 'Classe légale',
        field: 'legalClassId',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
    ],
    searchFields: ['positionName'],
    formFields: [
      { name: 'positionName', label: 'Nom du poste', required: true, type: 'text', placeholder: 'Nom du poste' },
      {
        name: 'departmentId',
        label: 'Département',
        type: 'select',
        optionsEndpoint: '/Department',
        optionLabel: 'name',
        optionValue: 'departmentId',
      },
      {
        name: 'professionalCategoryId',
        label: 'Catégorie professionnelle',
        type: 'select',
        optionsEndpoint: '/ProfessionalCategory',
        optionLabel: 'professionalCategoryName',
        optionValue: 'professionalCategoryId',
      },
      {
        name: 'legalClassId',
        label: 'Classe légale',
        type: 'select',
        optionsEndpoint: '/LegalClass',
        optionLabel: 'legalClassName',
        optionValue: 'legalClassId',
      },
    ],
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
    formKind: 'fields',
    formLabel: 'Nom du département',
    columns: [
      { header: '#', field: 'departmentId' },
      { header: 'Photo', image: true, imageEndpoint: '/Department/photo/{id}', imageFallback: 'Pas de photo' },
      { header: 'Nom', field: 'name' },
      {
        header: 'Établissement',
        field: 'establishmentId',
        optionsEndpoint: '/Establishment',
        optionLabel: 'establishmentName',
        optionValue: 'establishmentId',
      },
    ],
    searchFields: ['name'],
    formFields: DEPARTMENT_FIELDS as unknown as EntityFormField[],
  },
  {
    key: 'domainSkill',
    label: 'Domaine de compétence',
    icon: 'work',
    apiEndpoint: '/DomainSkill',
    idField: 'domainSkillId',
    nameField: 'name',
    formKind: 'simple',
    columns: simpleColumns('domainSkillId', 'name'),
    searchFields: ['name'],
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
    key: 'skill',
    label: 'Compétence',
    icon: 'star',
    apiEndpoint: '/Skill',
    idField: 'skillId',
    nameField: 'name',
    formKind: 'simple',
    columns: simpleColumns('skillId', 'name'),
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
  title: 'Paramètre des compétences',
  subtitle: 'Gérez les référentiels du module compétences.',
  icon: 'settings',
  entities: COMPETENCES_ENTITIES,
};
