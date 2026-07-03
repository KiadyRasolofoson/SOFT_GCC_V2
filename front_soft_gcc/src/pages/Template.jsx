import React, { Children } from 'react';
import NavigationBar from '../components/NavigationBar';
import MenuBar from '../components/MenuBar';
import Footer from '../components/Footer';

// Template des pages
function Template({children}) {
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
