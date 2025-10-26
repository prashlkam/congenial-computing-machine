import React from 'react';
import { useAuth } from './auth/useAuth';
import LoginPage from './components/LoginPage';
import TanpuraSimulator from './components/TanpuraSimulator';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <TanpuraSimulator /> : <LoginPage />;
};

export default App;
