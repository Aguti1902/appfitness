import { Trophy } from 'lucide-react';
import { SportWODsPage } from './SportWODsPage';

const HYROX_TEMPLATES = [
  { name: 'Ski Erg', content: 'Ski Erg 1000m + 50 Lunges' },
  { name: 'Sled Push', content: 'Sled Push 50m + Wall Balls 75' },
  { name: 'Sled Pull', content: 'Sled Pull 50m + Burpee Broad Jumps 80m' },
  { name: 'Row', content: 'Row 1000m + Farmers Carry 200m' },
  { name: 'Full Hyrox', content: '8 estaciones: Run 1km x8 + todas las estaciones' },
];

export function HyroxPage() {
  return (
    <SportWODsPage
      sportId="hyrox"
      sportName="Hyrox"
      sportIcon={Trophy}
      iconColor="text-amber-600"
      bgGradient="bg-gradient-to-br from-amber-500 to-orange-600"
      templates={HYROX_TEMPLATES}
    />
  );
}
