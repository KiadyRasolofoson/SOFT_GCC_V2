import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Template from '../Template';
import BreadcrumbPers from '../../helpers/BreadcrumbPers';
import Loader from '../../helpers/Loader';
import api from '../../helpers/api';
import EmployeeIdentityCard from '../../components/employee/EmployeeIdentityCard';
import EmployeeInfosPanel from '../../components/employee/EmployeeInfosPanel';
import EmployeeSkillsPanel from '../../components/employee/EmployeeSkillsPanel';
import EmployeeCareerPanel from '../../components/employee/EmployeeCareerPanel';
import './EmployeeFichePage.css';
import '../salarySkills/SalaryProfilePage.css';

const VALID_ESPACES = ['infos', 'competences', 'carrieres'];

function normalizeEspace(value) {
  if (VALID_ESPACES.includes(value)) return value;
  return 'infos';
}

function pickEmployeeId(employee) {
  return employee?.employeeId ?? employee?.EmployeeId ?? null;
}

function pickRegistrationNumber(employee) {
  return employee?.registrationNumber ?? employee?.RegistrationNumber ?? null;
}

async function resolveEmployeeIds(employeeKey) {
  const key = String(employeeKey || '').trim();
  if (!key) {
    throw new Error('Identifiant employé manquant.');
  }

  const isNumeric = /^\d+$/.test(key);
  let employeeId = null;
  let registrationNumber = null;
  let baseEmployee = null;

  if (isNumeric) {
    try {
      const { data } = await api.get(`/Employee/${key}`);
      if (data) {
        baseEmployee = data;
        employeeId = pickEmployeeId(data) ?? Number(key);
        registrationNumber = pickRegistrationNumber(data);
      }
    } catch {
      // continue
    }

    if (!registrationNumber) {
      try {
        const { data } = await api.get(`/EmployeeSkills/description/${key}`);
        const desc = Array.isArray(data) ? data[0] : data;
        if (desc) {
          baseEmployee = { ...baseEmployee, ...desc };
          employeeId = pickEmployeeId(desc) ?? Number(key);
          registrationNumber = pickRegistrationNumber(desc);
        }
      } catch {
        // continue
      }
    }
  }

  if (!registrationNumber || !employeeId) {
    const matriculeCandidate = registrationNumber || key;
    try {
      const { data: employees } = await api.get('/Employee');
      const found = (employees || []).find(
        (item) =>
          String(pickRegistrationNumber(item) || '').toLowerCase() ===
            String(matriculeCandidate).toLowerCase() ||
          (isNumeric && String(pickEmployeeId(item)) === key)
      );
      if (found) {
        baseEmployee = { ...baseEmployee, ...found };
        employeeId = pickEmployeeId(found) ?? employeeId;
        registrationNumber = pickRegistrationNumber(found) ?? registrationNumber ?? matriculeCandidate;
      } else if (!registrationNumber) {
        registrationNumber = matriculeCandidate;
      }
    } catch {
      if (!registrationNumber) {
        registrationNumber = matriculeCandidate;
      }
    }
  }

  if (!employeeId && isNumeric) {
    employeeId = Number(key);
  }

  if (!employeeId && !registrationNumber) {
    throw new Error('Employé introuvable.');
  }

  return { employeeId, registrationNumber, baseEmployee };
}

