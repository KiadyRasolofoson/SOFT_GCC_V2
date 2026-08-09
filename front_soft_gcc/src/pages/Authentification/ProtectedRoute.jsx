import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "./UserContext";
import Template from "../Template";
import Loader from "../../helpers/Loader";
import PropTypes from 'prop-types';

const ProtectedRoute = ({ requiredPermission }) => {
  const location = useLocation();
  const {
    loading,
    isInitialized,
    hasPermission,
    userPermissions,
    canAccessRoute,
    modulesAccessReady,
  } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [checkTimeout, setCheckTimeout] = useState(false);
  const [moduleDenied, setModuleDenied] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setModuleDenied(false);

      // 1) Permission fine optionnelle (RBAC)
      if (requiredPermission) {
        try {
          const hasRequiredPermission = hasPermission(requiredPermission);
          setIsAuthorized(hasRequiredPermission);
          if (!hasRequiredPermission) {
            setIsChecking(false);
            return;
          }
        } catch (error) {
          console.error("Erreur lors de la vérification des permissions:", error);
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      } else {
        setIsAuthorized(true);
      }

      // 2) Visibilité module/page (Role_Modules) — bloque l'URL directe
      if (modulesAccessReady && location.pathname.startsWith('/soft-gcc')) {
        const allowed = canAccessRoute(location.pathname);
        if (!allowed) {
          setModuleDenied(true);
          setIsAuthorized(false);
        }
      }

      setIsChecking(false);
    };

    const timeoutId = setTimeout(() => {
      if (isChecking) {
        console.warn("Timeout lors de la vérification des permissions");
        setCheckTimeout(true);
        setIsChecking(false);
      }
    }, 5000);

    if (isInitialized && !loading) {
      setIsChecking(true);
      checkAccess();
    }

    return () => clearTimeout(timeoutId);
  }, [
    location.pathname,
    requiredPermission,
    isInitialized,
    loading,
    hasPermission,
    userPermissions,
    canAccessRoute,
    modulesAccessReady,
  ]);

  // Si timeout de vérification, on vérifie simplement le token
  if (checkTimeout) {
    console.warn('Timeout de vérification des permissions, vérification du token uniquement');
    const token = localStorage.getItem("token");
    if (!token) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
  }

  // Attendre que l'initialisation soit terminée
  if (!isInitialized || loading || isChecking || !modulesAccessReady) {
    return (
      <Template>
        <Loader />
      </Template>
    );
  }

  // Vérifier l'authentification
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

    // Vérifier les permissions si nécessaire
  if ((requiredPermission && !isAuthorized) || moduleDenied) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          title: 'Permission refusée',
          message: moduleDenied
            ? "Cette page n'est pas visible pour votre profil. Elle n'a pas été attribuée à votre rôle dans l'administration des accès."
            : "Vous n'avez pas la permission requise pour accéder à cette section."
        }}
        replace
      />
    );
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  requiredPermission: PropTypes.string,
};

export default ProtectedRoute;
