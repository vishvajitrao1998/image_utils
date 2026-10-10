import LegalScreen from '../components/LegalScreen';
import { LEGAL_UPDATED, PRIVACY } from '../constants/legal';

export default function Privacy() {
  return <LegalScreen title="Privacy Policy" updated={LEGAL_UPDATED} sections={PRIVACY} />;
}