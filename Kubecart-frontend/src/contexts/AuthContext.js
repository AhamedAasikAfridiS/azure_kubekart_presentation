import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await authApi.get('/api/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = (returnPath = '/products') => {
    const safeReturnPath = returnPath.startsWith('/')
      ? returnPath
      : '/products';
    window.location.assign(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(safeReturnPath)}`
    );
  };

  const register = (returnPath = '/products') => login(returnPath);

  const logout = () => {
    setUser(null);
    window.location.assign('/.auth/logout?post_logout_redirect_uri=/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
