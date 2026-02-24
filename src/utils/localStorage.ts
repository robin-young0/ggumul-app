/**
 * localStorage 기반 데이터 저장소
 * 싱글파일 프리뷰에서 백엔드 없이 동작하도록 함
 */

import type { Goal, AttemptCreate, FailureReason } from '@/types';

const STORAGE_KEYS = {
  GOALS: 'ggumul_goals',
  ATTEMPTS: 'ggumul_attempts',
  DEVICE_ID: 'ggumul_device_id',
} as const;

// 목표 타입 (localStorage용, 서버 응답과 동일하게)
export interface StoredGoal extends Omit<Goal, 'current_streak' | 'best_streak' | 'today_attempted' | 'today_success' | 'is_top_priority'> {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  device_id: string;
}

// 시도 기록 타입
export interface StoredAttempt {
  id: number;
  goal_id: number;
  attempted_date: string; // YYYY-MM-DD
  success: boolean;
  failure_reason?: FailureReason;
  failure_memo?: string;
  used_revival: boolean;
  created_at: string;
}

// localStorage에서 데이터 읽기
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// localStorage에 데이터 쓰기
function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('localStorage write failed:', error);
  }
}

// 목표 관련
export const localGoals = {
  getAll(): StoredGoal[] {
    return getFromStorage<StoredGoal[]>(STORAGE_KEYS.GOALS, []);
  },

  getById(id: number): StoredGoal | undefined {
    return this.getAll().find(g => g.id === id);
  },

  create(data: { name: string; first_action: string; countdown_seconds: number; notification_schedules?: any[] }): StoredGoal {
    const goals = this.getAll();
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || 'local-device';

    const newGoal: StoredGoal = {
      id: Date.now(),
      device_id: deviceId,
      name: data.name,
      first_action: data.first_action,
      countdown_seconds: data.countdown_seconds,
      revival_cards: 0,
      is_active: true,
      notification_schedules: data.notification_schedules || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    goals.push(newGoal);
    setToStorage(STORAGE_KEYS.GOALS, goals);
    return newGoal;
  },

  update(id: number, data: Partial<StoredGoal>): StoredGoal | null {
    const goals = this.getAll();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) return null;

    goals[index] = {
      ...goals[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    setToStorage(STORAGE_KEYS.GOALS, goals);
    return goals[index];
  },

  delete(id: number): boolean {
    const goals = this.getAll();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) return false;

    goals[index].is_active = false;
    goals[index].updated_at = new Date().toISOString();
    setToStorage(STORAGE_KEYS.GOALS, goals);
    return true;
  },
};

// 시도 기록 관련
export const localAttempts = {
  getAll(): StoredAttempt[] {
    return getFromStorage<StoredAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  },

  getByGoalId(goalId: number): StoredAttempt[] {
    return this.getAll().filter(a => a.goal_id === goalId);
  },

  getByDate(goalId: number, date: string): StoredAttempt | undefined {
    return this.getAll().find(a => a.goal_id === goalId && a.attempted_date === date);
  },

  create(goalId: number, data: AttemptCreate): StoredAttempt {
    const attempts = this.getAll();

    // 같은 날짜에 이미 기록이 있으면 업데이트
    const existingIndex = attempts.findIndex(
      a => a.goal_id === goalId && a.attempted_date === data.attempted_date
    );

    if (existingIndex !== -1) {
      attempts[existingIndex] = {
        ...attempts[existingIndex],
        success: data.success,
        failure_reason: data.failure_reason,
        failure_memo: data.failure_memo,
      };
      setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
      return attempts[existingIndex];
    }

    const newAttempt: StoredAttempt = {
      id: Date.now(),
      goal_id: goalId,
      attempted_date: data.attempted_date,
      success: data.success,
      failure_reason: data.failure_reason,
      failure_memo: data.failure_memo,
      used_revival: data.use_revival || false,
      created_at: new Date().toISOString(),
    };

    attempts.push(newAttempt);
    setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    return newAttempt;
  },

  useRevival(goalId: number, date: string): boolean {
    const attempts = this.getAll();
    const attempt = attempts.find(a => a.goal_id === goalId && a.attempted_date === date);

    if (!attempt || attempt.success) return false;

    // 부활 카드 차감
    const goal = localGoals.getById(goalId);
    if (!goal || goal.revival_cards === 0) return false;

    localGoals.update(goalId, { revival_cards: goal.revival_cards - 1 });

    // 시도 기록 부활 처리
    attempt.success = true;
    attempt.used_revival = true;
    setToStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    return true;
  },
};

// Streak 계산 (백엔드 로직 복제)
export function calculateStreak(goalId: number): { current: number; best: number } {
  const attempts = localAttempts.getByGoalId(goalId)
    .filter(a => a.success)
    .sort((a, b) => b.attempted_date.localeCompare(a.attempted_date));

  if (attempts.length === 0) return { current: 0, best: 0 };

  const today = new Date().toISOString().split('T')[0];
  let current = 0;
  let best = 0;
  let tempStreak = 0;
  let checkDate = new Date(today);

  // 현재 스트릭 계산
  for (const attempt of attempts) {
    const attemptDate = attempt.attempted_date;
    const expectedDate = checkDate.toISOString().split('T')[0];

    if (attemptDate === expectedDate) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 최고 스트릭 계산
  const allDates = attempts.map(a => a.attempted_date).sort();
  for (let i = 0; i < allDates.length; i++) {
    tempStreak = 1;
    let currentDate = new Date(allDates[i]);

    for (let j = i + 1; j < allDates.length; j++) {
      const nextDate = new Date(allDates[j]);
      currentDate.setDate(currentDate.getDate() + 1);

      if (nextDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]) {
        tempStreak++;
      } else {
        break;
      }
    }

    best = Math.max(best, tempStreak);
  }

  return { current, best };
}

// 우선순위 계산 (간단 버전)
export function getTopPriorityGoalId(goals: StoredGoal[]): number | null {
  const today = new Date().toISOString().split('T')[0];

  const activeGoals = goals.filter(g => g.is_active);
  if (activeGoals.length === 0) return null;

  // 오늘 완료 안 한 목표 중에서
  const incomplete = activeGoals.filter(g => {
    const todayAttempt = localAttempts.getByDate(g.id, today);
    return !todayAttempt || !todayAttempt.success;
  });

  if (incomplete.length === 0) return null;

  // 스트릭 높은 순
  const withStreak = incomplete.map(g => ({
    goal: g,
    streak: calculateStreak(g.id).current,
  }));

  withStreak.sort((a, b) => b.streak - a.streak);
  return withStreak[0].goal.id;
}

// 초기화 (개발용)
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
}

// 샘플 데이터 생성 (로컬 모드 첫 실행 시)
export function initializeSampleData(): void {
  // 이미 데이터가 있으면 스킵
  if (localGoals.getAll().length > 0) return;

  console.log('[localStorage] 샘플 데이터 초기화');

  // 샘플 목표 3개 생성
  const sampleGoals = [
    {
      name: '운동하기',
      first_action: '운동복 챙기기',
      countdown_seconds: 300
    },
    {
      name: '독서하기',
      first_action: '책 펼치기',
      countdown_seconds: 180
    },
    {
      name: '물 마시기',
      first_action: '물병 꺼내기',
      countdown_seconds: 60
    },
  ];

  sampleGoals.forEach(g => localGoals.create(g));

  console.log('[localStorage] 샘플 목표 3개 생성 완료');
}
