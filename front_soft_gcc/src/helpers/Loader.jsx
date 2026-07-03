import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import loadingAnimation from '../assets/Loading1.json'; // Importez une animation JSON depuis LottieFiles

// Affichage d'animation de loading page
const Loader = () => {
  return (
    <div style={loaderContainerStyle}>
      <Player
        autoplay
        loop
        src={loadingAnimation}
        style={{ height: '150px', width: '150px' }}
      />
    </div>
  );
};

const loaderContainerStyle = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: '1000',
};

export default Loader;
