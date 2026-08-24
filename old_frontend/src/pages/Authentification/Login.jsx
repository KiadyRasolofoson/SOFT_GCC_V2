import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import './Login.css';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUserTie, FaExclamationCircle, FaWifi, FaInfoCircle } from 'react-icons/fa';
import { FaRedo } from 'react-icons/fa';
import { urlApi } from "../../helpers/utils";
import { getUserMessage } from "../../helpers/errorHandler";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [errorSuggestion, setErrorSuggestion] = useState("");
  const [errorType, setErrorType] = useState("auth"); // "auth", "network", "validation"
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { initializeUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [emptyFields, setEmptyFields] = useState({ identifier: false, password: false });
  const errorTimerRef = useRef(null);

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (error) {
      setDismissed(false);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setDismissed(true), 8000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field-level error on input
    setEmptyFields((prev) => ({ ...prev, [name]: false }));
    // Clear global error when user starts typing
    if (error) { setError(""); setErrorSuggestion(""); }
  };

  const validateForm = () => {
    const empty = {
      identifier: !formData.identifier.trim(),
      password: !formData.password.trim(),
    };
    setEmptyFields(empty);
    return !empty.identifier && !empty.password;
  };

  const getErrorMessage = (err) => {
    const { type, message, suggestion } = getUserMessage(err, "connexion");
    // Map errorHandler types to the UI types used in the banner
    const typeMap = {
      network: "network",
      timeout: "network",
      auth: "auth",
      license: "license",
      forbidden: "auth",
      server: "network",
      validation: "validation",
    };
    return {
      message,
      suggestion,
      type: typeMap[type] || "auth",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorSuggestion("");
    setDismissed(false);

    // Field-level validation
    if (!validateForm()) {
      setError("Veuillez remplir tous les champs.");
      setErrorType("validation");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        urlApi("/Authentification/login"),
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        await initializeUser();
        navigate("/soft-gcc/tableau-de-bord");
      }
    } catch (err) {
      const { message, suggestion, type } = getErrorMessage(err);
      setError(message);
      setErrorSuggestion(suggestion || "");
      setErrorType(type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-container">
        <div className="login-card">
          <div className="login-card-content">
            <div className="login-header">
              <div className="logo-container">
                <FaUserTie className="logo-icon" />
              </div>
              <h1 className="app-title">SOFT <span className="highlight">GCC</span></h1>
              <p className="app-subtitle">Gestion de Carrière et Compétences</p>
            </div>

            {error && !dismissed && (
              <div className={`error-banner error-banner--${errorType}`}>
                <div className="error-banner__icon">
                  {errorType === "network" ? <FaWifi /> : errorType === "validation" ? <FaInfoCircle /> : <FaExclamationCircle />}
                </div>
                <div className="error-banner__content">
                  <span className="error-banner__text">{error}</span>
                  {errorSuggestion && (
                    <span className="error-banner__hint">{errorSuggestion}</span>
                  )}
                </div>
                <div className="error-banner__actions-group">
                  {errorType === "network" && (
                    <button className="error-banner__retry" onClick={handleSubmit} title="Réessayer">
                      <FaRedo />
                    </button>
                  )}
                  <button className="error-banner__close" onClick={() => setDismissed(true)} aria-label="Fermer">&times;</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className={`form-group ${emptyFields.identifier ? "form-group--error" : ""}`}>
                <div className="input-with-icon">
                  <div className="input-icon">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Nom d'utilisateur ou email"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                  />
                </div>
                {emptyFields.identifier && <span className="field-error">Ce champ est requis</span>}
              </div>

              <div className={`form-group ${emptyFields.password ? "form-group--error" : ""}`}>
                <div className="input-with-icon">
                  <div className="input-icon">
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {emptyFields.password && <span className="field-error">Ce champ est requis</span>}
              </div>

              {/* <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Rester connecté
                </label>
                <a href="/forgot-password" className="forgot-password">
                  Mot de passe oublié ?
                </a>
              </div> */}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            {/* <p className="signup-link">
              Pas encore de compte ? <a href="/register">Créer un compte</a>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;