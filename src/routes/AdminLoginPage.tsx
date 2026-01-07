import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/admin');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}
