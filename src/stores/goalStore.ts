import { create } from 'zustand';
import type { Goal, GoalCreateUpdate } from '@/types';
import * as goalsApi from '@/api/goals';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;

  /** 전체 목표 목록 새로고침 */
  fetchGoals: () => Promise<void>;

  /** 새 목표 추가 */
  addGoal: (data: GoalCreateUpdate) => Promise<Goal>;

  /** 기존 목표 수정 */
  updateGoal: (id: number, data: Partial<GoalCreateUpdate>) => Promise<void>;

  /** 목표 삭제 */
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await goalsApi.getGoals();
      set({ goals, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '목표를 불러오지 못했습니다.';
      set({ error: message, loading: false });
    }
  },

  addGoal: async (data) => {
    const goal = await goalsApi.createGoal(data);
    set((state) => ({ goals: [...state.goals, goal] }));
    return goal;
  },

  updateGoal: async (id, data) => {
    const updated = await goalsApi.updateGoal(id, data);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGoal: async (id) => {
    await goalsApi.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },
}));
