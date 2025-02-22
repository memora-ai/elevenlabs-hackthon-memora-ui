'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useSideMenu } from '@/contexts/SideMenuContext';
import { useMemora } from '@/contexts/MemoraContext';
import { Memora } from '@/types/memora';
import { useRouter } from 'next/navigation';
import { ProcessingModal } from '@/components/modals/ProcessingModal';
import { RetryAnalyzerModal } from '@/components/modals/RetryAnalyzerModal';
import { ErrorModal } from '@/components/modals/ErrorModal';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type MemoraStatus =
  | "basic_info_completed"
  | "video_info_completed"
  | "processing_socialmedia_data"
  | "error_processing_video"
  | "concluded"
  | "concluded_with_analyzer_error"
  | "error";

const getStatusInfo = (status: MemoraStatus) => {
  switch (status) {
    case 'basic_info_completed':
      return { color: 'bg-blue-100 text-blue-800', label: 'B' };
    case 'video_info_completed':
      return { color: 'bg-purple-100 text-purple-800', label: 'V' };
    case 'processing_socialmedia_data':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'P' };
    case 'concluded':
      return { color: 'bg-green-100 text-green-800', label: 'C' };
    case 'concluded_with_analyzer_error':
      return { color: 'bg-orange-100 text-orange-800', label: 'C' };
    case 'error':
      return { color: 'bg-red-100 text-red-800', label: 'E' };
    case 'error_processing_video':
      return { color: 'bg-red-100 text-red-800', label: 'E' };
  }
};

const MemoraStatusCard = ({ memora }: { memora: Memora }) => {
  const statusInfo = getStatusInfo(memora.status as MemoraStatus);
  const router = useRouter();
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const { t } = useTranslation();

  const handleRetryAnalysis = async () => {
    // TODO: Implement the retry analysis API call
    console.log('Retrying analysis for memora:', memora.id);
  };

  const handleClick = () => {
    switch (memora.status) {
      case 'basic_info_completed':
        router.push(`/create?step=video&memora_id=${memora.id}`);
        break;
      case 'video_info_completed':
        router.push(`/create?step=social&memora_id=${memora.id}`);
        break;
      case 'processing_socialmedia_data':
        setIsProcessingModalOpen(true);
        break;
      case 'concluded':
        router.push(`/memora/${memora.id}`);
        break;
      case 'concluded_with_analyzer_error':
        setIsRetryModalOpen(true);
        break;
      case 'error_processing_video':
        toast.error(t('There was an error processing your video. Please try recording again.'), {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
          },
        });
        router.push(`/create?step=video&memora_id=${memora.id}`);
        break;
      case 'error':
        setIsErrorModalOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div 
        className="p-2 border rounded-lg shadow-sm mb-2 hover:shadow-md transition-shadow bg-white flex items-center cursor-pointer"
        onClick={handleClick}
      >
        {memora.profile_picture_base64 ? (
          <img 
            src={`data:image/jpeg;base64,${memora?.profile_picture_base64}`} 
            alt={memora.full_name}
            className="w-8 h-8 rounded-full mr-2 object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(memora.full_name)}&background=random`;
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">
              {memora.full_name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-gray-800 truncate">{memora.full_name}</h3>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span>{memora.language}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(memora.created_at || new Date()), { addSuffix: true })}</span>
          </div>
        </div>
        <div title={memora.status_message} className={`px-1 py-0.5 rounded text-[10px] font-medium ${statusInfo?.color}`}>
          {statusInfo?.label}
        </div>
      </div>
      
      <ProcessingModal 
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
      />

      <RetryAnalyzerModal 
        isOpen={isRetryModalOpen}
        onClose={() => setIsRetryModalOpen(false)}
        memoraId={memora.id}
      />

      <ErrorModal 
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        statusMessage={memora.status_message || 'An unexpected error occurred'}
        memoraId={memora.id}
      />
    </>
  );
};

export default function SideMenu() {
  const { isCollapsed, toggleCollapsed } = useSideMenu();
  const { userMemoras, recentMemoras, refreshMemoras } = useMemora();
  const [isLoadingOwn, setIsLoadingOwn] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  // Function to check if any memora is still processing
  const hasProcessingMemoras = () => {
    return userMemoras.some(memora => memora.status === 'processing_socialmedia_data');
  };

  // Setup polling when memoras change
  useEffect(() => {
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // If there are processing memoras, start polling
    if (hasProcessingMemoras()) {
      pollingIntervalRef.current = setInterval(() => {
        refreshMemoras();
      }, 30000); // 30 seconds
    }

    // Cleanup interval on unmount or when memoras change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userMemoras, refreshMemoras]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshMemoras();
      } finally {
        setIsLoadingOwn(false);
        setIsLoadingRecent(false);
      }
    };

    loadInitialData();
  }, [refreshMemoras]);

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-neutral-light border-r border-secondary-light flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-4 bg-neutral-light rounded-full p-1.5 border border-secondary-light shadow-sm hover:border-secondary transition-colors"
      >
        {isCollapsed ? (
          <HiChevronRight className="w-4 h-4 text-primary" />
        ) : (
          <HiChevronLeft className="w-4 h-4 text-primary" />
        )}
      </button>

      {/* Your Memoras Section */}
      <div className="p-2 border-b border-secondary-light">
        {!isCollapsed && (
          <h2 className="text-xs font-semibold text-primary mb-2">Your Memoras</h2>
        )}
        {isLoadingOwn ? (
          <div className="flex justify-center p-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : userMemoras.length > 0 ? (
          <div className="overflow-y-auto">
            {userMemoras.map((memora) => (
              <MemoraStatusCard key={memora.id} memora={memora} />
            ))}
          </div>
        ) : !isCollapsed ? (
          <p className="text-xs text-neutral-dark/60 text-center py-2">
            No memoras created yet.
          </p>
        ) : null}
      </div>

      {/* Recent Memoras Section */}
      <div className="p-2 flex-1">
        {!isCollapsed && (
          <h2 className="text-xs font-semibold text-primary mb-2">Recent Memoras</h2>
        )}
        {isLoadingRecent ? (
          <div className="flex justify-center p-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentMemoras.length > 0 ? (
          <ul className="space-y-1">
            {recentMemoras.map((memora) => (
              <li key={memora.id}>
                <Link
                  href={`/memora/${memora.id}`}
                  className={`flex items-center rounded hover:bg-secondary-light gap-2 transition-colors ${
                    isCollapsed ? 'p-1 justify-center' : 'p-2'
                  }`}
                >
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full ring-1 ring-secondary-light group-hover:ring-secondary transition-colors" />
                    <Image
                      src={memora.profile_picture_base64 ? `data:image/jpeg;base64,${memora.profile_picture_base64}` : `https://i.pravatar.cc/150?u=${encodeURIComponent(memora.full_name)}`}
                      alt={memora.full_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-neutral-dark truncate group-hover:text-primary transition-colors">
                        {memora.full_name}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : !isCollapsed ? (
          <p className="text-xs text-neutral-dark/60 text-center py-2">
            No recent conversations.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
