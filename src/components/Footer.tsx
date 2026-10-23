// Footer.tsx — No react-router Link, no useNavigate. Uses onNavigate prop + plain <a> tags.

import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  logoFacebook,
  logoTwitter,
  logoInstagram,
  logoLinkedin,
} from 'ionicons/icons';
import { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
  active: string;
}

const footerCss = `
  .footer {
    background: #0a0909;
    border-top: 1px solid #0f0f0f;
    padding: 16px;
    margin-top: 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .footer-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .footer-text {
    font-size: 11px;
    color: #fff;
    text-align: center;
    line-height: 1.5;
  }
  .footer-heart {
    font-size: 11px;
  }
  .footer-socials {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .footer-socials a {
    color: #94a3b8;
    font-size: 18px;
    display: flex;
    align-items: center;
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer-socials a:hover {
    color: #f97316;
  }
  .footer-divider {
    height: 1px;
    background: #111010;
    margin-bottom: 12px;
  }
  .footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .footer-links button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    padding: 0;
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer-links button:hover {
    color: #f97316;
    text-decoration: underline;
  }
  .footer-dot {
    font-size: 11px;
    color: #cbd5e1;
  }
`;

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <>
      <style>{footerCss}</style>
      <footer className="footer">
        <div className="footer-top">
          <span className="footer-text">
            ©2026 Shri Enterprises
          </span>
       
        </div>

        <div className="footer-divider" />

        <div className="footer-links">
          <button onClick={() => onNavigate('contact' as Page)}>Contact</button>
          <span className="footer-dot">•</span>
          <button onClick={() => onNavigate('help' as Page)}>Help &amp; Support</button>
        </div>
      </footer>
    </>
  );
};

export default Footer;