import SeoLandingPage from '../components/SeoLandingPage';
import { LANDING_PAGES } from '../src/seo/landingPages';

export default function DailyFortuneLandingScreen() {
  return <SeoLandingPage page={LANDING_PAGES['daily-fortune']} />;
}
