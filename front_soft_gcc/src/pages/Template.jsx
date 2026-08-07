import React, { useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import MenuBar from '../components/MenuBar';
import Footer from '../components/Footer';

// Template des pages
function Template({children}) {
  // sidebar-fixed sur body (requis pour les selecteurs CSS .sidebar-fixed.sidebar-icon-only .main-panel)
  useEffect(() => {
    document.body.classList.add('sidebar-fixed');
    return () => {
      document.body.classList.remove('sidebar-fixed');
    };
  }, []);

  return (
    <div className='container-scroller'>
      <NavigationBar />
      <div className="container-fluid page-body-wrapper">
        <MenuBar />
        <div className="main-panel">
          <div className="content-wrapper">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Template;
