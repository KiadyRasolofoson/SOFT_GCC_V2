import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Template from '../pages/Template';
import SalaryList from '../pages/Evaluations/Notations/SalaryList';
import Notation from '../pages/Evaluations/Notations/Notation';
import ListSkillSalaryPage from '../pages/salarySkills/ListSkillSalaryPage';
import SalaryProfilePage from '../pages/salarySkills/SalaryProfilePage';
import SalaryListPlanning from '../pages/Evaluations/planning/SalaryListPlanning';
import ListSalaryPage from '../pages/career/careerPlan/ListCareerPage';
import CreationCareerPlan from '../pages/career/careerPlan/CreationCareerPlan';
import CareerProfilePage from '../pages/career/careerPlan/CareerProfilePage';
import EditAffectation from '../pages/career/careerPlan/EditAffectation';
import DetailAssignment from '../pages/career/careerPlan/DetailAssignment';
import EvalHistory from '../pages/Evaluations/History/EvalHistory';
import EvaluationInterviews from '../pages/Evaluations/EvaluationInterview/EvaluationInterviews';
import EvaluationDetails from '../pages/Evaluations/EvaluationInterview/EvaluationDetails';
import RetirementPage from '../pages/retirement/RetirementPage';
import FollowedWishEvolution from '../pages/wishEvolution/FollowedWishEvolution';
import DetailsWishEvolution from '../pages/wishEvolution/DetailsWishEvolution';
import AddWishEvolution from '../pages/wishEvolution/AddWishEvolution';
import EditWishEvolution from '../pages/wishEvolution/EditWishEvolution';
import Login from '../pages/Authentification/Login';
import Register from '../pages/Authentification/Register';
import DashboardPage from '../pages/dashboardStatistics/DashboardPage';
import EmployeeOrgChart from '../pages/OrganizationalChart/EmployeeOrgChart';
import DepartmentEffective from '../pages/OrganizationalChart/DepartmentEffective';
import DetailDepartment from '../pages/OrganizationalChart/DetailsDepartment';
import CsvUploader from '../pages/OrganizationalChart/CsvUploader';
import HistoryPage from '../pages/salarySkills/HistoryPage';
import ParametresCompetences from '../pages/settings/ParametresCompetences';
import ParametresCarrieres from '../pages/settings/ParametresCarrieres';
import UploadImage from '../pages/settings/UploadImage';
import CreateEmployeePage from '../pages/settings/employeeManagement/CreateEmployeePage';
import ListEmployeePage from '../pages/settings/employeeManagement/ListEmployeePage';
import EvaluationInterviewHome from '../pages/Evaluations/EvaluationInterview/EvaluationInterviewHome';
import ProtectedRoute from '../pages/Authentification/ProtectedRoute';
import Evaluations from '../pages/settings/evaluations/Evaluations';
import QuestionEvaluation from '../pages/settings/evaluations/Questionnaires/QuestionEvaluation';
import FormationSuggestions from '../pages/settings/evaluations/FormationSuggestion/FormationSuggestions';
import AdminSettings from '../pages/settings/evaluations/AdminSettings';
import EvaluationLogin from '../pages/Evaluations/SalaryEval/EvaluationLogin';
import EvaluationPage from '../pages/Evaluations/SalaryEval/EvaluationPage';
import ModelList from '../pages/certificateManagement/ModelList';
import ModelEdit from '../pages/certificateManagement/ModelEdit';
import EvaluationConfirmation from '../pages/Evaluations/SalaryEval/EvaluationConfirmation';
import UserManagement from '../pages/settings/UserManagement/UserManagement';
import UsersList from '../pages/settings/UserManagement/UsersList';
import RolesManagement from '../pages/settings/UserManagement/RolesManagement';
import PermissionsManagement from '../pages/settings/UserManagement/PermissionsManagement';
import Unauthorized from '../pages/Authentification/Unauthorized';
import EvaluationNotation from '../pages/Evaluations/Notations/EvaluationNotation';
import VerifyAttestationPage from '../pages/certificateManagement/VerifyAttestationPage';
import EvaluationTypesSettings from '../pages/settings/evaluations/EvaluationTypesSettings';
import BulletinCompetencesPage from '../pages/Evaluations/Bulletin/BulletinCompetencesPage';

