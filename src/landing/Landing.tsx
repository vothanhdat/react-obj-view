import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ObjectView } from '../react-obj-view'
import {
  themeDefault,
  themeDracula,
  themeOneDark,
  ThemeColor,
} from '../react-obj-view-themes'
import { createHeroData } from './heroData'
import { useFps } from './useFps'
import './Landing.css'

const packageVersion = '1.1.10'

type LandingProps = {
  onLaunchPlayground: () => void
}

type HeroDatasetId = 'sample' | 'rows100k' | 'rows400k'

type HeroDataset = {
  id: HeroDatasetId
  label: string
  nodes: string
  build: () => unknown | Promise<unknown>
}

const heroDatasets: HeroDataset[] = [
  { id: 'sample', label: 'App state', nodes: '~1.5K nodes', build: () => createHeroData(1) },
  {
    id: 'rows100k',
    label: '100K rows',
    nodes: '~2M nodes',
    build: async () => (await import('../exampleData')).performanceTestData.suppersupperLarge,
  },
  {
    id: 'rows400k',
    label: '400K rows',
    nodes: '~8M nodes',
    build: async () => (await import('../exampleData')).performanceTestData.massive,
  },
]

const codeSnippet = `import { ObjectView } from "react-obj-view";
import "react-obj-view/dist/react-obj-view.css";

const state = {
  user: { name: "Ada", scopes: new Set(["deploy"]) },
  requests: hugeArrayOfMillionsOfRows,
  flags: new Map([["virtualized", true]]),
};

export function DevTools() {
  return (
    <ObjectView
      valueGetter={() => state}
      expandLevel={2}
      stickyPathHeaders
      showLineNumbers
    />
  );
}`

const features = [
  {
    icon: '⚡',
    title: 'Virtualized to millions',
    body: 'Only visible rows render. 8M-node trees scroll at 60fps — no pagination, no freezing.',
  },
  {
    icon: '🧠',
    title: 'Async traversal',
    body: 'Non-blocking walking keeps the UI responsive while huge payloads are enumerated.',
  },
  {
    icon: '🔌',
    title: 'Resolver system',
    body: 'Maps, Sets, Promises, Dates, RegExp, typed arrays, buffers, and your own classes.',
  },
  {
    icon: '🔍',
    title: 'Streamed search',
    body: 'Debounced, keyboard-driven search with match highlighting and jump-to navigation.',
  },
  {
    icon: '📌',
    title: 'Sticky path headers',
    body: 'Ancestor rows pin as you scroll so nested context is never lost.',
  },
  {
    icon: '🎨',
    title: 'Themeable & typed',
    body: 'CSS-variable themes, presets, TypeScript-native API, and zero runtime dependencies.',
  },
]

const stats = [
  { value: '8M+', label: 'nodes, smooth' },
  { value: '60', label: 'fps while scrolling' },
  { value: '0', label: 'dependencies' },
  { value: 'React 19', label: 'TypeScript-native' },
]

const heroThemes: { id: string; label: string; theme: ThemeColor }[] = [
  { id: 'oneDark', label: 'One Dark', theme: themeOneDark as ThemeColor },
  { id: 'dracula', label: 'Dracula', theme: themeDracula as ThemeColor },
  { id: 'default', label: 'Default', theme: themeDefault as ThemeColor },
]

