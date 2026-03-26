/** 登录失效时通知 UI（不依赖 window，Web/Native 通用） */
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeAuthExpired(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitAuthExpired(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
