import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  isAllowed: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, isAllowed, redirectTo = '/' }: ProtectedRouteProps) {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
