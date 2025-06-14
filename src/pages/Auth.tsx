
import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { login, register } = useAuth();

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MS Data Viewer</h1>
          <p className="text-gray-600">Real-time Mass Spectrometry Analysis Platform</p>
        </div>
        
        {isLoginMode ? (
          <LoginForm onLogin={login} onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onRegister={register} onToggleMode={toggleMode} />
        )}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 MS Data Viewer. Professional mass spectrometry analysis.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
