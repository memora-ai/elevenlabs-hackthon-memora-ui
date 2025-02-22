import React from 'react';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { ImSpinner8 } from 'react-icons/im';

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <div className="flex justify-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <ImSpinner8 className="h-16 w-16 text-primary animate-spin" />
              </div>
            </div>
            
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Processing Social Media Data
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-3">
                  Your social media data is being processed. This can take from a few minutes to several hours, 
                  depending on your social media activity volume.
                </p>
                <p className="text-sm text-gray-500">
                  Once completed, your Memora status will automatically update to Concluded.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
              onClick={onClose}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 