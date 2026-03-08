import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '@/utils/haptic';
import type { Goal } from '@/types';
import { getGoal } from '@/api/goals';
import { useGoalStore } from '@/stores/goalStore';
import { useRevivalCard } from '@/api/attempts';
import { getTodayString } from '@/utils/dateUtils';
import RevivalCardBadge from '@/components/RevivalCardBadge';
import StreakBadge from '@/components/StreakBadge';
import RevivalModal from '@/components/RevivalModal';

/**
 * 목표 상세 페이지
 */
export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteGoal, fetchGoals } = useGoalStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRevivalModal, setShowRevivalModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const loadGoal = async () => {
    if (!id) return;
    try {
      const data = await getGoal(Number(id));
      setGoal(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, [id, location.key]);

  const handleDelete = async () => {
    if (!id) return;
    haptic.heavy();
    if (!window.confirm('이 목표를 삭제할까요?\n기록도 함께 사라져요.')) return;
    try {
      await deleteGoal(Number(id));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[GoalDetail] 삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handleRevivalUse = async () => {
    if (!goal) return;
    try {
      await useRevivalCard(goal.id, getTodayString());
      setShowRevivalModal(false);
      await loadGoal();
      await fetchGoals();
    } catch (error) {
      console.error('[GoalDetail] 부활 실패:', error);
      alert('부활에 실패했어요. 다시 시도해주세요.');
    }
  };

  // Streak에 따른 동기부여 문구
  const getMotivationMessage = (streak: number, todaySuccess: boolean) => {
    if (todaySuccess) {
      if (streak >= 30) return '한 달 넘게 이어가고 있어요. 대단해요!';
      if (streak >= 7) return '꾸준함이 빛나고 있어요!';
      return '오늘도 한 걸음 나아갔어요!';
    }
    if (streak === 0) return '첫 시작이 가장 어려워요. 오늘 해볼까요?';
    if (streak >= 30) return '한 달 넘게 이어왔어요. 오늘도 이어가요!';
    if (streak >= 7) return '일주일 넘게 달려왔어요. 멈추지 마세요!';
    if (streak >= 3) return '좋은 흐름이에요. 계속 가봐요!';
    return '시작이 반이에요. 오늘도 도전!';
  };

  // Streak에 따른 카드 스타일
  const getStreakCardStyle = (streak: number) => {
    if (streak >= 30) return 'bg-success-500/5 border-success-500/20';
    if (streak >= 7) return 'bg-primary-500/5 border-primary-500/20';
    return 'bg-surface border-border';
  };

  // Progress bar 비율
  const getProgressPercent = (current: number, best: number) => {
    if (best === 0) return current > 0 ? 100 : 0;
    return Math.min((current / best) * 100, 100);
  };

  // 알림 요일 요약
  const getNotificationDaysSummary = (days: number[]) => {
    if (days.length === 7) return '매일';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return '평일';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return '주말';
    return ['일', '월', '화', '수', '목', '금', '토']
      .filter((_, idx) => days.includes(idx))
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-muted">로딩 중...</div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-muted">목표를 찾을 수 없습니다</div>
      </div>
    );
  }

  const progressPercent = getProgressPercent(goal.current_streak, goal.best_streak);
  const isNewRecord = goal.current_streak > 0 && goal.current_streak >= goal.best_streak;

  return (
    <div className="pb-24 space-y-5 animate-slide-up">
      {/* 상단: 뒤로가기 + 목표명 + 메뉴 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className="text-lg font-bold text-text truncate max-w-[200px]">{goal.name}</h2>

        {/* 메뉴 버튼 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="absolute right-0 top-12 z-10 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-slide-up">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/goals/${id}/edit`);
                  }}
                  className="w-full px-4 py-3 text-left text-text hover:bg-bg transition-colors flex items-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  수정하기
                </button>

                <div className="h-px bg-border" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  className="w-full px-4 py-3 text-left text-danger-500 hover:bg-danger-500/10 transition-colors flex items-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  삭제하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Streak Hero 카드 */}
        <div className={`rounded-2xl p-6 shadow-sm border ${getStreakCardStyle(goal.current_streak)}`}>
          {/* 오늘 완료 시 상단 바 */}
          {goal.today_success && (
            <div className="h-1 -mt-6 -mx-6 mb-5 rounded-t-2xl bg-gradient-to-r from-success-500 to-emerald-400" />
          )}

          <div className="text-center">
            <div className="text-sm text-muted mb-1">현재 연속</div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold tracking-tight text-text">{goal.current_streak}</span>
              <span className="text-lg text-muted">일</span>
            </div>
            <div className="mt-3">
              <StreakBadge streak={goal.current_streak} />
            </div>
          </div>

          {/* Progress bar: current vs best */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-muted mb-1.5">
              <span>최고 기록 대비</span>
              <span className={isNewRecord ? 'text-success-500 font-semibold' : ''}>
                {isNewRecord ? '신기록!' : `${goal.best_streak}일`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isNewRecord ? 'bg-success-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 동기부여 문구 */}
          <p className="mt-4 text-center text-sm text-muted">
            {getMotivationMessage(goal.current_streak, goal.today_success)}
          </p>

          {/* 첫 행동 */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted mb-1">첫 행동</p>
            <p className="text-sm text-text font-medium">{goal.first_action}</p>
          </div>
        </div>

        {/* 보조 통계 - 2열 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted mb-1">최고 기록</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-success-500">{goal.best_streak}</span>
              <span className="text-sm text-muted">일</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-muted mb-1">부활 카드</div>
            <div className="flex items-baseline gap-1.5">
              <RevivalCardBadge count={goal.revival_cards} />
            </div>
            <div className="text-[10px] text-muted mt-1">7일 연속 시 1장</div>
          </div>
        </div>

        {/* 알림 정보 - chip 한줄 요약 */}
        {goal.notification_schedules && goal.notification_schedules.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface border border-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 shrink-0">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="text-sm text-text">
              {goal.notification_schedules
                .slice()
                .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
                .map(s => `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`)
                .join(', ')}
            </span>
            <span className="text-xs text-muted">
              ({getNotificationDaysSummary(goal.notification_schedules[0].days)})
            </span>
          </div>
        )}

        {/* 카운트다운 시간 */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface border border-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="text-sm text-text">카운트다운 {Math.round(goal.countdown_seconds / 60)}분</span>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2 space-y-3">
        {goal.today_success ? (
          <>
            <div className="w-full py-4 rounded-2xl bg-success-500/10 border border-success-500/20 text-center">
              <span className="text-success-500 font-semibold">오늘도 해냈어요!</span>
            </div>
            <button
              onClick={() => navigate(`/goals/${id}/insights`)}
              className="w-full py-3 rounded-2xl bg-surface border border-border text-text font-medium transition-all active:scale-[0.98] hover:bg-bg flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              상세 통계 보기
            </button>
          </>
        ) : goal.today_attempted ? (
          <>
            <button
              onClick={() => setShowRevivalModal(true)}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] ${
                goal.revival_cards > 0
                  ? 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15'
                  : 'bg-surface border border-border text-muted cursor-default'
              }`}
            >
              {goal.revival_cards > 0
                ? `부활 카드 사용하기 (${goal.revival_cards}장)`
                : '내일 다시 도전해요'
              }
            </button>
            <button
              onClick={() => navigate(`/goals/${id}/insights`)}
              className="w-full py-3 rounded-2xl bg-surface border border-border text-muted font-medium transition-all active:scale-[0.98] hover:bg-bg flex items-center justify-center gap-2 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              상세 통계 보기
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate(`/goals/${id}/countdown`)}
              className="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-lg transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20"
            >
              지금 시작하기
            </button>
            <button
              onClick={() => navigate(`/goals/${id}/insights`)}
              className="w-full py-3 rounded-2xl bg-surface border border-border text-muted font-medium transition-all active:scale-[0.98] hover:bg-bg flex items-center justify-center gap-2 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              상세 통계 보기
            </button>
          </>
        )}
      </div>

      {/* 부활 모달 */}
      {showRevivalModal && (
        <RevivalModal
          remainingCards={goal.revival_cards}
          onUse={handleRevivalUse}
          onSkip={() => setShowRevivalModal(false)}
        />
      )}
    </div>
  );
}