export const Landing: React.FC<LandingProps> = ({ onLaunchPlayground }) => {
  const [activeId, setActiveId] = useState<HeroDatasetId>('sample')
  const [data, setData] = useState<unknown>(() => createHeroData(1))
  const [loading, setLoading] = useState(false)
  const [renderMs, setRenderMs] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [themeId, setThemeId] = useState('oneDark')

  // Measure the very first commit too, not just dataset swaps.
  const t0Ref = useRef(performance.now())
  const measuringRef = useRef(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fps = useFps(true)

  const activeDataset = heroDatasets.find((d) => d.id === activeId) ?? heroDatasets[0]
  const theme = heroThemes.find((t) => t.id === themeId)?.theme ?? (themeOneDark as ThemeColor)

  const dataGetter = useMemo(() => () => data, [data])

  const selectDataset = useCallback(async (ds: HeroDataset) => {
    setActiveId(ds.id)
    setAutoScroll(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    const built = ds.build()
    if (built instanceof Promise) {
      setLoading(true)
      const resolved = await built
      t0Ref.current = performance.now()
      measuringRef.current = true
      setData(resolved)
      setLoading(false)
    } else {
      t0Ref.current = performance.now()
      measuringRef.current = true
      setData(built)
    }
  }, [])

  // Measure the commit time of the freshly-swapped dataset.
  useLayoutEffect(() => {
    if (measuringRef.current) {
      measuringRef.current = false
      setRenderMs(performance.now() - t0Ref.current)
    }
  }, [data])

  // Auto-scroll to demonstrate smoothness under load.
  useEffect(() => {
    if (!autoScroll) return
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    let dir = 1
    const step = () => {
      const max = el.scrollHeight - el.clientHeight
      if (max > 0) {
        el.scrollTop += dir * 6
        if (el.scrollTop >= max) dir = -1
        else if (el.scrollTop <= 0) dir = 1
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll])

  const copyInstall = useCallback(() => {
    navigator.clipboard?.writeText('npm install react-obj-view').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }, [])

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden />

      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-logo" aria-hidden>🌳</span>
          <span className="landing-brand-name">react-obj-view</span>
          <span className="landing-version">v{packageVersion}</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#code">Usage</a>
          <a href="https://github.com/vothanhdat/react-obj-view" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.npmjs.com/package/react-obj-view" target="_blank" rel="noreferrer">npm</a>
          <button className="nav-cta" onClick={onLaunchPlayground}>Open Playground →</button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">
            <span className="dot" /> Zero-dependency · React 19 · TypeScript-native
          </span>
          <h1 className="hero-title">
            Inspect <span className="grad">anything</span>.<br />
            Even a <span className="grad">million</span> nodes.
          </h1>
          <p className="hero-sub">
            A virtualized object &amp; JSON viewer that stays at 60fps while rendering trees other
            inspectors choke on. Resolvers, streamed search, sticky headers, and themes — in one
            tiny component.
          </p>

          <div className="hero-install">
            <code>
              <span className="prompt">$</span> npm install react-obj-view
            </code>
            <button onClick={copyInstall} className={`copy-btn ${copied ? 'copied' : ''}`}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="hero-actions">
            <button className="btn-primary" onClick={onLaunchPlayground}>
              Launch full playground
            </button>
            <a
              className="btn-ghost"
              href="https://github.com/vothanhdat/react-obj-view"
              target="_blank"
              rel="noreferrer"
            >
              ★ Star on GitHub
            </a>
          </div>

          <div className="hero-stats">
            {stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-viewer-wrap">
          <div className="hero-viewer-card">
            <div className="viewer-chrome">
              <span className="dots"><i /><i /><i /></span>
              <span className="chrome-title">DevTools · state inspector</span>
              <select
                className="chrome-theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                aria-label="Theme"
              >
                {heroThemes.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="viewer-hud">
              <div className="hud-metric">
                <span className="hud-num" style={{ color: fps >= 50 ? '#34d399' : fps >= 30 ? '#fbbf24' : '#f87171' }}>
                  {fps}
                </span>
                <span className="hud-lbl">fps</span>
              </div>
              <div className="hud-metric">
                <span className="hud-num">{activeDataset.nodes.replace('~', '')}</span>
                <span className="hud-lbl">in tree</span>
              </div>
              <div className="hud-metric">
                <span className="hud-num">{renderMs != null ? renderMs.toFixed(1) : '—'}<small>ms</small></span>
                <span className="hud-lbl">commit</span>
              </div>
              <button
                className={`hud-play ${autoScroll ? 'on' : ''}`}
                onClick={() => setAutoScroll((v) => !v)}
                title="Auto-scroll to show smoothness"
              >
                {autoScroll ? '❚❚ Scrolling' : '▶ Auto-scroll'}
              </button>
            </div>

            <div className="viewer-surface" style={theme as React.CSSProperties}>
              {loading && <div className="viewer-loading">Building dataset…</div>}
              <div className="viewer-scroll" ref={scrollRef}>
                <ObjectView
                  valueGetter={dataGetter}
                  name="state"
                  expandLevel={activeId === 'sample' ? 2 : 1}
                  stickyPathHeaders
                  showLineNumbers
                  preview
                  highlightUpdate
                  lineHeight={16}
                  objectGroupSize={activeId === 'sample' ? 0 : 100}
                  arrayGroupSize={activeId === 'sample' ? 0 : 100}
                  style={theme as React.CSSProperties}
                />
              </div>
            </div>

            <div className="viewer-datasets">
              <span className="datasets-label">Load:</span>
              {heroDatasets.map((ds) => (
                <button
                  key={ds.id}
                  className={`dataset-pill ${activeId === ds.id ? 'active' : ''}`}
                  onClick={() => selectDataset(ds)}
                  disabled={loading}
                >
                  {ds.label}
                  <small>{ds.nodes}</small>
                </button>
              ))}
            </div>
          </div>
          <p className="hero-hint">
            Try switching to <strong>400K rows</strong> and hit <strong>Auto-scroll</strong> — watch the fps hold.
          </p>
        </div>
      </section>

      <section className="proof">
        <span>Trusted for debugging</span>
        <div className="proof-line">
          large API responses · Redux / Zustand state · WebSocket streams · GraphQL payloads ·
          binary buffers · AST trees · telemetry logs
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-head">
          <h2>Everything you need to read complex data</h2>
          <p>Built for the payloads that make other viewers hang.</p>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" aria-hidden>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="code-showcase" id="code">
        <div className="code-copy">
          <div className="section-head left">
            <h2>Drop it in. Two props.</h2>
            <p>
              Point <code>valueGetter</code> at your data and you get a virtualized, searchable,
              themeable tree. Everything else is optional.
            </p>
          </div>
          <ul className="code-points">
            <li><b>valueGetter</b> — lazy accessor, so live data stays cheap</li>
            <li><b>expandLevel</b> — open to any depth, or all</li>
            <li><b>resolver</b> — teach it how to render your own types</li>
            <li><b>customActions</b> — copy, log, or run anything per-node</li>
          </ul>
          <button className="btn-primary" onClick={onLaunchPlayground}>
            Try every option live →
          </button>
        </div>
        <div className="code-block">
          <div className="viewer-chrome">
            <span className="dots"><i /><i /><i /></span>
            <span className="chrome-title">DevTools.tsx</span>
          </div>
          <pre><code>{codeSnippet}</code></pre>
        </div>
      </section>

      <section className="cta">
        <h2>See what your data really looks like.</h2>
        <p>Open the full playground — 45+ datasets, every feature, up to 8M nodes.</p>
        <div className="cta-actions">
          <button className="btn-primary lg" onClick={onLaunchPlayground}>Launch playground</button>
          <a className="btn-ghost lg" href="https://www.npmjs.com/package/react-obj-view" target="_blank" rel="noreferrer">
            View on npm
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Made with ❤️ by Dat Vo · MIT License</span>
        <span>react-obj-view · v{packageVersion}</span>
      </footer>
    </div>
  )
}
