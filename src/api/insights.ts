import client from './client';
import type { InsightData } from '@/types';

/** 특정 목표의 인사이트 데이터 조회 */
export async function getInsights(goalId: number): Promise<InsightData> {
  const { data } = await client.get<InsightData>(`/goals/${goalId}/insights`);
  return data;
}
