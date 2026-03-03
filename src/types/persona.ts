export type PersonaArchetype = 'elder' | 'youth' | 'oracle';

export interface PersonaProfile {
  id: PersonaArchetype;
  name: string;
  title: string;
  toneTags: string[];
  description: string;
  greeting: string;
  image: string;
}

