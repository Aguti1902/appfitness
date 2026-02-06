import { Flame } from 'lucide-react';
import { SportWODsPage } from '../sports/SportWODsPage';

const CROSSFIT_TEMPLATES = [
  { name: 'Fran', content: '21-15-9: Thrusters (43/30kg) + Pull-ups' },
  { name: 'Helen', content: '3 rounds: 400m Run, 21 KB Swings, 12 Pull-ups' },
  { name: 'Cindy', content: 'AMRAP 20min: 5 Pull-ups, 10 Push-ups, 15 Squats' },
  { name: 'Diane', content: '21-15-9: Deadlifts (102/70kg) + HSPU' },
  { name: 'Grace', content: '30 Clean & Jerks for time (60/43kg)' },
];

export function CrossfitWODsPage() {
  return (
    <SportWODsPage
      sportId="crossfit"
      sportName="CrossFit"
      sportIcon={Flame}
      iconColor="text-orange-600"
      bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
      templates={CROSSFIT_TEMPLATES}
    />
  );
}
