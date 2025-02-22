'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { PrivacyStatus } from '@/types/memora';
import { useMemora } from '@/contexts/MemoraContext';

interface BasicInformationProps {
  onNext: (data: BasicInformationData, memoraId: number) => void;
}

export interface BasicInformationData {
  picture: File | null;
  fullName: string;
  birthday: string;
  isPublic: boolean;
  language: 'pt' | 'en';
}

const BasicInformation: React.FC<BasicInformationProps> = ({ onNext }) => {
  const { t } = useTranslation();
  const { refreshMemoras } = useMemora();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BasicInformationData>({
    picture: null,
    fullName: '',
    birthday: '',
    isPublic: true,
    language: 'en'
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, picture: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/[type];base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      // Convert image to base64 if it exists
      let profile_picture_base64: string | undefined;
      if (formData.picture) {
        profile_picture_base64 = await convertImageToBase64(formData.picture);
      }

      // Prepare the data for the API
      const memoraData = {
        full_name: formData.fullName,
        language: formData.language,
        birthday: formData.birthday,
        privacy_status: formData.isPublic ? 'public' : 'private' as PrivacyStatus,
        profile_picture_base64: profile_picture_base64
      };

      // Call the API
      const response = await apiClient.post('/memora/basic-info', memoraData);
      
      // Get the memora ID from the response
      const memoraId = response.data.id;

      // Refresh the memoras list in the sidebar
      await refreshMemoras();

      // Pass both the form data and memora ID to the next step
      onNext(formData, memoraId);
    } catch (error) {
      console.error('Error creating memora:', error);
      // You might want to add error handling here, such as showing a toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-light">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            {t('Basic Information')}
          </h1>
          <p className="mt-3 text-neutral-dark/70">
            {t('Lets start with some basic details about you')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-3">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Profile preview"
                  fill
                  className="rounded-full object-cover ring-4 ring-secondary-light"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-secondary-light flex items-center justify-center">
                  <span className="text-primary text-4xl">+</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="picture-upload"
            />
            <label
              htmlFor="picture-upload"
              className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
            >
              {t('Upload Profile Picture')}
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-dark">
                {t('Full Name')}
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-secondary-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-neutral-light text-neutral-dark"
                placeholder={t('Enter your full name as you\'d like it to appear')}
                required
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <label htmlFor="birthday" className="block text-sm font-medium text-neutral-dark">
                {t('Birthday')}
              </label>
              <input
                type="date"
                id="birthday"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full px-4 py-2.5 border border-secondary-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-neutral-light text-neutral-dark"
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-neutral-dark/60">
                {t('This helps personalize your experience')}
              </p>
            </div>

            {/* Privacy Setting */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-dark">
                {t('Privacy Setting')}
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: true })}
                    className="w-4 h-4 text-primary border-secondary-light focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-neutral-dark">
                    {t('Public Profile')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: false })}
                    className="w-4 h-4 text-primary border-secondary-light focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-neutral-dark">
                    {t('Private Profile')}
                  </span>
                </label>
              </div>
              <p className="text-xs text-neutral-dark/60">
                {formData.isPublic 
                  ? t('Anyone can find you and chat with you in Explore')
                  : t('Only people you choose can interact with you')}
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label htmlFor="language" className="block text-sm font-medium text-neutral-dark">
                {t('Language')}
              </label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'pt' | 'en' })}
                className="w-full px-4 py-2.5 border border-secondary-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-neutral-light text-neutral-dark"
                required
              >
                <option value="en">English</option>
                <option value="pt">Português (Brasil)</option>
              </select>
              <p className="text-xs text-neutral-dark/60">
                {t('Your preferred language for interactions')}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-3 bg-primary hover:bg-primary/90 text-neutral-light font-medium rounded-lg transition-colors relative ${
                isSubmitting ? 'cursor-not-allowed opacity-80' : ''
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-neutral-light border-t-transparent rounded-full animate-spin" />
                  <span>{t('Creating...')}</span>
                </div>
              ) : (
                t('Next Step')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BasicInformation;