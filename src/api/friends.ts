import client from './client';
import { isFirebaseConfigured } from '@/utils/firebase';
import * as firebaseFriends from '@/utils/firebaseFriends';

export interface Friend {
  device_id: string;
  nickname?: string | null;
  today_success: boolean;
  current_streak: number;
  success_rate: number;
  created_at: string;
}

export interface InviteCodeResponse {
  code: string;
  expires_at: string;
  share_url: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  friend_device_id: string;
  message: string;
}

/**
 * 초대 코드 생성
 */
export const createInviteCode = async (): Promise<InviteCodeResponse> => {
  // localStorage 모드: Firebase 사용
  if (import.meta.env.VITE_SINGLE_FILE) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase 설정이 필요합니다. 환경변수를 확인해주세요.');
    }
    return firebaseFriends.createInviteCode();
  }

  const response = await client.post('/friends/invite');
  return response.data;
};

/**
 * 초대 코드 수락
 */
export const acceptInviteCode = async (code: string): Promise<AcceptInviteResponse> => {
  // localStorage 모드: Firebase 사용
  if (import.meta.env.VITE_SINGLE_FILE) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase 설정이 필요합니다. 환경변수를 확인해주세요.');
    }
    return firebaseFriends.acceptInviteCode(code);
  }

  const response = await client.post(`/friends/accept/${code}`);
  return response.data;
};

/**
 * 친구 목록 조회
 */
export const getFriends = async (): Promise<Friend[]> => {
  // localStorage 모드: Firebase 사용
  if (import.meta.env.VITE_SINGLE_FILE) {
    if (!isFirebaseConfigured()) {
      return []; // Firebase 미설정 시 빈 배열
    }
    return firebaseFriends.getFriends();
  }

  const response = await client.get('/friends');
  return response.data;
};

/**
 * 친구 삭제
 */
export const removeFriend = async (friendDeviceId: string): Promise<{ success: boolean; message: string }> => {
  // localStorage 모드: Firebase 사용
  if (import.meta.env.VITE_SINGLE_FILE) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase 설정이 필요합니다. 환경변수를 확인해주세요.');
    }
    return firebaseFriends.removeFriend(friendDeviceId);
  }

  const response = await client.delete(`/friends/${friendDeviceId}`);
  return response.data;
};