function EmployeeFichePage() {
  const navigate = useNavigate();
  const { employeeKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const espace = normalizeEspace(searchParams.get('espace'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [registrationNumber, setRegistrationNumber] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skillsDescription, setSkillsDescription] = useState(null);
  const [careerEmployee, setCareerEmployee] = useState(null);
  const [dataAssignmentAdvancement, setDataAssignmentAdvancement] = useState([]);
  const [dataAssignmentAppointment, setDataAssignmentAppointment] = useState([]);
  const [dataAssignmentAvailability, setDataAssignmentAvailability] = useState([]);

  const setEspace = (nextEspace) => {
    const value = normalizeEspace(nextEspace);
    const next = new URLSearchParams(searchParams);
    next.set('espace', value);
    setSearchParams(next, { replace: true });
  };

  const fetchCareerData = useCallback(async (matricule) => {
    if (!matricule) return null;
    const [careerResponse, advancementResponse, appointmentResponse, availabilityResponse] =
      await Promise.all([
        api.get(`/CareerPlan/careers/${matricule}`),
        api.get(`/CareerPlan/employee/${matricule}/advancement`),
        api.get(`/CareerPlan/employee/${matricule}/appointment`),
        api.get(`/CareerPlan/employee/${matricule}/availability`),
      ]);

    setCareerEmployee(careerResponse.data || null);
    setDataAssignmentAdvancement(advancementResponse.data || []);
    setDataAssignmentAppointment(appointmentResponse.data || []);
    setDataAssignmentAvailability(availabilityResponse.data || []);
    return careerResponse.data || null;
  }, []);

  const loadFiche = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolved = await resolveEmployeeIds(employeeKey);
      setEmployeeId(resolved.employeeId);
      setRegistrationNumber(resolved.registrationNumber);

      let skillsData = null;
      let careerData = null;

      const tasks = [];

      if (resolved.employeeId) {
        tasks.push(
          api
            .get(`/EmployeeSkills/description/${resolved.employeeId}`)
            .then((res) => {
              const raw = res.data;
              skillsData = Array.isArray(raw) ? raw[0] : raw;
              setSkillsDescription(skillsData || null);
            })
            .catch(() => {
              setSkillsDescription(null);
            })
        );
      } else {
        setSkillsDescription(null);
      }

      if (resolved.registrationNumber) {
        tasks.push(
          fetchCareerData(resolved.registrationNumber)
            .then((data) => {
              careerData = data;
            })
            .catch(() => {
              setCareerEmployee(null);
              setDataAssignmentAdvancement([]);
              setDataAssignmentAppointment([]);
              setDataAssignmentAvailability([]);
            })
        );
      }

      await Promise.all(tasks);

      const merged = {
        ...(resolved.baseEmployee || {}),
        ...(careerData || {}),
        ...(skillsData || {}),
        employeeId: resolved.employeeId ?? skillsData?.employeeId ?? null,
        registrationNumber:
          resolved.registrationNumber ||
          skillsData?.registrationNumber ||
          careerData?.registrationNumber ||
          null,
        name: skillsData?.name || careerData?.name || resolved.baseEmployee?.name,
        firstName:
          skillsData?.firstName || careerData?.firstName || resolved.baseEmployee?.firstName,
        birthday:
          skillsData?.birthday || careerData?.birthday || resolved.baseEmployee?.birthday,
        departmentName: skillsData?.departmentName || careerData?.departmentName,
        hiringDate:
          skillsData?.hiringDate ||
          careerData?.hiringDate ||
          careerData?.assignmentDate ||
          resolved.baseEmployee?.hiring_date ||
          resolved.baseEmployee?.hiringDate,
        photo: skillsData?.photo || resolved.baseEmployee?.photo,
        email: careerData?.email || resolved.baseEmployee?.email,
        positionName: careerData?.positionName,
        baseSalary: careerData?.baseSalary,
        netSalary: careerData?.netSalary,
        skillNumber: skillsData?.skillNumber,
        educationNumber: skillsData?.educationNumber,
        languageNumber: skillsData?.languageNumber,
        otherFormationNumber: skillsData?.otherFormationNumber,
        updatedDate: skillsData?.updatedDate,
      };

      setProfile(merged);

      if (!merged.employeeId && !merged.registrationNumber) {
        setError('Aucune donnée trouvée pour cet employé.');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la fiche employé.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [employeeKey, fetchCareerData]);

  useEffect(() => {
    loadFiche();
  }, [loadFiche]);

  const handleRetour = () => {
    if (espace === 'carrieres') {
      navigate('/soft-gcc/carrieres');
      return;
    }
    if (espace === 'competences') {
      navigate('/soft-gcc/competences');
      return;
    }
    navigate('/soft-gcc/parametres/employes/liste');
  };

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Accueil', path: '/soft-gcc/tableau-de-bord' },
    ];
    if (espace === 'carrieres') {
      items.push({ label: 'Plan de carrière', path: '/soft-gcc/carrieres' });
    } else if (espace === 'competences') {
      items.push({ label: 'Compétences', path: '/soft-gcc/competences' });
    } else {
      items.push({ label: 'Employés', path: '/soft-gcc/parametres/employes/liste' });
    }
    items.push({
      label: 'Fiche employé',
      path: `/soft-gcc/employes/fiche/${employeeKey}?espace=${espace}`,
    });
    return items;
  }, [espace, employeeKey]);

  const displayName = profile
    ? `${profile.name || ''} ${profile.firstName || ''}`.trim()
    : '';

  const mainTabs = [
    { id: 'infos', label: 'Infos', icon: 'mdi-information-outline' },
    { id: 'competences', label: 'Compétences', icon: 'mdi-school' },
    { id: 'carrieres', label: 'Carrières', icon: 'mdi-briefcase-account' },
  ];

  return (
    <Template>
      <div className="employee-fiche">
        <BreadcrumbPers items={breadcrumbItems} />

        <div className="fiche-page-header">
          <div className="fiche-header-left">
            <div className="fiche-header-icon">
              <i className="mdi mdi-account-badge" />
            </div>
            <div>
              <h1 className="fiche-header-title">Fiche employé</h1>
              {(displayName || registrationNumber) && (
                <p className="fiche-header-subtitle">
                  {displayName || '—'}
                  {registrationNumber ? ` · ${registrationNumber}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="fiche-header-actions">
            <button type="button" className="fiche-btn fiche-btn-secondary" onClick={handleRetour}>
              <i className="mdi mdi-arrow-left" />
              Retour
            </button>
          </div>
        </div>

        {loading && <Loader />}

        {!loading && error && <div className="fiche-error-state mb-3">{error}</div>}

        {!loading && !error && profile && (
          <>
            <div className="fiche-section">
              <EmployeeIdentityCard profile={profile} compact />
            </div>

            <div className="fiche-main-tabs" role="tablist">
              {mainTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={espace === tab.id}
                  className={`fiche-main-tab${espace === tab.id ? ' active' : ''}`}
                  onClick={() => setEspace(tab.id)}
                >
                  <i className={`mdi ${tab.icon}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {espace === 'infos' && <EmployeeInfosPanel profile={profile} />}

            {espace === 'competences' && (
              <EmployeeSkillsPanel
                employeeId={employeeId}
                skillsDescription={skillsDescription || profile}
              />
            )}

            {espace === 'carrieres' && (
              <EmployeeCareerPanel
                registrationNumber={registrationNumber}
                careerEmployee={careerEmployee || profile}
                dataAssignmentAppointment={dataAssignmentAppointment}
                dataAssignmentAdvancement={dataAssignmentAdvancement}
                dataAssignmentAvailability={dataAssignmentAvailability}
                fetchCareerData={() => fetchCareerData(registrationNumber)}
              />
            )}
          </>
        )}
      </div>
    </Template>
  );
}

export default EmployeeFichePage;
