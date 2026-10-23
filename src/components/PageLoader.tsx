import React from 'react';
import './PageLoader.css';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading…' }) => {
  return (
    <div className="page-loader">
      <div className="loader-content">
        <div className="loader-logo">
          <img src="/shrilogo.jpeg" alt="Shri Bazar" />
        </div>
        <div className="loader-spinner">
          <span /><span /><span />
        </div>
        <p className="loader-message">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;