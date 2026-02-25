import client from './client';
import type { InsightData } from '@/types';
import { localAttempts } from '@/utils/localStorage';

/** 특정 목표의 인사이트 데이터 조회 */
export async function getInsights(goalId: number): Promise<InsightData> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    // localStorage 모드: 통계 직접 계산
    const attempts = localAttempts.getByGoalId(goalId);
    const total_attempts = attempts.length;
    const success_count = attempts.filter(a => a.success).length;
    const success_rate = total_attempts > 0 ? (success_count / total_attempts) * 100 : 0;

    // 실패 이유별 통계
    const failure_by_reason: Record<string, number> = {};
    const failures = attempts.filter(a => !a.success && a.failure_reason);
    failures.forEach(attempt => {
      if (attempt.failure_reason) {
        const reason = getFailureReasonText(attempt.failure_reason);
        failure_by_reason[reason] = (failure_by_reason[reason] || 0) + 1;
      }
    });

    // 요일별 실패 통계
    const failure_by_day_of_week: Record<string, number> = {
      '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0
    };
    failures.forEach(attempt => {
      const date = new Date(attempt.attempted_date);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const day = dayNames[date.getDay()];
      failure_by_day_of_week[day]++;
    });

    // 팁 생성 (간단한 로직)
    const tips: string[] = [];
    if (success_rate < 50) {
      tips.push('목표를 더 작은 단위로 나눠보세요.');
    }

    // 가장 많은 실패 이유 찾기
    const topFailureReason = Object.entries(failure_by_reason)
      .sort((a, b) => b[1] - a[1])[0];
    if (topFailureReason && topFailureReason[1] >= 3) {
      tips.push(`'${topFailureReason[0]}' 문제를 먼저 해결해보세요.`);
    }

    // 가장 많이 실패하는 요일 찾기
    const topFailureDay = Object.entries(failure_by_day_of_week)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0];
    if (topFailureDay && topFailureDay[1] >= 2) {
      tips.push(`${topFailureDay[0]}요일에 특히 주의하세요.`);
    }

    if (tips.length === 0) {
      tips.push('꾸준히 하고 있어요! 계속 이대로 가세요.');
    }

    return {
      total_attempts,
      success_count,
      success_rate,
      failure_by_reason,
      failure_by_day_of_week,
      tips,
    };
  }

  const { data } = await client.get<InsightData>(`/goals/${goalId}/insights`);
  return data;
}

// 실패 이유 코드를 한글로 변환
function getFailureReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'too_busy': '너무 바빴어요',
    'forgot': '깜빡했어요',
    'not_feeling_well': '컨디션이 안 좋았어요',
    'no_motivation': '동기부여가 안 됐어요',
    'other': '기타',
  };
  return reasonMap[reason] || reason;
}
