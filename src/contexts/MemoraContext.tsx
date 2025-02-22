'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Memora } from '@/types/memora';

interface MemoraContextType {
  refreshMemoras: () => Promise<void>;
  userMemoras: Memora[];
  recentMemoras: Memora[];
}

const MemoraContext = createContext<MemoraContextType | undefined>(undefined);

export function MemoraProvider({ children }: { children: React.ReactNode }) {
  const [userMemoras, setUserMemoras] = useState<Memora[]>([]);
  const [recentMemoras, setRecentMemoras] = useState<Memora[]>([]);

  const refreshMemoras = useCallback(async () => {
    try {
      const [ownResponse, recentResponse] = await Promise.all([
        apiClient.get('/memora/my-memoras'),
        apiClient.get('/memora', { params: { has_chat: true } })
      ]);
      setUserMemoras(ownResponse.data);
      setRecentMemoras(recentResponse.data);
    } catch (error) {
      console.error('Error refreshing memoras:', error);
    }
  }, []);

  return (
    <MemoraContext.Provider value={{ refreshMemoras, userMemoras, recentMemoras }}>
      {children}
    </MemoraContext.Provider>
  );
}

export function useMemora() {
  const context = useContext(MemoraContext);
  if (context === undefined) {
    throw new Error('useMemora must be used within a MemoraProvider');
  }
  return context;
} 