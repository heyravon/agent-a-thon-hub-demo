import { useJudging } from '@/context/JudgingContext';
import { LoginPage } from '@/components/LoginPage';
import { EventHeader } from '@/components/EventHeader';
import { JudgeDashboard } from '@/components/JudgeDashboard';

function JudgeContent() {
  const { judge } = useJudging();
  if (!judge) return <LoginPage />;
  return (
    <div className="min-h-svh bg-background">
      <EventHeader />
      <JudgeDashboard />
    </div>
  );
}

export default function Judge() {
  return <JudgeContent />;
}
