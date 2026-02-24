import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptic';
import { useRevivalCard } from '@/api/attempts';
import { useGoalStore } from '@/stores/goalStore';
import { getTodayString } from '@/utils/dateUtils';
import RevivalModal from '@/components/RevivalModal';
import type { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
}

/**
 * 목표 카드 컴포넌트.
 * 단순하고 행동 중심의 디자인.
 */
export default function GoalCard({ goal }: GoalCardProps) {
  const navigate = useNavigate();
  const { fetchGoals } = useGoalStore();
  const [showRevivalModal, setShowRevivalModal] = useState(false);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.medium();
    navigate(`/goals/${goal.id}/countdown`);
  };

  const handleRevivalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.medium();
    setShowRevivalModal(true);
  };

  const handleUseRevival = async () => {
    try {
      await useRevivalCard(goal.id, getTodayString());
      setShowRevivalModal(false);
      await fetchGoals();
    } catch (err) {
      console.error('[GoalCard] 부활 카드 사용 중 오류:', err);
    }
  };

  const handleSkipRevival = () => {
    setShowRevivalModal(false);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          goal.today_success
            ? 'bg-success-500/5 border-success-500/20 shadow-sm'
            : 'bg-surface border-border hover:border-border shadow-sm hover:shadow-md'
        }`}
      >
      {/* 성공 시 상단 그라데이션 바 */}
      {goal.today_success && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success-400 to-success-600" />
      )}

      <div
        className="p-5 cursor-pointer"
        onClick={() => navigate(`/goals/${goal.id}/detail`)}
      >
        {/* 상단: 목표명 */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-text mb-1 leading-tight">
            {goal.name}
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            {goal.first_action}
          </p>
        </div>

        {/* 중간: 상태 + Streak 한 줄 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-xs text-muted">
            {goal.today_success ? (
              <span className="inline-flex items-center gap-1 text-success-600 dark:text-success-500 font-medium">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                완료
              </span>
            ) : goal.today_attempted ? (
              '실패'
            ) : (
              '미완료'
            )}
          </div>

          {goal.current_streak > 0 && (
            <div className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-full">
              🔥 {goal.current_streak}일
            </div>
          )}
        </div>

        {/* 하단: CTA */}
        <div className="flex items-center justify-end gap-3">
          {/* CTA 버튼 - 우선순위별 차별화 */}
          {goal.today_success ? (
            /* Secondary: 아웃라인만, 작고 가볍게 */
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptic.light();
                navigate(`/goals/${goal.id}/insights`);
              }}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-success-500/30 text-xs font-medium text-success-600 dark:text-success-500 hover:bg-success-500/5 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              통계
            </button>
          ) : goal.today_attempted ? (
            /* 복구: 다른 색상 체계 (amber/yellow) */
            <button
              onClick={handleRevivalClick}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 transition-all active:scale-95"
            >
              💎 부활하기 ({goal.revival_cards}장)
            </button>
          ) : (
            /* Primary: 그라데이션 + 굵게 + 크게 */
            <button
              onClick={handleStart}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-primary-500/25"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3.5L12.5 8 6 12.5V3.5z"/>
              </svg>
              시작
            </button>
          )}
        </div>
      </div>
    </div>

    {/* 부활 카드 모달 */}
    {showRevivalModal && (
      <RevivalModal
        remainingCards={goal.revival_cards}
        onUse={handleUseRevival}
        onSkip={handleSkipRevival}
      />
    )}
    </>
  );
}
