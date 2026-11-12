export interface Env {
  REALM: DurableObjectNamespace;
  ROOM_ID?: string;
}

/** Cloudflare Worker 入口：把 /presence 升级到 Durable Object 房间 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'shanhai-realm-presence' }), {
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }

    if (url.pathname === '/presence') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }
      const id = env.REALM.idFromName(env.ROOM_ID || 'courtyard');
      const stub = env.REALM.get(id);
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

interface Peer {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
}

/**
 * 一个道观庭院房间：广播姿态，不做聊天。
 * 容量保护：超过上限拒绝新连接，避免像 Sansa 那样被挤爆。
 */
export class RealmRoom {
  private sessions = new Map<WebSocket, Peer>();
  private readonly maxPeers = 80;

  constructor(
    private readonly state: DurableObjectState,
    _env: Env,
  ) {
    this.state.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong'),
    );
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (this.sessions.size >= this.maxPeers) {
      return new Response('道观客满，请稍后再来', { status: 503 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);

    const peer: Peer = {
      id: crypto.randomUUID().slice(0, 8),
      name: '道友',
      x: 0,
      z: 10,
      yaw: 0,
    };
    this.sessions.set(server, peer);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const peer = this.sessions.get(ws);
    if (!peer) return;
    let msg: { type?: string; name?: string; x?: number; z?: number; yaw?: number };
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }

    if (msg.type === 'hello') {
      if (msg.name && msg.name.length < 16) peer.name = msg.name;
      const peers = [...this.sessions.values()]
        .filter((p) => p.id !== peer.id)
        .map((p) => ({ id: p.id, name: p.name, x: p.x, z: p.z, yaw: p.yaw }));
      ws.send(JSON.stringify({ type: 'welcome', id: peer.id, name: peer.name, peers }));
      this.broadcast(ws, { type: 'join', id: peer.id, name: peer.name, x: peer.x, z: peer.z, yaw: peer.yaw });
      return;
    }

    if (msg.type === 'pose') {
      peer.x = clamp(msg.x ?? peer.x, -20, 20);
      peer.z = clamp(msg.z ?? peer.z, -18, 18);
      peer.yaw = msg.yaw ?? peer.yaw;
      this.broadcast(ws, {
        type: 'pose',
        id: peer.id,
        name: peer.name,
        x: peer.x,
        z: peer.z,
        yaw: peer.yaw,
      });
    }
  }

  webSocketClose(ws: WebSocket) {
    const peer = this.sessions.get(ws);
    this.sessions.delete(ws);
    if (peer) this.broadcast(null, { type: 'leave', id: peer.id });
  }

  webSocketError(ws: WebSocket) {
    this.webSocketClose(ws);
  }

  private broadcast(except: WebSocket | null, payload: unknown) {
    const data = JSON.stringify(payload);
    for (const [sock] of this.sessions) {
      if (sock === except) continue;
      try {
        sock.send(data);
      } catch {
        /* ignore broken sockets */
      }
    }
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
