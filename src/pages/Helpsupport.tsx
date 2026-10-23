// HelpSupport.tsx — Help & Support Page for Delivery Boy App

import React, { useState } from 'react';
import { Page } from '../App';
import { apiPost } from '../api';
import Footer from '../components/Footer';

interface Props {
  onNavigate: (page: Page) => void;
  onBack: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
}

const faqs = [
  {
    q: 'How do I accept a new delivery order?',
    a: 'When a new order is assigned to you, a notification will appear on your dashboard with order details. Tap "Accept Order" to confirm. You have a limited window to accept before it gets reassigned.',
  },
  {
    q: 'What should I do if I cannot reach the customer?',
    a: 'Try calling the customer at least 3 times. If unreachable, tap "Cannot Contact" in the order detail screen. Our support team will coordinate with the customer and guide you on next steps.',
  },
  {
    q: 'How is my earnings calculated?',
    a: 'Earnings are calculated per delivery based on distance, order value, and any active incentives. You can view the full breakdown in the Earnings section under your profile.',
  },
  {
    q: 'What happens if I miss a delivery?',
    a: 'Missed or failed deliveries affect your acceptance rate. Repeated failures may result in a temporary hold on your account. Always update order status in real time to avoid issues.',
  },
  {
    q: 'How do I report a damaged or wrong item?',
    a: 'Before picking up an order, verify the package. If something looks damaged or wrong, tap "Report Issue" on the order screen and take photos. Do not proceed with a delivery you are unsure about.',
  },
  {
    q: 'When do I receive my COD payments?',
    a: 'COD amounts collected from customers are settled on a weekly basis. You can check your pending COD balance on the dashboard under "COD Due".',
  },
];

const categories = [
  'Accident / Injury',
  'Face Address Issue',
  'Bike Accident / Breakdown',
  'Health / Medical Issue',
  'OverLoad / OverWeight',
  'Other',
];

