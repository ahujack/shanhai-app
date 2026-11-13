export interface ComicPanel {
  id: string;
  visual: string;
  caption: string;
  bubble: string;
  poemLine?: string;
  imageUrl?: string;
}

export interface FortuneComic {
  id: string;
  slipId: string;
  title: string;
  subtitle: string;
  companion: { id: string; name: string; title: string };
  rank: string;
  poemTitle: string;
  panels: ComicPanel[];
  closing: string;
  shareText: string;
  createdAt: string;
  coverImageUrl?: string;
}

export const COMIC_SLIP_KEY = 'shanhai_realm_comic_slip_v1';
export const COMIC_CACHE_KEY = 'shanhai_realm_comic_cache_v1';
