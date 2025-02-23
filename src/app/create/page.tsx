'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import apiClient from '@/lib/apiClient';
import BasicInformation, { BasicInformationData } from '@/components/create/BasicInformation';
import VideoRecording from '@/components/create/VideoRecording';
import SocialImport from '@/components/create/SocialImport';
import Stepper from '@/components/create/Stepper';
import { Memora } from '@/types/memora';
import { useSideMenu } from '@/contexts/SideMenuContext';

type Step = 'intro' | 'basic' | 'video' | 'social';

function CreatePageContent() {
  const { t } = useTranslation();
  const { isCollapsed } = useSideMenu();

  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [basicData, setBasicData] = useState<BasicInformationData | null>(null);
  const [videoData, setVideoData] = useState<Blob | null>(null);
  const [memoraId, setMemoraId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const step = searchParams.get('step') as Step;
    const id = searchParams.get('memora_id');
    
    if (id && step) {
      setMemoraId(parseInt(id));
      setCurrentStep(step);
      fetchMemoraData(id);
    }
  }, [searchParams]);

  const fetchMemoraData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/memora/${id}`);
      const memora: Memora = response.data;
      
      // Convert memora data to BasicInformationData format
      setBasicData({
        fullName: memora.full_name,
        language: memora.language as 'pt' | 'en',
        birthday: memora.birthday,
        isPublic: memora.privacy_status === 'public',
        picture: memora.profile_picture_base64 ? new File([memora.profile_picture_base64], 'profile_picture.jpg', { type: 'image/jpeg' }) : null,
      });
    } catch (error) {
      console.error('Error fetching memora data:', error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const handleBasicInformationComplete = (data: BasicInformationData, newMemoraId: number) => {
    setBasicData(data);
    setMemoraId(newMemoraId);
    setCurrentStep('video');
  };

  const handleVideoRecordingComplete = (audioBlob: Blob) => {
    setVideoData(audioBlob);
    setCurrentStep('social');
  };

  return (
    <main
      className={`min-h-screen flex flex-col transition-all duration-300 pt-16 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      {currentStep !== 'intro' && <Stepper currentStep={currentStep} />}
      {currentStep === 'basic' && (
        <BasicInformation onNext={handleBasicInformationComplete} />
      )}
      {currentStep === 'video' && !isLoading && (
        <VideoRecording 
          onNext={handleVideoRecordingComplete} 
          language={basicData?.language || 'en'}
          memoraId={memoraId!}
        />
      )}
      {currentStep === 'social' && <SocialImport memoraId={memoraId!} />}
      {currentStep === 'intro' && (
        <div className="w-full bg-neutral-light pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-primary mb-4">
                {t('Create Your Memora')}
              </h1>
              <p className="text-xl text-neutral-dark/70">
                {t('Create a digital version of yourself in three simple steps.')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mt-12">
              <div className="bg-neutral-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-secondary-light hover:border-secondary">
                <div className="text-primary text-2xl font-bold mb-2">1</div>
                <h2 className="text-xl font-semibold text-primary mb-3">
                  {t('Basic Information')}
                </h2>
                <p className="text-neutral-dark/70">
                  {t('Share some basic details about yourself to personalize your digital presence.')}
                </p>
              </div>

              <div className="bg-neutral-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-secondary-light hover:border-secondary">
                <div className="text-primary text-2xl font-bold mb-2">2</div>
                <h2 className="text-xl font-semibold text-primary mb-3">
                  {t('Video Recording')}
                </h2>
                <p className="text-neutral-dark/70">
                  {t('Record a 10-second video of yourself reading a provided text. We will use this to create your digital voice and realistic lip movements.')}
                </p>
                <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-neutral-dark/80">
                    {t('💡 This helps us create:')}
                  </p>
                  <ul className="mt-2 text-sm text-neutral-dark/70 list-disc list-inside space-y-1">
                    <li>{t('A natural-sounding AI voice that matches yours')}</li>
                    <li>{t('Realistic lip synchronization for video responses')}</li>
                  </ul>
                </div>
              </div>

              <div className="bg-neutral-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-secondary-light hover:border-secondary">
                <div className="text-primary text-2xl font-bold mb-2">3</div>
                <h2 className="text-xl font-semibold text-primary mb-3">
                  {t('Social Import')}
                </h2>
                <p className="text-neutral-dark/70">
                  {t('Connect your social media to enhance your digital self with your online presence.')}
                </p>
                <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-neutral-dark/80">
                    {t('💡 This helps us understand:')}
                  </p>
                  <ul className="mt-2 text-sm text-neutral-dark/70 list-disc list-inside space-y-1">
                    <li>{t('Your unique speaking patterns and expressions')}</li>
                    <li>{t('Personal experiences and life moments')}</li>
                    <li>{t('Behavioral traits and conversation style')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-neutral-light font-medium rounded-lg transition-colors"
                onClick={() => setCurrentStep('basic')}
              >
                {t('Start Creation')}
              </button>
              <p className="mt-4 text-sm text-neutral-dark/60">
                {t('This process takes about 15 minutes. Make sure you are in a quiet environment with good lighting for the video recording.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}