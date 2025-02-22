import React from 'react';
import { useRouter } from 'next/navigation';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusMessage: string;
  memoraId?: number;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, statusMessage, memoraId }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleTryAgain = () => {
    if (memoraId) {
      router.push(`/create?step=social&memora_id=${memoraId}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Oops... Something Went Wrong
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-3">
                  We apologize for the inconvenience. Our team has been notified and we are working to fix this issue as quickly as possible.
                </p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">
                    Error details:
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {statusMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
              onClick={onClose}
            >
              Close
            </button>
            {memoraId && (
              <button
                type="button"
                className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                onClick={handleTryAgain}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 