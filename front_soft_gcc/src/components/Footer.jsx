import React from 'react';

// Contenu du pied de page
function Footer({ task }) {
  return (
    <footer className="footer">
        <div className="footer-inner-wraper">
            <div className="d-sm-flex justify-content-center justify-content-sm-between">
                <span className="text-muted d-block text-center text-sm-left d-sm-inline-block"><strong>Copyright © 2025 <a href="https://www.softwell.mg/" target="_blank">Softwell</a></strong>. All rights reserved. </span>
                <span className="float-none float-sm-right d-block mt-1 mt-sm-0 text-center"><strong>Version 1.0.0</strong> </span>
            </div>
        </div>
    </footer>
  );
}

export default Footer;
