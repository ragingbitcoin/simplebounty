import React from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../config/routes';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body p-6">
            <div className="mb-6">
              <h1 className="text-5xl font-bold text-gray-300 mb-3">404</h1>
              <h2 className="text-xl font-semibold mb-3">Page Not Found</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The page you're looking for doesn't exist.
              </p>
            </div>
            
            <button 
              onClick={() => navigate(ROUTES.CONNECT)}
              className="btn btn-primary w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 