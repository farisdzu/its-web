import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  User,
  LoginResponse,
  authApi,
  getToken,
  getStoredUser,
  setStoredUser,
  clearAuthData,
  isTokenExpiringSoon,
} from '../services/api';

const TOKEN_KEY = 'its_auth_token';
const USER_KEY = 'its_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    forceLogout?: boolean
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);
  const isCheckingAuthRef = useRef(false);

  const isAuthenticated = !!user;

  const setupTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = window.setInterval(async () => {
      if (getToken() && isTokenExpiringSoon()) {
        try {
          await authApi.refresh();
        } catch {
          // Continue with current token if refresh fails
        }
      }
    }, REFRESH_CHECK_INTERVAL);
  }, []);

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (storedUser) {
      setUser(storedUser);
    }

    try {
      const response = await authApi.me();
      
      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id,
          name: response.data.name,
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone,
          avatar: response.data.avatar,
          role: response.data.role,
          employee_id: response.data.employee_id,
          org_unit_id: response.data.org_unit_id,
          org_unit_name: response.data.org_unit_name,
          title: response.data.title,
        };
        setUser(userData);
        setStoredUser(userData);
        setupTokenRefresh();
      } else {
        if (!getToken()) {
          clearAuthData();
          setUser(null);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        clearAuthData();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setupTokenRefresh]);

  useEffect(() => {
    if (isCheckingAuthRef.current) {
      return;
    }

    isCheckingAuthRef.current = true;
    checkAuth().finally(() => {
      isCheckingAuthRef.current = false;
    });
  }, [checkAuth]);

  // Handle tab visibility change - recheck auth when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getToken() && !isCheckingAuthRef.current) {
        // Revalidate auth when tab becomes visible (with debounce)
        isCheckingAuthRef.current = true;
        checkAuth().finally(() => {
          isCheckingAuthRef.current = false;
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        if (!isCheckingAuthRef.current) {
          isCheckingAuthRef.current = true;
          checkAuth().finally(() => {
            isCheckingAuthRef.current = false;
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      forceLogout: boolean = false
    ): Promise<LoginResponse> => {
      const response = await authApi.login(email, password, forceLogout);

      if (response.success && response.data) {
        setUser(response.data.user);
        setupTokenRefresh();
      }

      return response;
    },
    [setupTokenRefresh]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      clearAuthData();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
