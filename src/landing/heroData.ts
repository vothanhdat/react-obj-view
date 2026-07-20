// Realistic, visually-rich dataset for the hero viewer.
// Kept lightweight (builds instantly on load); the multi-million-node
// stress dataset is imported lazily only when the visitor asks for it.

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]

const firstNames = ['Ada', 'Grace', 'Linus', 'Dennis', 'Margaret', 'Alan', 'Barbara', 'Ken', 'Radia', 'Guido']
const lastNames = ['Lovelace', 'Hopper', 'Torvalds', 'Ritchie', 'Hamilton', 'Turing', 'Liskov', 'Thompson', 'Perlman', 'van Rossum']
const roles = ['owner', 'admin', 'editor', 'viewer']
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const routes = ['/api/users', '/api/orders', '/api/auth/session', '/api/billing/invoices', '/api/search', '/api/webhooks']
const statuses = [200, 201, 204, 400, 401, 404, 429, 500]

const makeUser = (i: number) => ({
  id: `usr_${(1000 + i).toString(36)}`,
  name: `${pick(firstNames, i)} ${pick(lastNames, i * 7)}`,
  email: `${pick(firstNames, i).toLowerCase()}@example.com`,
  role: pick(roles, i),
  active: i % 4 !== 0,
  lastSeen: new Date(Date.UTC(2024, i % 12, (i % 27) + 1, (i % 23), (i * 7) % 60)),
  scopes: new Set([pick(['read', 'write', 'deploy', 'billing'], i), pick(['read', 'write', 'deploy', 'billing'], i + 2)]),
  preferences: {
    theme: pick(['system', 'dark', 'light'], i),
    density: pick(['comfortable', 'compact'], i),
    notifications: { email: i % 2 === 0, push: i % 3 === 0, digest: 'weekly' },
  },
})

const makeRequest = (i: number) => ({
  id: `req_${(9000 + i).toString(16)}`,
  method: pick(methods, i),
  route: pick(routes, i),
  status: pick(statuses, i * 3),
  durationMs: 8 + ((i * 37) % 240),
  cached: i % 5 === 0,
  region: pick(['sfo', 'iad', 'fra', 'sin'], i),
  ts: new Date(Date.UTC(2024, 5, (i % 27) + 1, 9, (i * 3) % 60, (i * 11) % 60)),
})

/**
 * Builds a realistic app-state snapshot. `scale` multiplies the collection
 * sizes so the same shape can be small (hero) or dense (a heavier preview).
 */
export const createHeroData = (scale = 1) => ({
  session: {
    id: 'sess_7Hk29fLptQ',
    startedAt: new Date(Date.UTC(2024, 5, 14, 8, 30, 0)),
    authenticated: true,
    device: { platform: 'macOS', browser: 'Chrome 126', viewport: { w: 1512, h: 982 }, retina: true },
    flags: new Map<string, boolean>([
      ['new-inspector', true],
      ['virtualized-rows', true],
      ['async-traversal', true],
      ['grouping', false],
    ]),
  },
  users: Array.from({ length: 24 * scale }, (_, i) => makeUser(i)),
  requests: Array.from({ length: 40 * scale }, (_, i) => makeRequest(i)),
  metrics: {
    uptime: 0.99987,
    rps: 12480,
    p50: 41,
    p95: 118,
    p99: 240,
    errorRate: 0.0021,
    saturation: [0.42, 0.51, 0.63, 0.58, 0.71, 0.66, 0.74],
    memory: new Float64Array([128.4, 131.2, 129.9, 133.7, 140.1]),
  },
  config: {
    version: '1.1.10',
    features: { search: true, resolvers: true, stickyHeaders: true, lineNumbers: true },
    limits: { maxNodes: 8_000_000, iterateSize: 5000, overscan: 8 },
    theme: null as string | null,
    experimental: undefined as unknown,
    regexRoute: /^\/api\/(users|orders)\/(\d+)$/,
  },
})

export type HeroData = ReturnType<typeof createHeroData>
