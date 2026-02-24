import client from './client';
import type { Goal, GoalCreateUpdate } from '@/types';
import { localGoals, localAttempts, calculateStreak, getTopPriorityGoalId } from '@/utils/localStorage';

// localStorage 버전 헬퍼
function buildGoalResponse(storedGoal: ReturnType<typeof localGoals.getById>): Goal | null {
  if (!storedGoal) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayAttempt = localAttempts.getByDate(storedGoal.id, today);
  const { current, best } = calculateStreak(storedGoal.id);
  const allGoals = localGoals.getAll();
  const topPriorityId = getTopPriorityGoalId(allGoals);

  return {
    ...storedGoal,
    current_streak: current,
    best_streak: best,
    today_attempted: !!todayAttempt,
    today_success: todayAttempt?.success || false,
    is_top_priority: storedGoal.id === topPriorityId,
  };
}

/** 전체 목표 목록 조회 */
export async function getGoals(): Promise<Goal[]> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoals = localGoals.getAll().filter(g => g.is_active);
    return storedGoals.map(g => buildGoalResponse(g)!).filter(Boolean);
  }

  const { data } = await client.get<Goal[]>('/goals');
  return data;
}

/** 개별 목표 조회 */
export async function getGoal(id: number): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const goal = buildGoalResponse(localGoals.getById(id));
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  const { data } = await client.get<Goal>(`/goals/${id}`);
  return data;
}

/** 새 목표 생성 */
export async function createGoal(payload: GoalCreateUpdate): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const storedGoal = localGoals.create(payload);
    return buildGoalResponse(storedGoal)!;
  }

  const { data } = await client.post<Goal>('/goals', payload);
  return data;
}

/** 목표 수정 */
export async function updateGoal(id: number, payload: Partial<GoalCreateUpdate>): Promise<Goal> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const updated = localGoals.update(id, payload as any);
    if (!updated) throw new Error('Goal not found');
    return buildGoalResponse(updated)!;
  }

  const { data } = await client.put<Goal>(`/goals/${id}`, payload);
  return data;
}

/** 목표 삭제 */
export async function deleteGoal(id: number): Promise<void> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    localGoals.delete(id);
    return;
  }

  await client.delete(`/goals/${id}`);
}

/** 목표별 통계 타입 */
export interface DailyAttemptStat {
  date: string;
  attempted: boolean;
  success: boolean;
}

export interface GoalStats {
  goal_id: number;
  goal_name: string;
  current_streak: number;
  best_streak: number;
  total_attempts: number;
  total_successes: number;
  success_rate: number; // 0.0 ~ 1.0
  daily_stats: DailyAttemptStat[]; // 최근 7일
}

/** 목표별 최근 7일 통계 조회 */
export async function getGoalStats(goalId: number): Promise<GoalStats> {
  if (import.meta.env.VITE_SINGLE_FILE) {
    const goal = localGoals.getById(goalId);
    if (!goal) throw new Error('Goal not found');

    const attempts = localAttempts.getByGoalId(goalId);
    const { current, best } = calculateStreak(goalId);

    // 최근 7일 계산
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    const daily_stats: DailyAttemptStat[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const attempt = attempts.find(a => a.attempted_date === dateStr);
      daily_stats.push({
        date: dateStr,
        attempted: !!attempt,
        success: attempt?.success || false,
      });
    }

    const recentAttempts = attempts.filter(a => {
      const attemptDate = new Date(a.attempted_date);
      return attemptDate >= startDate && attemptDate <= today;
    });

    const total_successes = recentAttempts.filter(a => a.success).length;
    const success_rate = recentAttempts.length > 0 ? total_successes / recentAttempts.length : 0;

    return {
      goal_id: goalId,
      goal_name: goal.name,
      current_streak: current,
      best_streak: best,
      total_attempts: recentAttempts.length,
      total_successes,
      success_rate,
      daily_stats,
    };
  }

  const { data } = await client.get<GoalStats>(`/goals/${goalId}/stats`);
  return data;
}
