export type PersonaArchetype = 'elder' | 'youth' | 'oracle';

export interface PersonaProfile {
  id: PersonaArchetype;
  name: string;
  title: string;
  toneTags: string[];
  description: string;
  greeting: string;
  /** 头像：string 为 URL，number 为 require() 本地资源 */
  image: string | number;
}

