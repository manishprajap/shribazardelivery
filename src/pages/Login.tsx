import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Login.css';
import { apiPost, apiGet } from '../api'; // ✅ apiGet bhi chahiye 'today' status check ke liye
import { Geolocation } from '@capacitor/geolocation'; // ✅ FIX: raw navigator.geolocation WebView me unreliable hai, Capacitor plugin permission properly handle karta hai

interface LoginProps {
  onLogin: () => void;
  onRegisterClick: () => void;
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

const linkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#f97316',
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const ROLE_ID = 4;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

type Step = 'credentials' | 'otp' | 'checkin' | 'checking-status';
type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lng: number }
  | { status: 'error'; message: string };

const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'dev-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';

const Login: React.FC<LoginProps> = ({
  onLogin,
  onTermsClick,
  onPrivacyClick,
}) => {
  // step control — same page, no navigation to a separate component
  const [step, setStep] = useState<Step>('credentials');

  // credentials
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // checkin (selfie + geo-location) — ab daily attendance ke liye hai
  const [photo, setPhoto] = useState<string | null>(null); // base64 data URL
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [checkinLoading, setCheckinLoading] = useState(false);

  // shared
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') {
      const t = setTimeout(() => otpInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Step 1: credentials -> triggers OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost('delivery/login', {
        login,
        password,
        device_id: getDeviceId(),
      });

      setPhone(data.phone || login);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: OTP verify ke baad, aaj already check-in hai ya nahi check karo.
  // Agar already present marked hai (e.g. app kill hone ke baad dobara login),
  // toh selfie/location step skip karke seedha app me le jao.
  const checkTodayAttendanceAndProceed = async () => {
    setStep('checking-status');
    try {
      const data = await apiGet('delivery/attendance/today');
      if (data?.has_checked_in) {
        onLogin();
        return;
      }
    } catch {
      // status check fail ho jaaye to bhi safe side — checkin step dikhao
    }
    setStep('checkin');
    requestLocation();
  };

  // Step 2: verify OTP -> attendance status check -> selfie+location check-in
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost('verify-otp', {
        phone,
        otp,
        role_id: ROLE_ID,
        device_id: getDeviceId(),
      });

      if (data?.token) localStorage.setItem('auth_token', data.token);
      if (data?.user) localStorage.setItem('auth_user', JSON.stringify(data.user));

      setError('');
      await checkTodayAttendanceAndProceed();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await apiPost('resend-otp', { phone, role_id: ROLE_ID });
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setOtp('');
    setError('');
    setCooldown(0);
    if (timerRef.current !== null) clearInterval(timerRef.current);
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  // ── Geo-location ──
  // ✅ FIX: navigator.geolocation ki jagah @capacitor/geolocation use kar rahe hain.
  const requestLocation = useCallback(async () => {
    setLocation({ status: 'loading' });
    try {
      const perm = await Geolocation.checkPermissions();

      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          setLocation({
            status: 'error',
            message: 'Location permission denied. Please enable it from app settings and retry.',
          });
          return;
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      setLocation({
        status: 'ready',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch (err) {
      setLocation({
        status: 'error',
        message: 'Could not fetch location. Please enable it and retry.',
      });
    }
  }, []);

  // ── Selfie capture ──
  // Note: capture="user" front camera force karta hai — gallery se photo pick
  // nahi hoti, isliye live selfie hi aati hai (chrome/webview support ke sath).
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit daily attendance check-in, then finish login ──
  // ✅ CHANGE: ab 'delivery/face-checkin' ki jagah 'delivery/attendance/check-in'
  // call hota hai — isse har din ka proper attendance record banta hai
  // (status: present, history/summary screens me bhi dikhega).
  const handleCheckinSubmit = async () => {
    setError('');

    if (!photo) {
      setError('Please take a selfie to continue.');
      return;
    }
    if (location.status !== 'ready') {
      setError('Please share your location to continue.');
      return;
    }

    setCheckinLoading(true);
    try {
      await apiPost('delivery/attendance/check-in', {
        photo,
        lat: location.lat,
        lng: location.lng,
      });
      onLogin();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-brand">
        <div className="login-logo">
          <img src="/shrilogo.jpeg" alt="Shree logo" />
        </div>

        <p className="login-title">Shri Bazar</p>
        <p className="login-subtitle">
          {step === 'credentials' && 'Sign in to your account'}
          {step === 'otp' && `Enter the code sent to ${phone}`}
          {step === 'checking-status' && 'Checking today\u2019s attendance…'}
          {step === 'checkin' && 'Check-in to start your shift'}
        </p>
      </div>

      <div className="login-card">
        {step === 'credentials' && (
          <form className="login-form" onSubmit={handleCredentialsSubmit} noValidate>
            {/* Login */}
            <div className="form-group">
              <label htmlFor="login" className="form-label">
                Email Or Phone
              </label>

              <div className="input-wrapper">
                <input
                  id="login"
                  type="text"
                  className="form-input"
                  placeholder="Enter email or phone"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>

              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="field-footer">
                <button type="button" className="forgot-link">
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Terms & Privacy */}
            <p
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#888',
                marginTop: 16,
                lineHeight: 1.6,
              }}
            >
              By signing in, you agree to our{' '}
              <button type="button" onClick={onTermsClick} style={linkStyle}>
                Terms & Conditions
              </button>{' '}
              and{' '}
              <button type="button" onClick={onPrivacyClick} style={linkStyle}>
                Privacy Policy
              </button>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form className="login-form" onSubmit={handleOtpSubmit} noValidate>
            <button type="button" className="forgot-link" style={{ marginBottom: 8 }} onClick={handleBack}>
              ← Back
            </button>

            {/* OTP */}
            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                OTP Code
              </label>

              <div className="input-wrapper">
                <input
                  id="otp"
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={handleOtpInput}
                  maxLength={OTP_LENGTH}
                  disabled={loading}
                />
              </div>

              <div className="field-footer">
                {cooldown > 0 ? (
                  <span style={{ fontSize: 12, color: '#888' }}>
                    Resend code in {cooldown}s
                  </span>
                ) : (
                  <button type="button" className="forgot-link" onClick={handleResend}>
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || otp.length !== OTP_LENGTH}
            >
              {loading && <span className="btn-spinner" />}
              {loading ? 'Verifying…' : 'Verify & Sign in'}
            </button>
          </form>
        )}

        {step === 'checking-status' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', fontSize: 14, color: '#888' }}>
            <span className="btn-spinner" /> Checking today's attendance…
          </div>
        )}

        {step === 'checkin' && (
          <div className="login-form">
            {/* Selfie */}
            <div className="form-group">
              <label className="form-label">1. Selfie</label>

              {photo ? (
                <div
                  style={{
                    position: 'relative',
                    width: 140,
                    height: 140,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1.5px solid #e2e8f0',
                  }}
                >
                  <img src={photo} alt="Selfie preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={retakePhoto}
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: 14,
                    border: '1.5px dashed #f97316',
                    borderRadius: 10,
                    background: '#fff7ed',
                    color: '#ea580c',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  📷 Take Selfie
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">2. Location</label>

              {location.status === 'idle' && (
                <button
                  type="button"
                  onClick={requestLocation}
                  style={{
                    width: '100%',
                    padding: 14,
                    border: '1.5px dashed #f97316',
                    borderRadius: 10,
                    background: '#fff7ed',
                    color: '#ea580c',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  📍 Share Location
                </button>
              )}

              {location.status === 'loading' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' }}>
                  <span className="btn-spinner" /> Fetching your location…
                </div>
              )}

              {location.status === 'ready' && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  ✅ Location captured ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
                </div>
              )}

              {location.status === 'error' && (
                <>
                  <div className="error-banner" style={{ marginBottom: 8 }}>{location.message}</div>
                  <button
                    type="button"
                    onClick={requestLocation}
                    style={{
                      width: '100%',
                      padding: 14,
                      border: '1.5px dashed #f97316',
                      borderRadius: 10,
                      background: '#fff7ed',
                      color: '#ea580c',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Retry Location
                  </button>
                </>
              )}
            </div>

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Submit */}
            <button
              type="button"
              className="submit-btn"
              disabled={checkinLoading || !photo || location.status !== 'ready'}
              onClick={handleCheckinSubmit}
            >
              {checkinLoading && <span className="btn-spinner" />}
              {checkinLoading ? 'Marking attendance…' : 'Mark Present & Go Online'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;