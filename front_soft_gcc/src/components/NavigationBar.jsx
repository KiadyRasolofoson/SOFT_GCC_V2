import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../pages/Authentification/UserContext"; // Importez le hook useUser
import { Dropdown, Image } from 'react-bootstrap';

// Affichage de la barre de navigation
function NavigationBar({ task }) {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser(); // Récupérer l'utilisateur et l'état de chargement
  const [userName, setUserName] = useState('');

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  // Récupérer les infos utilisateur
  useEffect(() => {
    if (!userLoading && user) {
      setUserName(`${user.username}`);
    } else if (!userLoading && !user) {
      setUserName('Non connecté');
      navigate('/login');
    }
  }, [user, userLoading, navigate]);
  return (
    <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-center">
        <a className="navbar-brand brand-logo" href="index.html">
          <img src="/Logo/softwellogo.png" alt="logo" />
        </a>
        <a className="navbar-brand brand-logo-mini" href="index.html">
          <img src="/src/assets/images/logo-mini.svg" alt="logo" />
        </a>
      </div>
      <div className="navbar-menu-wrapper d-flex align-items-stretch">
        <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize">
          <span className="mdi mdi-menu"></span>
        </button>

        <ul className="navbar-nav ml-auto">
          <li className="nav-item nav-profile">
            <Dropdown align="end">
              <Dropdown.Toggle
                as="a"
                id="profileDropdown"
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
              >
                <div className="nav-profile-img mr-2">
                  <Image src="/images/user.png" alt="Profil" roundedCircle width={40} height={40} />
                </div>
                <div className="nav-profile-text">
                  <p className="mb-0 text-black">
                    {userLoading ? 'Chargement...' : userName || 'Non connecté'}
                  </p>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="p-0 border-0 font-size-sm">
                <div className="p-3 text-center bg-primary">
                  <Image
                    src="/src/assets/images/faces/user.png"
                    alt="Avatar"
                    roundedCircle
                    width={48}
                    height={48}
                  />
                </div>
                <div className="p-2">
                  <Dropdown.Divider />
                  <Dropdown.Header className="text-uppercase text-dark pl-2 mt-2">
                    Actions
                  </Dropdown.Header>
                  {!userLoading && user && (
                    <Dropdown.Item
                      className="py-1 d-flex align-items-center justify-content-between"
                      onClick={handleLogout}
                    >
                      <span>Déconnexion</span>
                      <i className="mdi mdi-logout ml-1" />
                    </Dropdown.Item>
                  )}
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </li>
        </ul>
        <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas">
          <span className="mdi mdi-menu"></span>
        </button>
      </div>
    </nav>
  );
}

export default NavigationBar;