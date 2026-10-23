import React, { useState } from 'react';
import './Login.css';
import { IonButton } from '@ionic/react';

interface RegisterProps {
  onBack: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBack }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    aadhaar: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Device ID generator
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'dev-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name || !form.phone || !form.email  || !form.password) {
      return 'Please fill all fields';
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      return 'Enter valid 10-digit mobile number';
    }
/* 
    if (!/^[0-9]{12}$/.test(form.aadhaar)) {
      return 'Enter valid 12-digit Aadhaar number';
    } */

    if (form.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://shriecom.in/appapis/shreefood/public/api/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email,
            password: form.password,
            role_id: 4, // ✅ default
            device_id: getDeviceId(), // ✅ auto generated
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('Registration successful 🚀');

      // ✅ back to login
      onBack();

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* Brand */}
      <div className="login-brand">
        <div className="login-logo">
          <img src="/shrilogo.jpeg" alt="logo" />
        </div>
        <p className="login-title">Delivery Boy Register</p>
        <p className="login-subtitle">Create your account</p>
      </div>

      {/* Card */}
      <div className="login-card">
        <form className="login-form" onSubmit={handleSubmit}>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <div className="input-wrapper">
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

        

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error */}
          {error && <div className="error-banner">{error}</div>}

          {/* Submit */}
          <button className="submit-btn" disabled={loading}>
            {loading && <span className="btn-spinner" />}
            {loading ? 'Registering...' : 'Register'}
          </button>

        </form>
      </div>

      {/* Login link */}
      <div className="lm-register">
        <p>Already have an account?</p>
        <IonButton fill="clear" className="lm-register-btn" onClick={onBack}>
          Login
        </IonButton>
      </div>

    </div>
  );
};

export default Register;