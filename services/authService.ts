"use client";

export interface UserSession {
  username: string;
  role: string;
  loginTime: string;
}

const AUTH_KEY = "saras_authenticated";
const USER_KEY = "saras_user_session";

export const authService = {
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(AUTH_KEY) === "true";
  },

  getCurrentUser(): UserSession | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // SARAS MVP Credentials
    const validUser = "admin";
    const validPass = "saras123";

    if (username.trim() === validUser && password === validPass) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_KEY, "true");
        const session: UserSession = {
          username: validUser,
          role: "Mission Operator",
          loginTime: new Date().toISOString(),
        };
        sessionStorage.setItem(USER_KEY, JSON.stringify(session));
      }
      return { success: true };
    }

    return { success: false, error: "Invalid username or password" };
  },

  logout(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  },
};
