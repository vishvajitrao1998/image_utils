import LegalScreen from '../components/LegalScreen';
import { DISCLAIMER, LEGAL_UPDATED } from '../constants/legal';

export default function Disclaimer() {
  return <LegalScreen title="Disclaimer" updated={LEGAL_UPDATED} sections={DISCLAIMER} />;
}