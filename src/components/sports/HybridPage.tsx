import { Zap } from 'lucide-react';
import { SportWODsPage } from './SportWODsPage';

const HYBRID_TEMPLATES = [
  { name: 'Strength + Metcon', content: 'Squat 5x5 + AMRAP 12min: 15 KB Swings, 10 Box Jumps, 5 Pull-ups' },
  { name: 'Endurance', content: 'Run 5k + 100 Burpees for time' },
  { name: 'Power + Cardio', content: 'Clean & Jerk 5x3 + 3 rounds: 400m Run, 21 Wall Balls' },
  { name: 'Full Body', content: 'Deadlift 5x5 + EMOM 20: odd - 15 Cal Row, even - 10 Thrusters' },
  { name: 'GPP', content: 'For time: 50-40-30-20-10 DU + Sit-ups' },
];

export function HybridPage() {
  return (
    <SportWODsPage
      sportId="hybrid"
      sportName="Hybrid"
      sportIcon={Zap}
      iconColor="text-purple-600"
      bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
      templates={HYBRID_TEMPLATES}
    />
  );
}
