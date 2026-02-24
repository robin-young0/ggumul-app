// 알림 스케줄 타입
export interface NotificationSchedule {
  id?: number;
  goal_id?: number;
  hour: number;
  minute: number;
  days: number[]; // 0=월 ~ 6=일
}

// 목표 (Goal) 타입
export interface Goal {
  id: number;
  name: string;
  first_action: string;
  countdown_seconds: number;
  current_streak: number;
  best_streak: number;
  revival_cards: number;
  today_attempted: boolean;
  today_success: boolean;
  is_top_priority: boolean;
  notification_schedules: NotificationSchedule[];
}

// 목표 생성/수정 시 사용하는 타입
export interface GoalCreateUpdate {
  name: string;
  first_action: string;
  countdown_seconds: number;
  notification_schedules?: Array<{
    hour: number;
    minute: number;
    days: number[];
  }>;
}

// 실패 사유 타입
export type FailureReason = 'tired' | 'forgot' | 'no_time' | 'lazy' | 'other';

// 시도 기록 생성 타입
export interface AttemptCreate {
  attempted_date: string; // YYYY-MM-DD
  success: boolean;
  failure_reason?: FailureReason;
  failure_memo?: string;
  use_revival?: boolean;
}

// 인사이트 데이터 타입
export interface InsightData {
  total_attempts: number;
  success_count: number;
  success_rate: number; // 0~100 범위
  failure_by_reason: Record<string, number>;
  failure_by_day_of_week: Record<string, number>;
  tips: string[];
}

// 푸시 알림 구독 타입
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
