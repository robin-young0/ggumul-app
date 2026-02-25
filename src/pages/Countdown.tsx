import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimerStore } from '@/stores/timerStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useGoalStore } from '@/stores/goalStore';
import { getGoal } from '@/api/goals';
import { haptic } from '@/utils/haptic';
import Timer from '@/components/Timer';
import type { Goal } from '@/types';

/**
 * 카운트다운 페이지.
 * 풀스크린 몰입형 타이머.
 */
export default function Countdown() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goalId = Number(id);

  const { startTimer, clearTimer } = useTimerStore();
  const { remaining, isExpired } = useCountdown();
  const { fetchGoals } = useGoalStore();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // 먼저 이전 타이머 완전히 초기화
        clearTimer();

        const goalData = await getGoal(goalId);
        setGoal(goalData);

        // 약간의 지연 후 새 타이머 시작 (상태 안정화)
        setTimeout(() => {
          startTimer(goalId, goalData.countdown_seconds);
          setReady(true);
        }, 100);
      } catch (err) {
        console.error('[Countdown] 목표 로드 실패:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  // 타이머 만료 시 실패 결과 페이지로 이동 (ready 이후에만)
  useEffect(() => {
    if (ready && isExpired) {
      clearTimer();
      navigate(`/goals/${goalId}/result?success=false`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isExpired, goalId]);

  const handleSuccess = () => {
    haptic.success();
    clearTimer();
    fetchGoals();
    navigate(`/goals/${goalId}/result?success=true`);
  };

  const handleGiveUp = () => {
    haptic.light();
    clearTimer();
    navigate(`/goals/${goalId}/result?success=false`);
  };

  if (loading || !goal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-72 h-72 rounded-full bg-neutral-800/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative -mt-16">
      {/* 배경 글로우 — 시간에 따라 색상 변화 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
            remaining <= 30
              ? 'bg-primary-500/20 animate-pulse'
              : remaining <= 60
              ? 'bg-primary-500/10'
              : 'bg-primary-500/5'
          }`}
        />
      </div>

      {/* 긴장감 메시지 */}
      <p className="text-sm text-neutral-500 uppercase tracking-widest mb-2 relative z-10">
        {remaining <= 30 ? '⚠️ 거의 다 갔어요!' : '지금이에요'}
      </p>
      <h2 className="text-2xl font-bold text-neutral-100 mb-6 text-center relative z-10">
        {goal.name}
      </h2>

      {/* Streak 손실 경고 — 1분 이하일 때 */}
      {goal.current_streak > 0 && remaining <= 60 && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-primary-900/20 border border-primary-500/30 backdrop-blur-sm relative z-10 max-w-xs animate-slide-up">
          <p className="text-sm text-primary-300 text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-primary-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <strong>{goal.current_streak}일</strong> 연속 기록이 사라질 수 있어요
          </p>
        </div>
      )}

      {/* 타이머 */}
      <div className="relative z-10">
        <Timer
          remaining={remaining}
          total={goal.countdown_seconds}
          actionText={goal.first_action}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="mt-12 flex flex-col gap-3 w-full max-w-xs relative z-10">
        <button
          onClick={handleSuccess}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-bold transition-all active:scale-95 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
        >
          시작했어요!
        </button>
        <button
          onClick={handleGiveUp}
          className="w-full py-3 rounded-xl text-neutral-600 text-sm hover:text-neutral-400 transition-colors"
        >
          오늘은 쉴게요
        </button>
      </div>
    </div>
  );
}
