import React from 'react';
import Template from '../Template';
import EntityManager from '../../components/EntityManager';
import DepartmentForm from './entities/DepartmentForm';
import { urlApi } from '../../helpers/utils';

const COMPETENCES_ENTITIES = [
  {
    key: 'degree',
    label: "Niveau d'étude",
    icon: 'mdi mdi-star',
    apiEndpoint: '/Degree',
    idField: 'degreeId',
    nameField: 'name',
  },
  {
    key: 'department',
    label: 'Département',
    icon: 'mdi mdi-domain',
    apiEndpoint: '/Department',
    idField: 'departmentId',
    nameField: 'name',
    formLabel: 'Nom du département',
    formComponent: DepartmentForm,
    getInitialForm: () => ({ name: '', photo: null }),
    getFormFromResponse: (data) => {
      let photoUrl = null;
      if (data.photo) {
        photoUrl = `${urlApi(`/Department/photo/${data.departmentId}`)}?t=${new Date().getTime()}`;
      }
      return { name: data.name || '', photo: photoUrl };
    },
    formatData: (formData) => {
      const form = new FormData();
      form.append('name', formData.name || '');
      if (formData.photo instanceof File) {
        form.append('photo', formData.photo);
      }
      return form;
    },
    columns: [
      { header: '#', render: (item) => item.departmentId },
      {
        header: 'Photo',
        render: (item) => item.photo
          ? <img src={`${urlApi(`/Department/photo/${item.departmentId}`)}?t=${new Date().getTime()}`} alt={item.name} style={{ borderRadius: '5px', width: '40px', height: '40px', objectFit: 'cover' }} />
          : 'Pas de photo'
      },
      { header: 'Nom', render: (item) => item.name },
    ],
    searchFields: ['name'],
  },
  {
    key: 'domainSkill',
    label: 'Domaine de compétence',
    icon: 'mdi mdi-briefcase',
    apiEndpoint: '/DomainSkill',
    idField: 'domainSkillId',
    nameField: 'name',
  },
  {
    key: 'language',
    label: 'Langue',
    icon: 'mdi mdi-book-open-variant',
    apiEndpoint: '/Language',
    idField: 'languageId',
    nameField: 'name',
  },
  {
    key: 'school',
    label: 'École',
    icon: 'mdi mdi-school',
    apiEndpoint: '/School',
    idField: 'schoolId',
    nameField: 'name',
  },
  {
    key: 'skill',
    label: 'Compétence',
    icon: 'mdi mdi-star-circle',
    apiEndpoint: '/Skill',
    idField: 'skillId',
    nameField: 'name',
  },
  {
    key: 'studyPath',
    label: 'Filière',
    icon: 'mdi mdi-library',
    apiEndpoint: '/StudyPath',
    idField: 'studyPathId',
    nameField: 'studyPathName',
  },
];

function ParametresCompetences() {
  return (
    <Template>
      <EntityManager
        title="PARAMÈTRE DES COMPÉTENCES"
        icon="mdi mdi-settings"
        entities={COMPETENCES_ENTITIES}
        basePath="parametres"
      />
    </Template>
  );
}

export default ParametresCompetences;
