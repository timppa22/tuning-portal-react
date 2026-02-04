"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

// Define User interface with credits and ban status
interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  credits?: number;
  email_verified: boolean;
  is_banned: boolean;
  ban_reason?: string | null;
  ban_expires_at?: string;
  last_login_date?: string;
  registration_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    emailVerificationSent?: boolean;
    verificationToken?: string;
  }>;
  verifyEmail: (code: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Refresh user data
  const refreshUserData = async () => {
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setError(null);
        } else {
          setUser(null);
          setError("Failed to refresh user data");
        }
      } else {
        setUser(null);
        setError("Failed to refresh user data");
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setUser(null);
      setError("Failed to refresh user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Skip auth check on auth routes
        if (pathname.startsWith("/auth/")) {
          setIsLoading(false);
          return;
        }

        await refreshUserData();
      } catch (error) {
        console.error("Initial auth check failed:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [pathname]);

  // Refresh user data periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(refreshUserData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setError(null);
        return true;
      } else {
        setError(data.error || "Login failed");
        return false;
      }
    } catch (error) {
      setError("An error occurred during login");
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setError(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        const message = result.error || "Registration failed";
        setError(message);
        return { success: false, error: message };
      }
      return {
        success: true,
        emailVerificationSent: result.emailVerificationSent,
        verificationToken: result.verificationToken,
      };
    } catch (error) {
      const message = "An error occurred during registration";
      setError(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Email verification failed");
        return false;
      }
      return true;
    } catch (error) {
      setError("An error occurred during email verification");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
        verifyEmail,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
