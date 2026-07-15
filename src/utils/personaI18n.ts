import { AppLanguage } from '../i18n/translations';
import { PersonaProfile } from '../types/persona';

type PersonaLocalizedFields = Pick<PersonaProfile, 'name' | 'title' | 'description' | 'greeting' | 'toneTags'>;

const localizedPersonaMap: Record<PersonaProfile['id'], Record<AppLanguage, PersonaLocalizedFields>> = {
  elder: {
    'zh-CN': {
      name: '云游子',
      title: '断事老师',
      toneTags: ['直接', '老练'],
      description: '适合关系取舍、事业方向和重大选择；先给判断，再拆依据。',
      greeting: '先把卡住你的那件事说出来。我先观象，再给你一句结论。',
    },
    'en-US': {
      name: 'Cloud Wanderer',
      title: 'Decision Guide',
      toneTags: ['Direct', 'Seasoned'],
      description: 'Best for relationship choices, career direction, and major decisions. Verdict first, reasoning second.',
      greeting: 'Tell me the one thing that feels stuck. I will read the sign first, then give you a clear conclusion.',
    },
    'zh-TW': {
      name: '雲遊子',
      title: '斷事老師',
      toneTags: ['直接', '老練'],
      description: '適合關係取捨、事業方向和重大選擇；先給判斷，再拆依據。',
      greeting: '先把卡住你的那件事說出來。我先觀象，再給你一句結論。',
    },
  },
  youth: {
    'zh-CN': {
      name: '灵溪',
      title: '清醒同频',
      toneTags: ['轻快', '清醒'],
      description: '适合留学、工作压力和说不清的日常焦虑；语气轻一点，建议实一点。',
      greeting: '我在。你不用一次说清楚，先给我一个字或一句话就好。',
    },
    'en-US': {
      name: 'Spirit Stream',
      title: 'Clear Companion',
      toneTags: ['Light', 'Grounded'],
      description: 'Best for study abroad stress, work pressure, and everyday anxiety. Lighter tone, practical next steps.',
      greeting: 'I am here. You do not need to explain everything at once. Start with one character or one sentence.',
    },
    'zh-TW': {
      name: '靈溪',
      title: '清醒同頻',
      toneTags: ['輕快', '清醒'],
      description: '適合留學、工作壓力和說不清的日常焦慮；語氣輕一點，建議實一點。',
      greeting: '我在。你不用一次說清楚，先給我一個字或一句話就好。',
    },
  },
  oracle: {
    'zh-CN': {
      name: '月华',
      title: '情绪陪伴',
      toneTags: ['温柔', '安定'],
      description: '适合感情、家庭和夜里反复想的事；先接住情绪，再慢慢拆开。',
      greeting: '你可以慢慢说。今晚先不用做决定，我们先把心里的结理顺。',
    },
    'en-US': {
      name: 'Moon Radiance',
      title: 'Emotional Companion',
      toneTags: ['Gentle', 'Steady'],
      description: 'Best for love, family, and thoughts that repeat at night. Emotion first, clarity second.',
      greeting: 'You can take your time. You do not need to decide tonight. Let us untangle what is in your heart first.',
    },
    'zh-TW': {
      name: '月華',
      title: '情緒陪伴',
      toneTags: ['溫柔', '安定'],
      description: '適合感情、家庭和夜裡反覆想的事；先接住情緒，再慢慢拆開。',
      greeting: '你可以慢慢說。今晚先不用做決定，我們先把心裡的結理順。',
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
