import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useMemora } from '@/contexts/MemoraContext';
import apiClient from '@/lib/apiClient';
import { ImSpinner8 } from 'react-icons/im';
import { HiArrowPath } from 'react-icons/hi2';

interface RetryAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoraId: number;
}

export const RetryAnalyzerModal: React.FC<RetryAnalyzerModalProps> = ({ isOpen, onClose, memoraId }) => {
  const { t } = useTranslation();
  const { refreshMemoras } = useMemora();
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = async () => {
    try {
      setIsLoading(true);
      await apiClient.post(`/memora/${memoraId}/retry-analysis`);
      
      // Show success toast
      toast.success(t('Analysis retry initiated successfully'), {
        duration: 4000,
        position: 'top-center',
      });

      // Refresh memoras list
      await refreshMemoras();
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error retrying analysis:', error);
      // Show error toast
      toast.error(t('Failed to retry analysis. Please try again later.'), {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <HiArrowPath 
                className="h-6 w-6 text-primary animate-spin-slow" 
                aria-hidden="true" 
              />
            </div>
            
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                {t('Analysis Process Incomplete')}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-3">
                  {t('The last analysis process couldn\'t be completed successfully. Don\'t worry - you can try again, and it\'s a quick process.')}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 disabled:opacity-50"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRetry}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <ImSpinner8 className="w-4 h-4 animate-spin" />
                  <span>{t('Retrying...')}</span>
                </div>
              ) : (
                t('Retry Analysis')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 