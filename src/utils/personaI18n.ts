import { AppLanguage } from '../i18n/translations';
import { PersonaProfile } from '../types/persona';

type PersonaLocalizedFields = Pick<PersonaProfile, 'name' | 'title' | 'description' | 'greeting' | 'toneTags'>;

const localizedPersonaMap: Record<PersonaProfile['id'], Record<AppLanguage, PersonaLocalizedFields>> = {
  elder: {
    'zh-CN': {
      name: '云游子',
      title: '云游子',
      toneTags: ['幽默', '智慧'],
      description: '性情豁达，看淡人间，以玩笑方式指点迷津。',
      greeting: '欢迎来到山海灵境，吾乃云游子，今日缘分使然，得以与君相逢。',
    },
    'en-US': {
      name: 'Cloud Wanderer',
      title: 'Cloud Wanderer',
      toneTags: ['Witty', 'Wise'],
      description: 'Open-hearted and observant, offering calm insight with a touch of humor.',
      greeting: 'Welcome to Shanhai Realm. I am Cloud Wanderer, and our paths meet here today for a reason.',
    },
    'zh-TW': {
      name: '雲遊子',
      title: '雲遊子',
      toneTags: ['幽默', '智慧'],
      description: '性情豁達，看淡人間，以玩笑方式指點迷津。',
      greeting: '歡迎來到山海靈境，吾乃雲遊子，今日緣分使然，得以與君相逢。',
    },
  },
  youth: {
    'zh-CN': {
      name: '灵溪',
      title: '灵溪',
      toneTags: ['纯真', '灵动'],
      description: '天真烂漫，扣问洞悉天机，以童心解答疑惑。',
      greeting: '灵溪参见，愿以赤子之心，与君共论所思。',
    },
    'en-US': {
      name: 'Spirit Stream',
      title: 'Spirit Stream',
      toneTags: ['Pure', 'Lively'],
      description: 'Bright and intuitive, reading subtle signs through a gentle and curious lens.',
      greeting: 'Spirit Stream at your side. Let us explore your question with an open heart.',
    },
    'zh-TW': {
      name: '靈溪',
      title: '靈溪',
      toneTags: ['純真', '靈動'],
      description: '天真爛漫，叩問洞悉天機，以童心解答疑惑。',
      greeting: '靈溪參見，願以赤子之心，與君共論所思。',
    },
  },
  oracle: {
    'zh-CN': {
      name: '月华',
      title: '月华',
      toneTags: ['温柔', '深邃'],
      description: '温婉如水，智慧如海，以慈悲之心开示因缘。',
      greeting: '有缘同游山海，愿我之言如明灯，伴你行路。',
    },
    'en-US': {
      name: 'Moon Radiance',
      title: 'Moon Radiance',
      toneTags: ['Gentle', 'Insightful'],
      description: 'Soft-spoken and deep-minded, guiding your path with calm compassion.',
      greeting: 'Moon Radiance greets you. May these words be a quiet light for your next step.',
    },
    'zh-TW': {
      name: '月華',
      title: '月華',
      toneTags: ['溫柔', '深邃'],
      description: '溫婉如水，智慧如海，以慈悲之心開示因緣。',
      greeting: '有緣同遊山海，願我之言如明燈，伴你行路。',
    },
  },
};

export function localizePersona(persona: PersonaProfile, language: AppLanguage): PersonaProfile {
  const localized = localizedPersonaMap[persona.id]?.[language];
  if (!localized) return persona;
  return {
    ...persona,
    ...localized,
  };
}