// ─── CSS ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  :root {
    --orange:#f97316; --green:#22c55e; --red:#ef4444; --blue:#3b82f6;
    --t1:#1e293b; --t2:#64748b; --t3:#94a3b8; --bg:#f8fafc;
    --font:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
    --r:14px; --rm:10px; --shadow:0 1px 4px rgba(0,0,0,0.07);
  }
  *{box-sizing:border-box;margin:0;padding:0;}

  .hs-root{font-family:var(--font);color:var(--t1);background:var(--bg);min-height:100vh;display:flex;flex-direction:column;gap:16px;padding-bottom:0;}

  /* ── Header ── */
  .hs-header{background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);border-radius:18px;padding:20px;position:relative;overflow:hidden;}
  .hs-header::before{content:'';position:absolute;top:-40px;right:-40px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.1);pointer-events:none;}
  .hs-header::after{content:'';position:absolute;bottom:-20px;left:40px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;}
  .hs-back{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.4);border-radius:20px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:700;color:#fff;font-family:var(--font);margin-bottom:16px;width:fit-content;}
  .hs-header-icon{width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
  .hs-header-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;}
  .hs-header-sub{font-size:13px;color:rgba(255,255,255,0.8);line-height:1.5;}

  /* ── Quick Contact Cards ── */
  .hs-quick{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .hs-qcard{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;cursor:pointer;box-shadow:var(--shadow);text-decoration:none;transition:box-shadow .2s;}
  .hs-qcard:hover{box-shadow:0 4px 12px rgba(0,0,0,0.10);}
  .hs-qcard-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .hs-qcard-label{font-size:13px;font-weight:700;color:var(--t1);}
  .hs-qcard-sub{font-size:11px;color:var(--t3);}

  /* ── Section header ── */
  .hs-sec-title{font-size:15px;font-weight:700;color:var(--t1);margin-bottom:10px;}

  /* ── FAQ ── */
  .faq-list{display:flex;flex-direction:column;gap:8px;}
  .faq-item{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);}
  .faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:none;border:none;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;color:var(--t1);text-align:left;gap:10px;}
  .faq-q:focus-visible{outline:2px solid var(--orange);outline-offset:2px;}
  .faq-chevron{flex-shrink:0;transition:transform .25s;}
  .faq-chevron.open{transform:rotate(180deg);}
  .faq-a{font-size:13px;color:var(--t2);line-height:1.6;padding:0 16px 14px;border-top:1px solid #f8fafc;}

  /* ── Form ── */
  .hs-form-card{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);padding:18px;box-shadow:var(--shadow);}
  .hs-form-row{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
  .hs-form-row:last-child{margin-bottom:0;}
  .hs-label{font-size:12px;font-weight:600;color:var(--t2);}
  .hs-label span{color:var(--red);margin-left:2px;}
  .hs-input,.hs-select,.hs-textarea{width:100%;padding:11px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:var(--font);color:var(--t1);background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;}
  .hs-input:focus,.hs-select:focus,.hs-textarea:focus{border-color:var(--orange);box-shadow:0 0 0 3px rgba(249,115,22,0.12);}
  .hs-input.err,.hs-select.err,.hs-textarea.err{border-color:var(--red);}
  .hs-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
  .hs-textarea{resize:vertical;min-height:110px;line-height:1.5;}
  .hs-err-msg{font-size:11px;color:var(--red);margin-top:3px;}
  .hs-char-count{font-size:11px;color:var(--t3);text-align:right;margin-top:3px;}
  .hs-submit{width:100%;background:var(--orange);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;padding:13px;cursor:pointer;font-family:var(--font);transition:background .15s;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px;}
  .hs-submit:hover{background:#ea6c05;}
  .hs-submit:disabled{opacity:0.6;cursor:not-allowed;}

  /* ── Success state ── */
  .hs-success{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:var(--r);padding:28px 20px;text-align:center;}
  .hs-success-icon{font-size:40px;margin-bottom:12px;}
  .hs-success-title{font-size:16px;font-weight:700;color:#15803d;margin-bottom:6px;}
  .hs-success-sub{font-size:13px;color:#166534;line-height:1.5;margin-bottom:18px;}
  .hs-success-btn{background:var(--orange);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;padding:11px 24px;cursor:pointer;font-family:var(--font);}

  /* ── Info banner ── */
  .hs-info-banner{background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--r);padding:12px 14px;display:flex;gap:10px;align-items:flex-start;}
  .hs-info-text{font-size:12px;color:#1d4ed8;line-height:1.5;}
  .hs-info-text strong{font-weight:700;}

  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  .fade-in{animation:fadeIn .3s ease both;}
`;

// ─── Component ───────────────────────────────────────────────────────────────

const HelpSupport: React.FC<Props> = ({ onNavigate, onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '', phone: '', email: '', category: '', subject: '', message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.category) e.category = 'Please select a category';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Please describe your issue';
    else if (form.message.trim().length < 20) e.message = 'Message must be at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiPost('/support/ticket', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      // Laravel 422 validation errors — show inline on fields
      if (err?.errors) {
        const apiErrors: FormErrors = {};
        if (err.errors.name)     apiErrors.name     = err.errors.name[0];
        if (err.errors.phone)    apiErrors.phone    = err.errors.phone[0];
        if (err.errors.email)    apiErrors.email    = err.errors.email[0];
        if (err.errors.category) apiErrors.category = err.errors.category[0];
        if (err.errors.subject)  apiErrors.subject  = err.errors.subject[0];
        if (err.errors.message)  apiErrors.message  = err.errors.message[0];
        setErrors(apiErrors);
      } else {
        setSubmitError(err?.message || 'Failed to send your request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ name: '', phone: '', email: '', category: '', subject: '', message: '' });
    setErrors({});
    setSubmitError('');
  };

  return (
    <>
      <style>{css}</style>
      <div className="hs-root">

        {/* ── Header ── */}
        <div className="hs-header">
          <button className="hs-back" onClick={() => onBack()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="hs-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="hs-header-title">Help &amp; Support</div>
          <div className="hs-header-sub">We're here to help. Reach out anytime — our team responds within 24 hours.</div>
        </div>

        {/* ── Quick Contact ── */}
        <div>
          <div className="hs-sec-title">Quick Contact</div>
          <div className="hs-quick">
            <a className="hs-qcard" href="tel:+918604650538">
              <div className="hs-qcard-icon" style={{ background: '#f0fdf4' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.18a16 16 0 006.9 6.9l1.52-1.34a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="hs-qcard-label">Call Us</div>
              <div className="hs-qcard-sub">8604650538</div>
            </a>
            <a className="hs-qcard" href="https://wa.me/918604650538" target="_blank" rel="noopener noreferrer">
              <div className="hs-qcard-icon" style={{ background: '#f0fdf4' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.852L.057 23.521a.75.75 0 00.921.921l5.67-1.476A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.901 0-3.68-.526-5.198-1.437l-.371-.221-3.865 1.005 1.025-3.753-.243-.387A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
              </div>
              <div className="hs-qcard-label">WhatsApp</div>
              <div className="hs-qcard-sub">Chat with us</div>
            </a>
            <a className="hs-qcard" href="mailto:support@shreefood.com">
              <div className="hs-qcard-icon" style={{ background: '#eff6ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="hs-qcard-label">Email</div>
              <div className="hs-qcard-sub">support@shreefood.com</div>
            </a>
            <div className="hs-qcard" style={{ cursor: 'default' }}>
              <div className="hs-qcard-icon" style={{ background: '#fff7ed' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="hs-qcard-label">Hours</div>
              <div className="hs-qcard-sub">9 AM – 9 PM daily</div>
            </div>
          </div>
        </div>

        {/* ── Info Banner ── */}
        <div className="hs-info-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="hs-info-text">
            <strong>Tip:</strong> For faster resolution, use the form below and select the correct category. Tickets are usually resolved within <strong>4–8 hours</strong> on working days.
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <div className="hs-sec-title">Frequently Asked Questions</div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`faq-chevron ${openFaq === i ? 'open' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="faq-a fade-in">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact Form ── */}
        <div>
          <div className="hs-sec-title">Send Us a Message</div>

          {submitted ? (
            <div className="hs-success fade-in">
              <div className="hs-success-icon">✅</div>
              <div className="hs-success-title">Request Sent Successfully!</div>
              <div className="hs-success-sub">
                Our support team will review your issue and get back to you within few hours. Keep an eye on your phone for an SMS update.
              </div>
              <button className="hs-success-btn" onClick={handleReset}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <div className="hs-form-card">

              {/* Name */}
              <div className="hs-form-row">
                <label className="hs-label">Full Name <span>*</span></label>
                <input
                  className={`hs-input ${errors.name ? 'err' : ''}`}
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  maxLength={80}
                />
                {errors.name && <span className="hs-err-msg">{errors.name}</span>}
              </div>

              {/* Phone */}
              <div className="hs-form-row">
                <label className="hs-label">Mobile Number <span>*</span></label>
                <input
                  className={`hs-input ${errors.phone ? 'err' : ''}`}
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                />
                {errors.phone && <span className="hs-err-msg">{errors.phone}</span>}
              </div>

              {/* Email */}
              <div className="hs-form-row">
                <label className="hs-label">Email Address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className={`hs-input ${errors.email ? 'err' : ''}`}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                />
                {errors.email && <span className="hs-err-msg">{errors.email}</span>}
              </div>

              {/* Category */}
              <div className="hs-form-row">
                <label className="hs-label">Issue Category <span>*</span></label>
                <select
                  className={`hs-select ${errors.category ? 'err' : ''}`}
                  value={form.category}
                  onChange={e => handleChange('category', e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <span className="hs-err-msg">{errors.category}</span>}
              </div>

              {/* Subject */}
              <div className="hs-form-row">
                <label className="hs-label">Subject <span>*</span></label>
                <input
                  className={`hs-input ${errors.subject ? 'err' : ''}`}
                  type="text"
                  placeholder="Brief summary of your issue"
                  value={form.subject}
                  onChange={e => handleChange('subject', e.target.value)}
                  maxLength={120}
                />
                {errors.subject && <span className="hs-err-msg">{errors.subject}</span>}
              </div>

              {/* Message */}
              <div className="hs-form-row">
                <label className="hs-label">Message <span>*</span></label>
                <textarea
                  className={`hs-textarea ${errors.message ? 'err' : ''}`}
                  placeholder="Describe your issue in detail — include order ID if relevant…"
                  value={form.message}
                  onChange={e => handleChange('message', e.target.value)}
                  maxLength={1000}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                  {errors.message
                    ? <span className="hs-err-msg">{errors.message}</span>
                    : <span />}
                  <span className="hs-char-count">{form.message.length}/1000</span>
                </div>
              </div>

              {/* API error */}
              {submitError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#ef4444', marginBottom: 14 }}>
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button className="hs-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <Footer onNavigate={onNavigate} active="help" />

      </div>
    </>
  );
};

export default HelpSupport;