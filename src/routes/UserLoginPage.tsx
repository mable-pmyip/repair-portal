import { useNavigate } from 'react-router-dom';
import UserLogin from '../components/UserLogin';
import { PortalUser } from '../types';

interface UserLoginPageProps {
  onLoginSuccess: (user: PortalUser) => void;
}

export default function UserLoginPage({ onLoginSuccess }: UserLoginPageProps) {
  const navigate = useNavigate();

  const handleLogin = (user: PortalUser) => {
    onLoginSuccess(user);
    navigate('/submit');
  };

  return <UserLogin onLoginSuccess={handleLogin} />;
}
