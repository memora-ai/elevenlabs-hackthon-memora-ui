'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineUpload, HiCheck, HiExternalLink, HiX, HiInformationCircle } from 'react-icons/hi';
import apiClient from '@/lib/apiClient';
import { ProcessingModal } from '@/components/modals/ProcessingModal';
import { useRouter } from 'next/navigation';
import { useMemora } from '@/contexts/MemoraContext';

interface SocialImportProps {
  memoraId: number;
}

const SocialImport: React.FC<SocialImportProps> = ({ memoraId }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshMemoras } = useMemora();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  console.log('memoraId', memoraId)

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    
    if (file.name.toLowerCase().endsWith('.zip')) {
      setFile(file);
    } else {
      alert(t('Please select a ZIP file'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileChange(selectedFile || null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  }, []);

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('zip_file', file);

      const { data } = await apiClient.post(`/memora/${memoraId}/social-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowProcessingModal(true);
      
      await refreshMemoras();
      
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      alert(t('Upload failed. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-light pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            {t('Import Your Instagram or Facebook Data')}
          </h1>
          <p className="text-neutral-dark/70 mb-3">
            {t('Enhance your digital self with your Instagram or Facebook presence')}
          </p>
          <div className="bg-primary/10 p-4 rounded-lg inline-block">
            <p className="text-sm text-primary">
              <HiInformationCircle className="inline-block w-5 h-5 mr-2 mb-1" />
              {t('For the best experience, choose the social media platform you use most frequently and actively.')}
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <div className="bg-neutral-light rounded-xl p-8 border border-secondary-light">
            <input
              type="file"
              accept=".zip"
              onChange={handleInputChange}
              className="hidden"
              id="social-data"
            />
            
            {file ? (
              <div className="p-6 bg-secondary-light/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <HiCheck className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-primary truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-neutral-dark/60">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-secondary-light rounded-full text-neutral-dark/40 hover:text-neutral-dark/60 transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="social-data"
                className={`flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all
                  ${isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-secondary-light hover:border-secondary hover:bg-secondary-light/10'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <HiOutlineUpload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-primary mb-2">
                    {t('Upload Instagram or Facebook Data')}
                  </p>
                  <p className="text-sm text-neutral-dark/70 text-center max-w-sm">
                    {t('Drop your Instagram or Facebook data ZIP file here, or click to browse')}
                  </p>
                </div>
              </label>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className={`px-8 py-3 rounded-lg transition-colors w-full max-w-sm
                  ${file && !isUploading
                    ? 'bg-primary hover:bg-primary/90 text-neutral-light' 
                    : 'bg-secondary-light text-neutral-dark/40 cursor-not-allowed'
                  }`}
              >
                {isUploading 
                  ? t('Uploading...') 
                  : t('Complete Setup')
                }
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Accordion */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <HiInformationCircle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              {t('How to get your Instagram or Facebook data')}
            </h2>
          </div>

          {/* Tutorial Videos */}
          <div className="bg-neutral-light rounded-lg p-5 border border-secondary-light">
            <h3 className="font-medium text-primary mb-3">
              {t('Watch Tutorial Videos')}
            </h3>
            <div className="space-y-6">
              {/* Facebook Tutorial */}
              <div>
                <h4 className="text-sm font-medium text-primary mb-2">
                  {t('Facebook Data Export Tutorial')}
                </h4>
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/t-9-P3PQbZ0"
                    title="Facebook Data Export Tutorial"
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Instagram Tutorial */}
              <div>
                <h4 className="text-sm font-medium text-primary mb-2">
                  {t('Instagram Data Export Tutorial')}
                </h4>
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/YSD393oeZJM"
                    title="Instagram Data Export Tutorial"
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium flex items-center">
                <HiInformationCircle className="w-5 h-5 mr-2" />
                {t('Important: Make sure to select "JSON" as the format when requesting your data. Other formats will not work.')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-neutral-light rounded-lg p-5 border border-secondary-light">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-6 w-6 rounded-full bg-primary/10 items-center justify-center">
                  <span className="text-primary text-sm font-medium">1</span>
                </div>
                <h3 className="font-medium text-primary">
                  {t('Request Your Data')}
                </h3>
              </div>
              <ul className="space-y-2 ml-9">
                <li className="flex items-start gap-2">
                  <HiCheck className="mt-1 flex-shrink-0 text-primary" />
                  <span className="text-sm text-neutral-dark/70">
                    {t('Go to Settings and privacy > Accounts Center > Your information and permissions > Download your information')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <HiCheck className="mt-1 flex-shrink-0 text-primary" />
                  <span className="text-sm text-neutral-dark/70">
                    {t('Select "All information"')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <HiCheck className="mt-1 flex-shrink-0 text-primary" />
                  <span className="text-sm text-neutral-dark/70">
                    {t('Choose "JSON" as the format')}
                  </span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-light rounded-lg p-5 border border-secondary-light">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-6 w-6 rounded-full bg-primary/10 items-center justify-center">
                  <span className="text-primary text-sm font-medium">2</span>
                </div>
                <h3 className="font-medium text-primary">
                  {t('Wait for Processing')}
                </h3>
              </div>
              <div className="ml-9">
                <p className="text-sm text-neutral-dark/70 mb-3">
                  {t('Meta will process your request, which can take several hours. You\'ll receive an email when your data is ready to download.')}
                </p>
                <div className="bg-secondary-light/20 p-3 rounded-lg">
                  <p className="text-xs text-neutral-dark/70">
                    {t('You can close this page and come back later when you have your data.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <a
                href="https://www.facebook.com/help/212802592074644"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm"
              >
                <HiExternalLink className="mr-2" />
                {t('View detailed instructions on Meta Help Center')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <ProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
      />
    </div>
  );
};

export default SocialImport;