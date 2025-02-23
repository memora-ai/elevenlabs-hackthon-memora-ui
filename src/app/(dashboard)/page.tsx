'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Memora } from '@/types/memora';
import { AgentCard } from '@/components/home/AgentCard';
import apiClient from '@/lib/apiClient';
import { useSideMenu } from '@/contexts/SideMenuContext';

const HomePage = (): JSX.Element => {
  const { t } = useTranslation();
  const { isCollapsed } = useSideMenu();

  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [sharedMemoras, setSharedMemoras] = useState<Memora[]>([]);
  const [publicMemoras, setPublicMemoras] = useState<Memora[]>([]);
  const [isFetchingMemoras, setIsFetchingMemoras] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isClient) {
      console.log('Looking if needs to go to login page....')
      console.log('isAuthenticated', isAuthenticated);
      console.log('isLoading', isLoading);
      console.log('isClient', isClient);

      // Only redirect if we're not already in the auth flow
      if (!window.location.pathname.includes('/api/auth')) {
        router.push('/api/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  useEffect(() => {
    async function fetchMemoras() {
      try {
        setIsFetchingMemoras(true);
        // Fetch private/shared memoras
        const sharedResponse = await apiClient.get('/memora/', {
          params: { privacy_status: 'private' }
        });
        setSharedMemoras(sharedResponse.data);

        // Fetch public memoras
        const publicResponse = await apiClient.get('/memora/');
        setPublicMemoras(publicResponse.data);
      } catch (error) {
        console.error('Error fetching memoras:', error);
      } finally {
        setIsFetchingMemoras(false);
      }
    }

    console.log('Lookin to fetch memoras...', isClient, isAuthenticated);
    if (isClient && isAuthenticated) {
      fetchMemoras();
    }
  }, [isClient, isAuthenticated]);

  // Don't render anything until we're on the client
  if (!isClient) {
    return <></>;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen">
        <div className="animate-pulse text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  
  // Only render the main content if authenticated
  if (!isAuthenticated) {
    return <></>;
  }

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  return (
    <main className={`flex flex-col min-h-screen p-6 gap-8 max-w-7xl mx-auto ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
      {/* Shared Agents Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Shared with you</h2>
        {isFetchingMemoras ? (
          <LoadingSkeleton />
        ) : sharedMemoras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedMemoras.map(memora => (
              <AgentCard
                key={memora.id}
                agent={memora}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No memoras have been shared with you yet.</p>
        )}
      </section>

      {/* Explore Section */}
      <section className="flex-1">
        <h2 className="text-xl font-semibold mb-4">Explore</h2>
        {isFetchingMemoras ? (
          <LoadingSkeleton />
        ) : publicMemoras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicMemoras.map(memora => (
              <AgentCard
                key={memora.id}
                agent={memora}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No public memoras to explore yet :( What about being the first one to create an awesome public memora of yourself?</p>
        )}
      </section>
    </main>
  );
};

export default HomePage;
