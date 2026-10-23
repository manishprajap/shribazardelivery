import React, { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';


const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);

  return isRegister ? (
    <Register onBack={() => setIsRegister(false)} />
  ) : (
    <Login
        onLogin={() => console.log('logged in')}
        onRegisterClick={() => setIsRegister(true)} onTermsClick={function (): void {
          throw new Error('Function not implemented.');
        } } onPrivacyClick={function (): void {
          throw new Error('Function not implemented.');
        } }    />
  );
};

export default AuthPage;