function AppRouter() {
  return (
    <Routes>
      {/* ========== AUTHENTIFICATION ========== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/verify/:token" element={<VerifyAttestationPage />} />

      {/* ========== PORTAIL ÉVALUATION (accès salarié, non protégé) ========== */}
      <Route path="/soft-gcc/evaluation/connexion" element={<EvaluationLogin />} />
      <Route path="/soft-gcc/evaluation/questionnaire" element={<EvaluationPage />} />
      <Route path="/soft-gcc/evaluation/confirmation" element={<EvaluationConfirmation />} />

      {/* ========== ROUTES PROTÉGÉES ========== */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route path="/soft-gcc/tableau-de-bord" element={<DashboardPage />} />

        {/* Compétences */}
        <Route path="/soft-gcc/competences" element={<ListSkillSalaryPage />} />
        <Route path="/soft-gcc/competences/profil/:employeeId" element={<SalaryProfilePage />} />

        {/* Carrières */}
        <Route path="/soft-gcc/carrieres" element={<ListSalaryPage />} />
        <Route path="/soft-gcc/carrieres/creation" element={<CreationCareerPlan />} />
        <Route path="/soft-gcc/carrieres/fiche/:registrationNumber" element={<CareerProfilePage />} />
        <Route path="/soft-gcc/carrieres/fiche/modifier/:careerPlanId" element={<EditAffectation />} />
        <Route path="/soft-gcc/carrieres/fiche/detail/:careerPlanId" element={<DetailAssignment />} />

        {/* Retraite */}
        <Route path="/soft-gcc/retraite" element={<RetirementPage />} />

        {/* Souhaits d'évolution */}
        <Route path="/soft-gcc/souhaits-evolution" element={<FollowedWishEvolution />} />
        <Route path="/soft-gcc/souhaits-evolution/ajouter" element={<AddWishEvolution />} />
        <Route path="/soft-gcc/souhaits-evolution/details/:wishEvolutionId" element={<DetailsWishEvolution />} />
        <Route path="/soft-gcc/souhaits-evolution/modifier/:wishEvolutionId" element={<EditWishEvolution />} />

        {/* Organigramme et effectifs */}
        <Route path="/soft-gcc/effectifs" element={<DepartmentEffective />} />
        <Route path="/soft-gcc/effectifs/details/:departmentId" element={<DetailDepartment />} />
        <Route path="/soft-gcc/effectifs/importer" element={<CsvUploader />} />
        <Route path="/soft-gcc/organigramme" element={<EmployeeOrgChart />} />

        {/* Historique d'activités */}
        <Route path="/soft-gcc/historique" element={<HistoryPage />} />

        {/* Évaluations (interne) */}
        <Route path="/soft-gcc/evaluations/liste" element={<SalaryList />} />
        <Route path="/soft-gcc/evaluations/planning" element={<SalaryListPlanning />} />
        <Route path="/soft-gcc/evaluations/historique" element={<EvalHistory />} />
        <Route path="/soft-gcc/evaluations/entretiens" element={<EvaluationInterviews />} />
        <Route path="/soft-gcc/evaluations/accueil" element={<EvaluationInterviewHome />} />
        <Route path="/soft-gcc/evaluations/details" element={<EvaluationDetails />} />
        <Route path="/soft-gcc/evaluations/details/:interviewId" element={<EvaluationDetails />} />
        <Route path="/soft-gcc/evaluations/notation/employe/:employeeId" element={<EvaluationNotation />} />
        <Route path="/soft-gcc/evaluations/notation/evaluation/:evaluationId" element={<EvaluationNotation />} />

        {/* Paramètres - Compétences */}
        <Route path="/soft-gcc/parametres/competences" element={<ParametresCompetences />} />

        {/* Paramètres - Carrières */}
        <Route path="/soft-gcc/parametres/carrieres" element={<ParametresCarrieres />} />

        {/* Paramètres - Employés */}
        <Route path="/soft-gcc/parametres/employes/liste" element={<ListEmployeePage />} />
        <Route path="/soft-gcc/parametres/employes/creer" element={<CreateEmployeePage />} />

        {/* Paramètres - Utilisateurs */}
        <Route path="/soft-gcc/parametres/utilisateurs" element={<UserManagement />} />
        <Route path="/soft-gcc/parametres/utilisateurs/liste" element={<UsersList />} />
        <Route path="/soft-gcc/parametres/utilisateurs/roles" element={<RolesManagement />} />
        <Route path="/soft-gcc/parametres/utilisateurs/permissions" element={<PermissionsManagement />} />

        {/* Paramètres - Évaluations */}
        <Route path="/soft-gcc/evaluations/parametres" element={<Evaluations />} />
        <Route path="/soft-gcc/evaluations/parametres/questions" element={<QuestionEvaluation />} />
        <Route path="/soft-gcc/evaluations/parametres/formations" element={<FormationSuggestions />} />
        <Route path="/soft-gcc/evaluations/parametres/administration" element={<AdminSettings />} />
        <Route path="/soft-gcc/evaluations/parametres/types" element={<EvaluationTypesSettings />} />
        <Route path="/soft-gcc/evaluations/bulletin" element={<BulletinCompetencesPage />} />

        {/* Attestations */}
        <Route path="/soft-gcc/attestations" element={<ModelList />} />
        <Route path="/soft-gcc/attestations/modifier" element={<ModelEdit />} />

        {/* Upload image */}
        <Route path="/soft-gcc/parametres/upload-image" element={<UploadImage />} />
      </Route>

      {/* ========== REDIRECTIONS PARAMÉTRAGE (anciennes routes CRUD → consolidées) ========== */}
      <Route path="/soft-gcc/parametres/competences/crud" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/niveaux" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/departements" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/domaines" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/langues" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/ecoles" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/competences" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/competences/filieres" element={<Navigate to="/soft-gcc/parametres/competences" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/types-affectation" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/types-certificat" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/echelons" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/types-employe" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/etablissements" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/fonctions" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/indications" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/classes-legales" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/bulletins" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/methodes-paiement" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/postes" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/categories-professionnelles" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />
      <Route path="/soft-gcc/parametres/carrieres/categories-socio-professionnelles" element={<Navigate to="/soft-gcc/parametres/carrieres" replace />} />

      {/* ========== REDIRECTIONS RÉTROCOMPATIBLES (anciens → nouveaux) ========== */}
      <Route path="/Register" element={<Navigate to="/register" replace />} />
      <Route path="/EvaluationLogin" element={<Navigate to="/soft-gcc/evaluation/connexion" replace />} />
      <Route path="/employee-evaluation" element={<Navigate to="/soft-gcc/evaluation/questionnaire" replace />} />
      <Route path="/EvaluationConfirmation" element={<Navigate to="/soft-gcc/evaluation/confirmation" replace />} />
      <Route path="/salary-list" element={<Navigate to="/soft-gcc/evaluations/liste" replace />} />
      <Route path="/notation" element={<Navigate to="/soft-gcc/evaluations/liste" replace />} />
      <Route path="/planning" element={<Navigate to="/soft-gcc/evaluations/planning" replace />} />
      <Route path="/history" element={<Navigate to="/soft-gcc/evaluations/historique" replace />} />
      <Route path="/validation" element={<Navigate to="/soft-gcc/evaluations/entretiens" replace />} />
      <Route path="/homeInterview" element={<Navigate to="/soft-gcc/evaluations/accueil" replace />} />
      <Route path="/evaluation-details" element={<Navigate to="/soft-gcc/evaluations/details" replace />} />
      <Route path="/evaluation-details/:interviewId" element={<Navigate to="/soft-gcc/evaluations/details/:interviewId" replace />} />
      <Route path="/evaluations/salary-list" element={<Navigate to="/soft-gcc/evaluations/liste" replace />} />
      <Route path="/EvaluationSettings" element={<Navigate to="/soft-gcc/evaluations/parametres" replace />} />
      <Route path="/EvaluationQuestionSettings" element={<Navigate to="/soft-gcc/evaluations/parametres/questions" replace />} />
      <Route path="/EvaluationFormationSettings" element={<Navigate to="/soft-gcc/evaluations/parametres/formations" replace />} />
      <Route path="/EvaluationAdminSettings" element={<Navigate to="/soft-gcc/evaluations/parametres/administration" replace />} />
      <Route path="/EvaluationTypesSettings" element={<Navigate to="/soft-gcc/evaluations/parametres/types" replace />} />
      <Route path="/retraite" element={<Navigate to="/soft-gcc/retraite" replace />} />
      <Route path="/user-management" element={<Navigate to="/soft-gcc/parametres/utilisateurs" replace />} />
      <Route path="/users-list" element={<Navigate to="/soft-gcc/parametres/utilisateurs/liste" replace />} />
      <Route path="/roles-management" element={<Navigate to="/soft-gcc/parametres/utilisateurs/roles" replace />} />
      <Route path="/permissions-management" element={<Navigate to="/soft-gcc/parametres/utilisateurs/permissions" replace />} />
      <Route path="/evaluations/*" element={<Navigate to="/soft-gcc/evaluations/*" replace />} />
      <Route path="/softGcc/*" element={<Navigate to="/soft-gcc/*" replace />} />
      <Route path="/SoftGcc/*" element={<Navigate to="/soft-gcc/*" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRouter;
