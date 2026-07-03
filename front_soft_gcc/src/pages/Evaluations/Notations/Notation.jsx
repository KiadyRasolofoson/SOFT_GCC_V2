import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Template from '../../Template';
import { Link } from 'react-router-dom';


function Notation() {
    const location = useLocation();
    const navigate = useNavigate();
    const isModalOpen = new URLSearchParams(location.search).get('modal') === 'open';
  
    return (
        <Template>
                <div>
        
        {isModalOpen && (
          <div className="modal fade show" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-scrollable" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modal title</h5>
                  <button type="button" className="close" aria-label="Close" onClick={() => navigate('/notation')}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  Content of the modal goes here...
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => navigate('/notation')}>Close</button>
                  <button type="button" className="btn btn-primary">Save changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        </Template>
      
    );
  }
  
export default Notation;