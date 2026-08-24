import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { UserProvider } from './pages/Authentification/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';
import 'react-loading-skeleton/dist/skeleton.css';
import './helpers/ErrorMessage.css';

function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
          <AppRouter />
          <ToastContainer />
        </Router>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;
