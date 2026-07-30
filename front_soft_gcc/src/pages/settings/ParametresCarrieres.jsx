import React from 'react';
import Template from '../Template';
import EntityManager from '../../components/EntityManager';
import EstablishmentForm from './entities/EstablishmentForm';
import { urlApi } from '../../helpers/utils';

const CARRIERES_ENTITIES = [
  {
    key: 'assignmentType',
    label: "Type d'affectation",
    icon: 'mdi mdi-account-arrow-right',
    apiEndpoint: '/AssignmentType',
    idField: 'assignmentTypeId',
    nameField: 'assignmentTypeName',
  },
  {
    key: 'certificateType',
    label: 'Type de certificat',
    icon: 'mdi mdi-certificate',
    apiEndpoint: '/CertificateType',
    idField: 'certificateTypeId',
    nameField: 'certificateTypeName',
  },
  {
    key: 'echelon',
    label: 'Échelon',
    icon: 'mdi mdi-stairs',
    apiEndpoint: '/Echelon',
    idField: 'echelonId',
    nameField: 'echelonName',
  },
  {
    key: 'employeeType',
    label: 'Type de contrat',
    icon: 'mdi mdi-account-tie',
    apiEndpoint: '/EmployeeType',
    idField: 'employeeTypeId',
    nameField: 'employeeTypeName',
  },
  {
    key: 'establishment',
    label: 'Établissement',
    icon: 'mdi mdi-domain',
    apiEndpoint: '/Establishment',
    idField: 'establishmentId',
    nameField: 'establishmentName',
    formComponent: EstablishmentForm,
    getInitialForm: () => ({
      establishmentName: '', adress: '', phoneNumber: '', email: '',
      website: '', socialMedia: '', nif: '', stat: '', logo: null
    }),
    getFormFromResponse: (data) => {
      let logoUrl = null;
      if (data.logo) {
        logoUrl = `${urlApi(`/Establishment/logo/${data.establishmentId}`)}?t=${new Date().getTime()}`;
      }
      return {
        establishmentName: data.establishmentName,
        adress: data.address || '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        website: data.website || '',
        socialMedia: data.socialMedia || '',
        nif: data.nif || '',
        stat: data.stat || '',
        logo: logoUrl,
      };
    },
    formatData: (formData) => {
      const form = new FormData();
      form.append('establishmentName', formData.establishmentName || '');
      form.append('adress', formData.adress || '');
      form.append('phoneNumber', formData.phoneNumber || '');
      form.append('email', formData.email || '');
      form.append('website', formData.website || '');
      form.append('socialMedia', formData.socialMedia || '');
      form.append('nif', formData.nif || '');
      form.append('stat', formData.stat || '');
      if (formData.logo instanceof File) {
        form.append('logo', formData.logo);
      }
      return form;
    },
    columns: [
      { header: '#', render: (item) => item.establishmentId },
      {
        header: 'Logo',
        render: (item) => item.logo
          ? <img src={`${urlApi(`/Establishment/logo/${item.establishmentId}`)}?t=${new Date().getTime()}`} alt={item.establishmentName} style={{ borderRadius: '5px', width: '40px', height: '40px', objectFit: 'cover' }} />
          : 'Pas de photo'
      },
      { header: 'Désignation', render: (item) => item.establishmentName },
      { header: 'Adresse', render: (item) => item.address || '-' },
      { header: 'Contact', render: (item) => item.phoneNumber || '-' },
    ],
    searchFields: ['establishmentName', 'address', 'phoneNumber', 'email'],
  },
  {
    key: 'fonction',
    label: 'Fonction',
    icon: 'mdi mdi-briefcase',
    apiEndpoint: '/Fonction',
    idField: 'fonctionId',
    nameField: 'fonctionName',
  },
  {
    key: 'indication',
    label: 'Indice',
    icon: 'mdi mdi-star',
    apiEndpoint: '/Indication',
    idField: 'indicationId',
    nameField: 'indicationName',
  },
  {
    key: 'legalClass',
    label: 'Classe légale',
    icon: 'mdi mdi-gavel',
    apiEndpoint: '/LegalClass',
    idField: 'legalClassId',
    nameField: 'legalClassName',
  },
  {
    key: 'newsletterTemplate',
    label: 'Bulletin',
    icon: 'mdi mdi-newspaper',
    apiEndpoint: '/NewsletterTemplate',
    idField: 'newsletterTemplateId',
    nameField: 'newsletterTemplateName',
  },
  {
    key: 'paymentMethod',
    label: 'Méthode de paiement',
    icon: 'mdi mdi-credit-card',
    apiEndpoint: '/PaymentMethod',
    idField: 'paymentMethodId',
    nameField: 'paymentMethodName',
  },
  {
    key: 'position',
    label: 'Poste',
    icon: 'mdi mdi-briefcase',
    apiEndpoint: '/Position',
    idField: 'positionId',
    nameField: 'positionName',
  },
  {
    key: 'professionalCategory',
    label: 'Catégorie professionnelle',
    icon: 'mdi mdi-account-tie',
    apiEndpoint: '/ProfessionalCategory',
    idField: 'professionalCategoryId',
    nameField: 'professionalCategoryName',
  },
  {
    key: 'socioCategory',
    label: 'Catégorie socio-professionnelle',
    icon: 'mdi mdi-account-tie',
    apiEndpoint: '/SocioCategoryProfessional',
    idField: 'socioCategoryProfessionalId',
    nameField: 'socioCategoryProfessionalName',
  },
];

function ParametresCarrieres() {
  return (
    <Template>
      <EntityManager
        title="PARAMÈTRE DES CARRIÈRES"
        icon="mdi mdi-settings"
        entities={CARRIERES_ENTITIES}
        basePath="parametres"
      />
    </Template>
  );
}

export default ParametresCarrieres;
