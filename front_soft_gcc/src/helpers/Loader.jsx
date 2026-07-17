import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import loadingAnimation from '../assets/Loading1.json';

// Affichage d'animation de loading page
const Loader = () => {
  return (
    <div className="loader-overlay">
      <Player
        autoplay
        loop
        src={loadingAnimation}
        style={{ height: '150px', width: '150px' }}
      />
    </div>
  );
};

export default Loader;
