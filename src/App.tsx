import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
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
