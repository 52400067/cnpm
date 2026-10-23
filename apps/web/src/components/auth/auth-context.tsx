"use client";

import React, { createContext, useContext, useState } from "react";

export type RoleTab = "BUYER" | "ORGANIZER";

interface AuthContextValue {
  roleTab: RoleTab;
  setRoleTab: (role: RoleTab) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [roleTab, setRoleTab] = useState<RoleTab>("BUYER");

  return (
    <AuthContext.Provider value={{ roleTab, setRoleTab }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      roleTab: "BUYER" as RoleTab,
      setRoleTab: () => {},
    };
  }
  return context;
}
