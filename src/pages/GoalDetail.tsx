import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '@/utils/haptic';
import type { Goal } from '@/types';
import { getGoal } from '@/api/goals';
import { useGoalStore } from '@/stores/goalStore';
import RevivalCardBadge from '@/components/RevivalCardBadge';
import StreakBadge from '@/components/StreakBadge';

/**
 * 목표 상세 페이지
 * Streak 히스토리, 통계, 수정 버튼 등을 표시
 */
export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteGoal } = useGoalStore();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // 목표 데이터 로드 함수
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

  // 페이지 진입 시마다 데이터 로드 (location.key가 변할 때마다)
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

  return (
    <div className="min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/50 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text">목표 상세</h1>

          {/* 메뉴 버튼 */}
          <div className="relative">
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

            {/* 드롭다운 메뉴 */}
            {menuOpen && (
              <>
                {/* 배경 오버레이 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />

                {/* 메뉴 */}
                <div className="absolute right-0 top-12 z-20 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-slide-up">
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
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 목표 정보 카드 */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-text mb-2">{goal.name}</h2>
          <p className="text-muted mb-4">{goal.first_action}</p>

          {/* 타이머 시간 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg text-sm text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            카운트다운: {Math.round(goal.countdown_seconds / 60)}분
          </div>

          {/* 알림 설정 정보 */}
          {goal.notification_schedules && goal.notification_schedules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="text-sm font-semibold text-text">알림 시간</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {goal.notification_schedules
                  .slice()
                  .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
                  .map((schedule, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="text-sm font-mono font-semibold text-primary-500">
                        {String(schedule.hour).padStart(2, '0')}:{String(schedule.minute).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-2 text-xs text-muted">
                {goal.notification_schedules[0].days.length === 7 ? (
                  '매일'
                ) : goal.notification_schedules[0].days.length === 5 &&
                   goal.notification_schedules[0].days.every(d => d >= 1 && d <= 5) ? (
                  '평일'
                ) : goal.notification_schedules[0].days.length === 2 &&
                   goal.notification_schedules[0].days.includes(0) &&
                   goal.notification_schedules[0].days.includes(6) ? (
                  '주말'
                ) : (
                  ['일', '월', '화', '수', '목', '금', '토']
                    .filter((_, idx) => goal.notification_schedules![0].days.includes(idx))
                    .join(', ')
                )}
              </div>
            </div>
          )}
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-muted mb-1">현재 연속</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-500">{goal.current_streak}</span>
              <span className="text-muted">일</span>
            </div>
            <div className="mt-2">
              <StreakBadge streak={goal.current_streak} />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-muted mb-1">최고 기록</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-success-500">{goal.best_streak}</span>
              <span className="text-muted">일</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-muted mb-1">부활 카드</div>
            <div className="flex items-baseline gap-2">
              <RevivalCardBadge count={goal.revival_cards} />
            </div>
            <div className="text-xs text-muted mt-2">7일 연속 시 1장 지급</div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-muted mb-1">오늘 상태</div>
            {goal.today_success ? (
              <div className="flex items-center gap-2 text-success-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12l2 2 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-semibold">완료</span>
              </div>
            ) : goal.today_attempted ? (
              <div className="text-muted">
                실패 {goal.revival_cards > 0 && '(부활 가능)'}
              </div>
            ) : (
              <div className="text-muted">아직 시도 안 함</div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        {!goal.today_success && !goal.today_attempted && (
          <button
            onClick={() => navigate(`/goals/${id}/countdown`)}
            className="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-lg transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20"
          >
            지금 시작하기
          </button>
        )}

        {/* 부활 버튼 (실패했을 때) */}
        {!goal.today_success && goal.today_attempted && goal.revival_cards > 0 && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-lg transition-all active:scale-[0.98] hover:bg-amber-500/15"
          >
            💎 부활 카드 사용하기 ({goal.revival_cards}장)
          </button>
        )}
      </div>
    </div>
  );
}
