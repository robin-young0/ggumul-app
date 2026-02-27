import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import {
  startNotificationScheduler,
  stopNotificationScheduler,
  requestNotificationPermission,
} from '@/utils/localNotifications';
import { getFCMToken, setupForegroundMessageListener } from '@/utils/fcm';
import { isFirebaseConfigured } from '@/utils/firebase';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Stats from '@/pages/Stats';
import GoalForm from '@/pages/GoalForm';
import GoalDetail from '@/pages/GoalDetail';
import Countdown from '@/pages/Countdown';
import Result from '@/pages/Result';
import Insights from '@/pages/Insights';
import Friends from '@/pages/Friends';

/**
 * 앱 루트 컴포넌트.
 */
export default function App() {
  const { theme, setTheme } = useThemeStore();

  // 초기 테마 설정
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // 알림 시스템 초기화
  useEffect(() => {
    const initNotifications = async () => {
      // Firebase가 설정되어 있으면 FCM 사용 (백그라운드 알림)
      if (isFirebaseConfigured()) {
        console.log('[App] Firebase 설정됨 - FCM 초기화');

        // FCM 토큰 가져오기
        const token = await getFCMToken();
        if (token) {
          console.log('[App] FCM 토큰 발급 완료');

          // 포그라운드 메시지 리스너 설정
          setupForegroundMessageListener();
        }
      } else {
        // Firebase 미설정 시 로컬 스케줄러 사용
        console.log('[App] Firebase 미설정 - 로컬 스케줄러 사용');

        if (import.meta.env.VITE_SINGLE_FILE) {
          const granted = await requestNotificationPermission();
          if (granted) {
            startNotificationScheduler();
          }
        }
      }
    };

    initNotifications();

    return () => {
      if (!isFirebaseConfigured()) {
        stopNotificationScheduler();
      }
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/goals/new" element={<GoalForm />} />
        <Route path="/goals/:id/edit" element={<GoalForm />} />
        <Route path="/goals/:id/detail" element={<GoalDetail />} />
        <Route path="/goals/:id/countdown" element={<Countdown />} />
        <Route path="/goals/:id/result" element={<Result />} />
        <Route path="/goals/:id/insights" element={<Insights />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
