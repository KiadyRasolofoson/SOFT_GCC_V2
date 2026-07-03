import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { UserProvider } from './pages/Authentification/UserContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';
import 'react-loading-skeleton/dist/skeleton.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRouter />
        <ToastContainer /> {/* Ajoutez ce composant */}
      </Router>
    </UserProvider>
  );
}

export default App;
