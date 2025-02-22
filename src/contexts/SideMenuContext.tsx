'use client';

import React, { createContext, useContext, useState } from 'react';

interface SideMenuContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export function SideMenuProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <SideMenuContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const context = useContext(SideMenuContext);
  if (context === undefined) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
} 