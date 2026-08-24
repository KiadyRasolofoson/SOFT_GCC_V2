import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Register.css';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa'; // Ajout des icônes
import { urlApi } from "../../helpers/utils";


const Register = () => {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    password: "",
    roleId: 1,
    departementId: 1,
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

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

    try {
      const response = await axios.post(
        urlApi("/Authentification/register"),
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert("Inscription réussie !");
        navigate("/login");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Une erreur s'est produite.");
      } else {
        setError("Une erreur s'est produite lors de la communication avec le serveur.");
      }
      console.error("Erreur lors de l'inscription :", err);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo-container">
            <FaUserPlus className="logo-icon" />
          </div>
          <h1 className="app-title">Créer un compte</h1>
          <p className="app-subtitle">L'inscription est facile et rapide.</p>
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
                name="lastName"
                placeholder="Nom de famille"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="text"
                name="firstName"
                placeholder="Prénom"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
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
                type="password"
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mt-3">
            <button
              type="submit"
              className="register-button"
            >
              S'INSCRIRE
            </button>
          </div>
          <div className="text-center mt-4">
            Déjà un compte ?{" "}
            <a href="/login" className="login-link">
              Connexion
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;