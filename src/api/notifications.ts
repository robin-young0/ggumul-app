import client from './client';
import type { PushSubscriptionData } from '@/types';

/** 푸시 알림 구독 정보를 서버에 전송 */
export async function subscribePush(subscription: PushSubscriptionData) {
  const { data } = await client.post('/subscribe', subscription);
  return data;
}
