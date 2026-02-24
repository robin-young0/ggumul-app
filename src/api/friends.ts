import client from './client';

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
  const response = await client.post('/friends/invite');
  return response.data;
};

/**
 * 초대 코드 수락
 */
export const acceptInviteCode = async (code: string): Promise<AcceptInviteResponse> => {
  const response = await client.post(`/friends/accept/${code}`);
  return response.data;
};

/**
 * 친구 목록 조회
 */
export const getFriends = async (): Promise<Friend[]> => {
  const response = await client.get('/friends');
  return response.data;
};

/**
 * 친구 삭제
 */
export const removeFriend = async (friendDeviceId: string): Promise<{ success: boolean; message: string }> => {
  const response = await client.delete(`/friends/${friendDeviceId}`);
  return response.data;
};
