'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiVideoCamera, HiStop, HiRefresh, HiLightBulb } from 'react-icons/hi';
import apiClient from '@/lib/apiClient';
import { useMemora } from '@/contexts/MemoraContext';

interface VideoRecordingProps {
  onNext: (videoBlob: Blob) => void;
  language: 'pt' | 'en';
  memoraId: number;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

const VideoRecording: React.FC<VideoRecordingProps> = ({ onNext, language, memoraId }) => {
  const { t } = useTranslation();
  const { refreshMemoras } = useMemora();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdownToStart, setCountdownToStart] = useState<number | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  console.log('memoraId', memoraId);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // First request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}`
          }));
        
        const audioInputs = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`
          }));

        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        
        // Set default devices
        if (videoInputs.length) setSelectedVideo(videoInputs[0].deviceId);
        if (audioInputs.length) setSelectedAudio(audioInputs[0].deviceId);
      } catch (err) {
        console.error('Error getting media devices:', err);
      }
    };

    getDevices();
  }, []);

  // Initialize camera when device selection changes
  useEffect(() => {
    if (selectedVideo && selectedAudio && !isRecording && !recordingComplete) {
      initializeCamera();
    }
  }, [selectedVideo, selectedAudio]);

  const initializeCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideo ? { exact: selectedVideo } : undefined
        },
        audio: {
          deviceId: selectedAudio ? { exact: selectedAudio } : undefined
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const startCountdown = () => {
    setCountdownToStart(3);
    const countdownInterval = setInterval(() => {
      setCountdownToStart((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          startRecording();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) return;

      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        setRecordingComplete(true);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
        }
      };

      setTimeLeft(15);
      mediaRecorder.start();
      setIsRecording(true);

      // Set timeout for exactly 15 seconds
      setTimeout(() => {
        stopRecording();
      }, 12000);

      // Update the display timer every second
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const resetRecording = async () => {
    // Clear the video URL and recording state
    setRecordingComplete(false);
    setVideoUrl(null);
    setTimeLeft(15);

    // Stop any existing streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Reinitialize the camera with selected devices
    await initializeCamera();
  };

  const handleSubmit = async () => {
    try {
      if (videoChunksRef.current.length > 0) {
        setIsUploading(true);
        
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        
        // Create FormData and append video file
        const formData = new FormData();
        formData.append('video_file', videoBlob, 'recording.webm');

        // Upload video to the API
        await apiClient.post(`/memora/${memoraId}/video`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Refresh memoras after successful upload
        await refreshMemoras();

        // Call onNext to proceed to the next step
        onNext(videoBlob);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      // You might want to show an error modal here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-light">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            {t('Video Recording')}
          </h1>
          <p className="mt-2 text-sm text-neutral-dark/70">
            {t('Record a 10-second video of yourself. We will use this to create your digital voice and realistic lip movements.')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Sample Text - Moved to top */}
          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-sm font-medium text-neutral-dark">
              {t('Please read this text while recording the video')}:
            </h3>
            <p className="p-4 bg-neutral-light border border-secondary-light rounded-lg text-base text-neutral-dark">
              {language === 'pt'
                ? "Olá! Estou animado para criar minha versão digital. Espero que possamos ter conversas interessantes e significativas juntos."
                : "Hello! I'm excited to create my digital version. I hope we can have interesting and meaningful conversations together."}
            </p>
          </div>

          {/* Video Preview Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls={recordingComplete}
                muted={!recordingComplete}
                loop={false}
                className="w-full h-full object-cover"
              />
              {countdownToStart !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-6xl font-bold text-white">
                    {countdownToStart}
                  </span>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            {isRecording && (
              <div className="text-xl font-bold text-primary">
                {timeLeft}s
              </div>
            )}

            {!recordingComplete && !isRecording && countdownToStart === null && (
              <button
                onClick={startCountdown}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-primary hover:bg-primary/90 text-neutral-light transition-all"
              >
                <HiVideoCamera className="w-5 h-5" />
              </button>
            )}

            {recordingComplete && (
              <div className="flex items-center gap-4">
                <button
                  onClick={resetRecording}
                  className="p-3 rounded-full bg-secondary-light hover:bg-secondary-light/80 text-primary transition-colors"
                >
                  <HiRefresh className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <p className="text-sm text-neutral-dark/60">
              {countdownToStart !== null
                ? t('Starting in...') 
                : isRecording
                ? t('Recording in progress...')
                : recordingComplete
                ? t('Recording complete!')
                : t('Click the camera when you are ready to record')}
            </p>
          </div>

          {/* Device Selection */}
          {!isRecording && !recordingComplete && (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <div>
                <label className="block text-xs font-medium text-neutral-dark mb-1">
                  {t('Select Camera')}
                </label>
                <select
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-secondary-light focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-dark mb-1">
                  {t('Select Microphone')}
                </label>
                <select
                  value={selectedAudio}
                  onChange={(e) => setSelectedAudio(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-secondary-light focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Instructions - Updated with new styling and icon */}
          <div className="max-w-lg mx-auto bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <HiLightBulb className="w-5 h-5" />
              <h2 className="text-sm font-semibold">
                {t('Recording Instructions')}
              </h2>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-800/80">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('Find a quiet, well-lit room')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('Position yourself in the center of the frame')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('Ensure your face is clearly visible')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('Speak clearly and naturally')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('The recording will automatically stop after 15 seconds')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {t('Look at the camera while speaking')}
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          {recordingComplete && (
            <div className="max-w-lg mx-auto pt-4">
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="w-full px-6 py-2.5 bg-primary hover:bg-primary/90 text-neutral-light font-medium rounded-lg transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-neutral-light border-t-transparent rounded-full animate-spin mr-2" />
                    {t('Uploading...')}
                  </>
                ) : (
                  t('Next Step')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecording;