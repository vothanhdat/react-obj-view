import React, { useMemo, useState, useEffect } from 'react'
import { allExamples, quickExamples, performanceTestData } from './exampleData'
import './Test.css'
import { ObjectView } from './object-view/ObjectView'
import { ResolverFn } from './object-tree/types'
import {
  themeDefault,
  themeDracula,
  themeMaterialDarker,
  themeMonokai,
  themeOneDark,
  themeSepia,
} from './themes'

const packageVersion = '1.0.7'

class User {
  constructor(public name: string, public email: string, public role: string = 'user') { }
}

class APIEndpoint {
  constructor(
    public method: string,
    public url: string,
    public status: number,
    public responseTime: number,
    public data?: any,
  ) { }
}

const userResolver: ResolverFn<User> = (user, cb, next, isPreview) => {
  if (isPreview) {
    cb('summary', `${user.name} • ${user.email}`, true)

    if (user.role !== 'user') {
      cb('role', user.role, true)
    }
  } else {
    cb('badge', `⭐ ${user.role.toUpperCase()}`, true)
    next(user)
  }
}

const apiEndpointResolver: ResolverFn<APIEndpoint> = (endpoint, cb, next, isPreview) => {
  if (isPreview) {
    cb('request', `${endpoint.method} ${endpoint.url}`, true)
    cb('status', endpoint.status, true)
  } else {
    ; (['method', 'url', 'status', 'responseTime', 'data'] as (keyof APIEndpoint)[]).forEach((key) => {
      const value = endpoint[key]
      if (key === 'responseTime' && value) {
        cb('responseTimeLabel', `${endpoint.responseTime}ms`, true)
      }
      if (value) {
        cb(key, value, true)
      }
    })
  }
}

const createCustomExampleData = () => ({
  users: {
    admin: new User('Admin User', 'admin@example.com', 'admin'),
    moderator: new User('Mod User', 'mod@example.com', 'moderator'),
    regular: new User('John Doe', 'john@example.com'),
  },
  apiCalls: {
    getUsersAPI: new APIEndpoint('GET', '/api/users', 200, 145),
    loginAPI: new APIEndpoint('POST', '/api/auth/login', 401, 89),
    createUserAPI: new APIEndpoint('POST', '/api/users', 201, 234),
    deleteUserAPI: new APIEndpoint('DELETE', '/api/users/123', 204, 156),
  },
  keywordDemo: {
    isActive: true,
    isDisabled: false,
    data: null,
    config: undefined,
    emptyString: '',
    zeroNumber: 0,
  },
})

type TestDataOption = {
  label: string
  value: any
  category: string
  liveStream?: boolean
}

type ThemeOption = {
  id: string
  label: string
  theme: typeof themeDefault
}

const themeOptions: ThemeOption[] = [
  { id: 'default', label: 'Default', theme: themeDefault },
  { id: 'oneDark', label: 'One Dark', theme: themeOneDark },
  { id: 'dracula', label: 'Dracula', theme: themeDracula },
  { id: 'material', label: 'Material Darker', theme: themeMaterialDarker },
  { id: 'monokai', label: 'Monokai', theme: themeMonokai },
  { id: 'sepia', label: 'Sepia', theme: themeSepia },
]

const testDataOptions: TestDataOption[] = [
  { label: 'Quick • Simple Object', value: quickExamples.simple, category: 'Quick' },
  { label: 'Quick • Moderate Nested', value: quickExamples.moderate, category: 'Quick' },
  { label: 'Quick • Complex Mixed Types', value: quickExamples.complex, category: 'Quick' },
  { label: 'Demo • Class Resolvers', value: createCustomExampleData(), category: 'Demo' },
  {
    label: 'Demo • Keyword Styling',
    value: {
      booleans: { isTrue: true, isFalse: false },
      nullish: { nullValue: null, undefinedValue: undefined },
      emptyValues: { emptyString: '', zeroNumber: 0, emptyArray: [], emptyObject: {} },
    },
    category: 'Demo',
  },
  {
    label: 'Primitives • Basic Types',
    value: {
      string: allExamples.primitives.string,
      number: allExamples.primitives.number,
      boolean: allExamples.primitives.boolean,
      nullValue: allExamples.primitives.nullValue,
      undefinedValue: allExamples.primitives.undefinedValue,
      date: allExamples.primitives.date,
      regex: allExamples.primitives.regex,
    },
    category: 'Primitives',
  },
  { label: 'Primitives • String Variations', value: allExamples.primitives.strings, category: 'Primitives' },
  { label: 'Primitives • Number Variations', value: allExamples.primitives.numbers, category: 'Primitives' },
  { label: 'Live telemetry (auto-refresh)', value: null, category: 'Live', liveStream: true },
  { label: 'Arrays • Basic Examples', value: allExamples.arrays.numbers, category: 'Arrays' },
  { label: 'Arrays • Mixed Types', value: allExamples.arrays.mixed, category: 'Arrays' },
  { label: 'Arrays • Nested Arrays', value: allExamples.arrays.nested, category: 'Arrays' },
  { label: 'Arrays • Array of Objects', value: allExamples.arrays.objects, category: 'Arrays' },
  { label: 'Arrays • Large (100 items)', value: allExamples.arrays.large, category: 'Arrays' },
  { label: 'Objects • Simple Object', value: allExamples.objects.simple, category: 'Objects' },
  { label: 'Objects • Deeply Nested', value: allExamples.objects.nested, category: 'Objects' },
  { label: 'Objects • With Arrays', value: allExamples.objects.withArrays, category: 'Objects' },
  { label: 'Objects • With Functions', value: allExamples.objects.withFunctions, category: 'Objects' },
  { label: 'Objects • Special Values', value: allExamples.objects.specialValues, category: 'Objects' },
  { label: 'Objects • Circular Reference', value: allExamples.objects.circular, category: 'Objects' },
  { label: 'Complex • Deep Nesting (10 levels)', value: allExamples.complex.deepNesting, category: 'Complex' },
  { label: 'Complex • 100 Properties', value: allExamples.complex.manyProperties, category: 'Complex' },
  { label: 'Complex • 1000 Properties', value: allExamples.complex.manyManyProperties, category: 'Complex' },
  { label: 'Complex • Mixed Data Types', value: allExamples.complex.mixedTypes, category: 'Complex' },
  { label: 'Complex • API Response', value: allExamples.complex.apiResponse, category: 'Complex' },
  { label: 'Edge • Prototype Chain', value: allExamples.edge.prototypeChain, category: 'Edge Cases' },
  { label: 'Edge • Symbols', value: allExamples.edge.symbols, category: 'Edge Cases' },
  { label: 'Edge • Collections', value: allExamples.edge.collections, category: 'Edge Cases' },
  { label: 'Edge • Generators', value: allExamples.edge.generators, category: 'Edge Cases' },
  { label: 'Edge • Promises', value: allExamples.edge.promises, category: 'Edge Cases' },
  { label: 'Edge • Regex Variations', value: allExamples.edge.regexVariations, category: 'Edge Cases' },
  { label: 'Performance • Small (10 items)', value: performanceTestData.small, category: 'Performance' },
  { label: 'Performance • Medium (100 items)', value: performanceTestData.medium, category: 'Performance' },
  { label: 'Performance • Large (1000 items)', value: performanceTestData.large, category: 'Performance' },
  { label: 'Performance • Super Large (10k)', value: performanceTestData.supperLarge, category: 'Performance' },
  { label: 'Performance • Universe (100k)', value: performanceTestData.suppersupperLarge, category: 'Performance' },
]

const expandOptions: Array<{ label: string; value: number | boolean }> = [
  { label: 'Collapse', value: false },
  { label: 'Level 1', value: 1 },
  { label: 'Level 2', value: 2 },
  { label: 'Level 3', value: 3 },
  { label: 'Level 4', value: 4 },
  { label: 'Level 5', value: 5 },
  { label: 'All', value: true },
]

const createLiveSnapshot = (previous: any) => {
  const timestamp = new Date()
  return {
    timestamp: timestamp.toISOString(),
    time: previous?.time?.second != timestamp.getSeconds() ? {
      minute: timestamp.getMinutes(),
      second: timestamp.getSeconds(),
      isSecondDivisibleBy5: timestamp.getSeconds() % 5 == 0,
    } : previous.time,
    device: previous?.device?.innerWidth == window.innerWidth
      && previous?.device?.innerHeight == window.innerHeight
      ? previous?.device
      : {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        isXs: window.innerWidth >= 0 && window.innerWidth <= 576,
        isSm: window.innerWidth >= 576 && window.innerWidth <= 768,
        isMd: window.innerWidth >= 768 && window.innerWidth <= 992,
        isLg: window.innerWidth >= 992 && window.innerWidth <= 1200,
        isXl: window.innerWidth >= 1200 && window.innerWidth <= 1400,
        isXxl: window.innerWidth >= 1400,
      },
    randomUpdate: !previous?.randomUpdate || Math.random() < 0.05
      ? {
        ...previous?.randomUpdate ?? {},
        [`property-${Math.random() * 10 | 0}`]: timestamp.getMilliseconds()
      } : previous?.randomUpdate
  }
}

export const Test = () => {
  const [selectedData, setSelectedData] = useState(testDataOptions[0])
  const [expandLevel, setExpandLevel] = useState<number | boolean>(true)
  const [customData, setCustomData] = useState(
    '{\n  "name": "Custom Data",\n  "value": 123,\n  "nested": {\n    "array": [1, 2, 3],\n    "boolean": true\n  }\n}',
  )
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customDataParsed, setCustomDataParsed] = useState<any>(null)
  const [parseError, setParseError] = useState('')
  const [enableResolvers, setEnableResolvers] = useState(true)
  const [enableHighlighting, setEnableHighlighting] = useState(true)
  const [enablePreviewMode, setEnablePreviewMode] = useState(true)
  const [showNonEnumerable, setShowNonEnumerable] = useState(true)
  const [showSymbols, setShowSymbols] = useState(false)
  const [enableGrouping, setEnableGrouping] = useState(false)
  const [objectGrouped, setObjectGrouped] = useState(25)
  const [arrayGrouped, setArrayGrouped] = useState(10)
  const [selectedThemeId, setSelectedThemeId] = useState(themeOptions[0].id)
  const [liveData, setLiveData] = useState(() => createLiveSnapshot(120))
  const [useLiveStream, setUseLiveStream] = useState(false)
  const [stickyHeaders, setStickyHeaders] = useState(true)

  useEffect(() => {
    if (useLiveStream) {
      let raf: any;
      const update = () => {
        setLiveData(prev => createLiveSnapshot(prev))
        raf = requestAnimationFrame(update);
      }
      raf = requestAnimationFrame(update);
      return () => cancelAnimationFrame(raf)
    }
  }, [useLiveStream])

  const resolverOverrides = useMemo<Map<any, ResolverFn> | undefined>(() => {
    if (!enableResolvers) {
      return undefined
    }

    return new Map<any, ResolverFn>([
      [User as any, userResolver],
      [APIEndpoint as any, apiEndpointResolver],
    ])
  }, [enableResolvers])

  const groupedOptions = useMemo<Record<string, Array<TestDataOption & { index: number }>>>(() => {
    return testDataOptions.reduce((acc, option, index) => {
      if (!acc[option.category]) {
        acc[option.category] = []
      }
      acc[option.category].push({ ...option, index })
      return acc
    }, {} as Record<string, Array<TestDataOption & { index: number }>>)
  }, [])

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value)
    const option = testDataOptions[selectedIndex]
    setSelectedData(option)
    setUseLiveStream(Boolean(option.liveStream))
    setIsCustomMode(false)
  }

  const handleCustomDataChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setCustomData(value)

    try {
      const parsed = JSON.parse(value)
      setCustomDataParsed(parsed)
      setParseError('')
    } catch (error) {
      setCustomDataParsed(null)
      setParseError((error as Error).message)
    }
  }

  const toggleDataMode = (custom: boolean) => {
    setIsCustomMode(custom)
    if (custom) {
      setUseLiveStream(false)
    }

    if (custom) {
      try {
        const parsed = JSON.parse(customData)
        setCustomDataParsed(parsed)
        setParseError('')
      } catch (error) {
        setCustomDataParsed(null)
        setParseError((error as Error).message)
      }
    }
  }

  const invalidCustomData = useMemo(() => ({ error: 'Invalid JSON', message: parseError }), [parseError])

  const currentDataGetter = useMemo(() => {
    if (useLiveStream) {
      return () => liveData
    }
    if (isCustomMode) {
      return () => customDataParsed || invalidCustomData
    }
    return () => selectedData.value
  }, [useLiveStream, liveData, customDataParsed, invalidCustomData, isCustomMode, selectedData])

  const currentLabel = useMemo(() => {
    if (useLiveStream) {
      return 'Live telemetry (auto-refresh)'
    }
    if (isCustomMode) {
      return parseError ? 'Custom Data (Invalid JSON)' : 'Custom Data'
    }
    return selectedData.label
  }, [useLiveStream, isCustomMode, parseError, selectedData])

  const selectedTheme = useMemo(() => {
    return themeOptions.find((option) => option.id === selectedThemeId)?.theme ?? themeDefault
  }, [selectedThemeId])

  const selectedThemeLabel = useMemo(() => {
    return themeOptions.find((option) => option.id === selectedThemeId)?.label ?? 'Default'
  }, [selectedThemeId])

  const viewerFlags = useMemo(
    () => [
      { label: 'Grouping', active: enableGrouping },
      { label: 'Resolvers', active: enableResolvers },
      { label: 'Preview', active: enablePreviewMode },
      { label: 'Highlight', active: enableHighlighting },
      { label: 'Non-enum', active: showNonEnumerable },
      { label: 'Symbols', active: showSymbols },
      { label: 'Live stream', active: useLiveStream },
    ],
    [enableGrouping, enableHighlighting, enablePreviewMode, enableResolvers, showNonEnumerable, showSymbols, useLiveStream],
  )

  const infoChips = useMemo(
    () => [
      { label: 'Dataset', value: currentLabel },
      { label: 'Theme', value: selectedThemeLabel },
      { label: 'Objects / Arrays', value: enableGrouping ? `${objectGrouped} • ${arrayGrouped}` : 'Off' },
    ],
    [arrayGrouped, currentLabel, enableGrouping, objectGrouped, selectedThemeLabel],
  )

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-brand">
          <span className="demo-logo" aria-hidden>
            🌳
          </span>
          <div>
            <h1>React Object View</h1>
            <p>All-in-one playground for inspecting JSON and rich JavaScript objects.</p>
          </div>
        </div>
        <div className="demo-header-actions">
          <span className="version-pill">v{packageVersion}</span>
          <a className="header-link" href="https://github.com/vothanhdat/react-obj-view" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="header-link" href="https://www.npmjs.com/package/react-obj-view" target="_blank" rel="noreferrer">
            npm
          </a>
          <a className="header-link" href="https://github.com/vothanhdat/react-obj-view#readme" target="_blank" rel="noreferrer">
            Docs
          </a>
        </div>
      </header>

      <main className="demo-main">
        <aside className="control-panel">
          <div className="control-panel-scroll">
            <section className="panel-section">
              <div className="section-header">
                <h2>Dataset</h2>
                <span>Select presets or drop in JSON instantly.</span>
              </div>
              <div className="mode-toggle" role="tablist" aria-label="Data mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isCustomMode}
                  className={`control-button ${!isCustomMode ? 'is-active' : ''}`}
                  onClick={() => toggleDataMode(false)}
                >
                  Presets
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isCustomMode}
                  className={`control-button ${isCustomMode ? 'is-active' : ''}`}
                  onClick={() => toggleDataMode(true)}
                >
                  Custom JSON
                </button>
              </div>
              {!isCustomMode && (
                <label className="field">
                  <span>Choose example</span>
                  <select value={testDataOptions.indexOf(selectedData)} onChange={handlePresetChange}>
                    {Object.entries(groupedOptions).map(([category, options]) => (
                      <optgroup key={category} label={category}>
                        {options.map((option) => (
                          <option key={option.index} value={option.index}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}
              {isCustomMode && (
                <label className="field">
                  <span>Paste JSON</span>
                  <textarea value={customData} onChange={handleCustomDataChange} spellCheck={false} />
                  {parseError ? <p className="field-hint error">{parseError}</p> : <p className="field-hint">Valid JSON preview.</p>}
                </label>
              )}
            </section>

            <section className="panel-section">
              <div className="section-header">
                <h2>Display</h2>
                <span>Shape the visual experience.</span>
              </div>

              <label className="field" aria-label="Expand level">
                <span>Choose collapse level</span>
                <select
                  value={String(expandLevel)}
                  onChange={(ev) => setExpandLevel(isFinite(Number(ev.target.value))
                    ? Number(ev.target.value)
                    : Boolean(ev.target.value == "true"))
                  }
                >
                  {expandOptions.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field" aria-label="Theme selection">
                <span>Choose color theme</span>
                <select
                  value={selectedThemeId}
                  onChange={(ev) => setSelectedThemeId(ev.target.value)}
                >
                  {themeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

            </section>

            <section className="panel-section">
              <div className="section-header">
                <h2>Feature toggles</h2>
                <span>Flip switches instantly.</span>
              </div>
              <div className="toggle-grid" role="group" aria-label="Feature switches">
                {[{
                  label: 'Sticky path headers',
                  value: stickyHeaders,
                  setter: setStickyHeaders,
                },
                {
                  label: 'Highlight updates',
                  value: enableHighlighting,
                  setter: setEnableHighlighting,

                },
                {
                  label: 'Preview mode',
                  value: enablePreviewMode,
                  setter: setEnablePreviewMode,
                },
                {
                  label: 'Class resolvers',
                  value: enableResolvers,
                  setter: setEnableResolvers,
                },
                {
                  label: 'Show non-enum',
                  value: showNonEnumerable,
                  setter: setShowNonEnumerable,
                },
                {
                  label: 'Include symbols',
                  value: showSymbols,
                  setter: setShowSymbols,
                },
                {
                  label: 'Enable grouping',
                  value: enableGrouping,
                  setter: setEnableGrouping,
                }].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`control-button ${item.value ? 'is-active' : ''}`}
                    onClick={() => item.setter(!item.value)}
                    aria-pressed={item.value}
                  >
                    {item.label}
                  </button>
                ))}
              </div>


              {enableGrouping && <div className="slider-field">
                <label htmlFor="object-group-range">Object grouping</label>
                <div>
                  <input
                    id="object-group-range"
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={objectGrouped}
                    onChange={(event) => setObjectGrouped(Number(event.target.value))}
                    disabled={!enableGrouping}
                  />
                  <span>{enableGrouping ? objectGrouped : 'Off'}</span>
                </div>
              </div>}
              {enableGrouping && <div className="slider-field">
                <label htmlFor="array-group-range">Array grouping</label>
                <div>
                  <input
                    id="array-group-range"
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={arrayGrouped}
                    onChange={(event) => setArrayGrouped(Number(event.target.value))}
                    disabled={!enableGrouping}
                  />
                  <span>{enableGrouping ? arrayGrouped : 'Off'}</span>
                </div>
              </div>}
            </section>

            <section className="panel-section compact">
              <div className="section-header">
                <h2>Snapshot</h2>
                <span>Quick summary at a glance.</span>
              </div>
              <div className="chip-row">
                {infoChips.map((chip) => (
                  <span className="info-chip" key={chip.label}>
                    <strong>{chip.label}:</strong> {chip.value}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <section className="viewer">
          <div className="viewer-header">
            <div className="viewer-title">
              <h2>{currentLabel}</h2>
              <p>Experiment with nested data, high volume datasets, and resolver previews in one place.</p>
            </div>
            <div className="viewer-flags">
              {viewerFlags.map((flag) => (
                <span key={flag.label} className={`feature-chip ${flag.active ? 'active' : 'inactive'}`}>
                  {flag.label}
                </span>
              ))}
            </div>
          </div>
          <div className="viewer-body" style={selectedTheme}>
            <ObjectView
              valueGetter={currentDataGetter}
              name="testData"
              expandLevel={expandLevel}
              highlightUpdate={enableHighlighting}
              objectGroupSize={enableGrouping ? objectGrouped : 0}
              arrayGroupSize={enableGrouping ? arrayGrouped : 0}
              resolver={resolverOverrides}
              preview={enablePreviewMode}
              nonEnumerable={showNonEnumerable}
              showLineNumbers={true}
              lineHeight={14}
              includeSymbols={showSymbols}
              style={selectedTheme}
              stickyPathHeaders={stickyHeaders}
            />
          </div>
        </section>
      </main>

      <footer className="demo-footer">
        <span>Made with ❤️ by Dat Vo • MIT License</span>
        <span>React Object View · Playground demo</span>
      </footer>
    </div>
  )
}
