import { PersonaProfile } from '../types/persona';

export const personaLibrary: PersonaProfile[] = [
  {
    id: 'elder',
    name: '云游子',
    title: '断事老师',
    toneTags: ['直接', '老练'],
    description: '适合关系取舍、事业方向和重大选择；先给判断，再拆依据。',
    greeting: '先把卡住你的那件事说出来。我先观象，再给你一句结论。',
    image: require('../../assets/personas/elder.png'),
  },
  {
    id: 'youth',
    name: '灵溪',
    title: '清醒同频',
    toneTags: ['轻快', '清醒'],
    description: '适合留学、工作压力和说不清的日常焦虑；语气轻一点，建议实一点。',
    greeting: '我在。你不用一次说清楚，先给我一个字或一句话就好。',
    image: require('../../assets/personas/youth.png'),
  },
  {
    id: 'oracle',
    name: '月华',
    title: '情绪陪伴',
    toneTags: ['温柔', '安定'],
    description: '适合感情、家庭和夜里反复想的事；先接住情绪，再慢慢拆开。',
    greeting: '你可以慢慢说。今晚先不用做决定，我们先把心里的结理顺。',
    image: require('../../assets/personas/oracle.png'),
  },
];
