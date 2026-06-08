import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const returnPath = location.state?.from?.pathname || '/products';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">K</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Kube<span className="text-blue-600">Cart</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sign in securely</h1>
          <p className="text-gray-500 text-sm mt-1">
            KubeCart uses Microsoft Entra ID
          </p>
        </div>

        <div className="card shadow-lg border-0 text-center">
          <p className="text-sm text-gray-600 mb-5">
            Continue with your organization or invited Microsoft account.
            KubeCart does not store your password.
          </p>
          <button
            type="button"
            id="entra-login"
            onClick={() => login(returnPath)}
            className="btn-primary w-full py-3"
          >
            Continue with Microsoft
          </button>
          <p className="mt-5 text-xs text-gray-400">
            Access is managed by the Microsoft Entra administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
