import client from './client';

export interface DeviceInfo {
  device_id: string;
  nickname: string | null;
}

export interface UpdateNicknameResponse {
  success: boolean;
  nickname: string;
  message: string;
}

/**
 * 내 디바이스 정보 조회
 */
export const getMyDeviceInfo = async (): Promise<DeviceInfo> => {
  const response = await client.get('/devices/me');
  return response.data;
};

/**
 * 내 닉네임 설정/수정
 */
export const updateMyNickname = async (nickname: string): Promise<UpdateNicknameResponse> => {
  const response = await client.put('/devices/me/nickname', { nickname });
  return response.data;
};
