import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "./UserContext";
import PropTypes from 'prop-types';

const ProtectedRoute = ({ requiredPermission }) => {
  const location = useLocation();
  const { loading, isInitialized, hasPermission, userPermissions } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [checkTimeout, setCheckTimeout] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      console.log("=== VÉRIFICATION DES PERMISSIONS ===");
      console.log("Route actuelle:", location.pathname);
      console.log("Permission requise:", requiredPermission);
      console.log("Permissions actuelles:", userPermissions);
      
      if (!requiredPermission) {
        console.log("Aucune permission requise pour cette route");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      try {
        const hasRequiredPermission = hasPermission(requiredPermission);
        console.log("Résultat de la vérification:", hasRequiredPermission);
        console.log("=== FIN VÉRIFICATION DES PERMISSIONS ===");
        
        setIsAuthorized(hasRequiredPermission);
      } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Ajout d'un timeout pour éviter le chargement infini
    const timeoutId = setTimeout(() => {
      if (isChecking) {
        console.warn("Timeout lors de la vérification des permissions");
        setCheckTimeout(true);
        setIsChecking(false);
      }
    }, 5000); // Timeout après 5 secondes

    if (isInitialized && !loading) {
      setIsChecking(true);
      checkPermission();
    }

    return () => clearTimeout(timeoutId);
  }, [location.pathname, requiredPermission, isInitialized, loading, hasPermission, userPermissions]);

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
  if (!isInitialized || loading || isChecking) {
    console.log('Chargement en cours...');
    return <div>Chargement...</div>;
  }

  // Vérifier l'authentification
  const token = localStorage.getItem("token");
  if (!token) {
    console.log('Aucun token trouvé, redirection vers login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les permissions si nécessaire
  console.log("État final de isAuthorized avant redirection:", isAuthorized);
  if (requiredPermission && !isAuthorized) {
    console.log('Permission non accordée, redirection vers unauthorized');
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

ProtectedRoute.propTypes = {
  requiredPermission: PropTypes.string,
};

export default ProtectedRoute;
