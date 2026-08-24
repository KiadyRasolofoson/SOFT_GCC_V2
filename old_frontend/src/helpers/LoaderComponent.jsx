import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import loadingAnimation from '../assets/Loading4.json'; // Importez une animation JSON depuis LottieFiles

// affichage de loading d'un composant
const LoaderComponent = () => {
  return (
    <div style={loaderContainerStyle}>
      <Player
        autoplay
        loop
        src={loadingAnimation}
        style={{ height: '50px', width: '50px' }}
      />
    </div>
  );
};

const loaderContainerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: '1000',
};

export default LoaderComponent;
