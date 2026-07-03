import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import './Login.css';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUserTie } from 'react-icons/fa'; // Modifier les icônes
import { urlApi } from "../../helpers/utils";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { initializeUser } = useUser();
  const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer le mot de passe

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
        // Initialiser le contexte utilisateur avec les nouvelles données
        await initializeUser();
        navigate("/softGcc/tableauBord");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (token) => {
    try {
      const response = await axios.get(urlApi("/Authentification/current-user"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'utilisateur:", error);
      throw error;
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

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
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
              </div>

              <div className="form-group">
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