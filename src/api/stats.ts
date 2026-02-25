import client from './client';
import { localAttempts, localGoals } from '@/utils/localStorage';

export const getTodayStats = async () => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const today = new Date().toISOString().split('T')[0];
    const allAttempts = localAttempts.getAll();
    const todayAttempts = allAttempts.filter(a => a.attempted_date === today);

    const total_successes = todayAttempts.filter(a => a.success).length;
    const total_attempts = todayAttempts.length;
    const success_rate = total_attempts > 0 ? total_successes / total_attempts : 0;

    return {
      date: today,
      total_successes,
      total_attempts,
      success_rate,
      unique_devices: 1, // localStorage 모드는 단일 기기
    };
  }

  const response = await client.get('/stats/today');
  return response.data;
};

export const getMyStats = async () => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const allAttempts = localAttempts.getAll();

    // 최근 7일 데이터 필터링
    const recentAttempts = allAttempts.filter(a => {
      const attemptDate = new Date(a.attempted_date);
      return attemptDate >= sevenDaysAgo && attemptDate <= today;
    });

    const total_attempts = recentAttempts.length;
    const total_successes = recentAttempts.filter(a => a.success).length;
    const success_rate = total_attempts > 0 ? total_successes / total_attempts : 0;

    // 일별 통계 생성
    const daily_stats = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const dayAttempts = recentAttempts.filter(a => a.attempted_date === dateStr);
      daily_stats.push({
        date: dateStr,
        attempts: dayAttempts.length,
        successes: dayAttempts.filter(a => a.success).length,
      });
    }

    // localStorage 모드에서는 비교 대상이 없으므로 자신과 비교
    const average_success_rate = success_rate;
    const difference = 0;
    const percentage_better = 0;

    return {
      device_id: 'local-device',
      period_days: 7,
      total_attempts,
      total_successes,
      success_rate,
      average_success_rate,
      daily_stats,
      comparison: {
        difference,
        percentage_better,
      },
    };
  }

  const response = await client.get('/stats/me');
  return response.data;
};
