export type PrivacyStatus = 'public' | 'private';

export interface Memora {
  id: number;
  full_name: string;
  bio?: string;
  description?: string;
  speak_pattern?: string;
  language: string;
  birthday: string;
  privacy_status: PrivacyStatus;
  user_id: string;
  status: string;
  status_message?: string;
  video_path?: string;
  audio_path?: string;
  profile_picture_base64?: string;
  created_at?: Date
} 