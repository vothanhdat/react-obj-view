

import React, { useMemo, useState } from 'react';
import { allExamples, quickExamples, performanceTestData } from './exampleData';
import './style.css';
import "./Test.css";
import { ObjectViewV2 } from './ObjectViewV2/ObjectView';
import type { Constructor, ResolverFn, Entry } from './ObjectViewV2/types';
import { V8 } from './V3';
import { V12 } from './V4';

// Import version from package.json
const packageVersion = "1.0.2"; // You can update this manually or use a build script
// Custom classes for demonstration
class User {
    constructor(public name: string, public email: string, public role: string = 'user') { }
}

class APIEndpoint {
    constructor(
        public method: string,
        public url: string,
        public status: number,
        public responseTime: number,
        public data?: any
    ) { }
}

const pickEntries = (entries: Entry[], keys: Array<string>): Entry[] => {
    const picked: Entry[] = [];
    for (const key of keys) {
        const index = entries.findIndex(entry => String(entry.key) === key);
        if (index !== -1) {
            const [entry] = entries.splice(index, 1);
            if (entry) {
                picked.push(entry);
            }
        }
    }
    return picked;
};

const userResolver: ResolverFn = function* (user: User, iterator, isPreview) {
    const entries = [...iterator];
    if (isPreview) {
        yield {
            key: 'summary',
            value: `${user.name} • ${user.email}`,
            enumerable: true,
        };
        if (user.role !== 'user') {
            yield {
                key: 'role',
                value: user.role,
                enumerable: true,
            };
        }
        return;
    }

    const prioritized = pickEntries(entries, ['name', 'email', 'role']);
    for (const entry of prioritized) {
        yield entry;
    }

    if (user.role !== 'user') {
        yield {
            key: 'badge',
            value: `⭐ ${user.role.toUpperCase()}`,
            enumerable: true,
        };
    }

    for (const entry of entries) {
        yield entry;
    }
};

const apiEndpointResolver: ResolverFn = function* (endpoint: APIEndpoint, iterator, isPreview) {
    const entries = [...iterator];
    if (isPreview) {
        yield {
            key: 'request',
            value: `${endpoint.method} ${endpoint.url}`,
            enumerable: true,
        };
        yield {
            key: 'status',
            value: endpoint.status,
            enumerable: true,
        };
        return;
    }

    const [methodEntry, urlEntry, statusEntry, responseTimeEntry] = pickEntries(entries, ['method', 'url', 'status', 'responseTime']);
    if (methodEntry) yield methodEntry;
    if (urlEntry) yield urlEntry;
    if (statusEntry) yield statusEntry;

    yield {
        key: 'responseTimeLabel',
        value: `${endpoint.responseTime}ms`,
        enumerable: true,
    };

    if (responseTimeEntry) yield responseTimeEntry;

    const [dataEntry] = pickEntries(entries, ['data']);
    if (dataEntry) yield dataEntry;

    for (const entry of entries) {
        yield entry;
    }
};

// Create custom data with new classes
const createCustomExampleData = () => ({
    users: {
        admin: new User("Admin User", "admin@example.com", "admin"),
        moderator: new User("Mod User", "mod@example.com", "moderator"),
        regular: new User("John Doe", "john@example.com")
    },
    apiCalls: {
        getUsersAPI: new APIEndpoint('GET', '/api/users', 200, 145),
        loginAPI: new APIEndpoint('POST', '/api/auth/login', 401, 89),
        createUserAPI: new APIEndpoint('POST', '/api/users', 201, 234),
        deleteUserAPI: new APIEndpoint('DELETE', '/api/users/123', 204, 156)
    },
    keywordDemo: {
        isActive: true,
        isDisabled: false,
        data: null,
        config: undefined,
        emptyString: "",
        zeroNumber: 0
    }
});

// Create a flat list of all available test data for the dropdown
const testDataOptions = [
    // Quick Examples
    { label: 'Quick - Simple Object', value: quickExamples.simple, category: 'Quick' },
    { label: 'Quick - Moderate Nested', value: quickExamples.moderate, category: 'Quick' },
    { label: 'Quick - Complex Mixed Types', value: quickExamples.complex, category: 'Quick' },

    // NEW: Resolver demos
    { label: 'Demo - Class Resolvers', value: createCustomExampleData(), category: 'Demo' },
    {
        label: 'Demo - Keyword Styling', value: {
            booleans: { isTrue: true, isFalse: false },
            nullish: { nullValue: null, undefinedValue: undefined },
            emptyValues: { emptyString: "", zeroNumber: 0, emptyArray: [], emptyObject: {} }
        }, category: 'Demo'
    },

    // Primitives
    {
        label: 'Primitives - Basic Types', value: {
            string: allExamples.primitives.string,
            number: allExamples.primitives.number,
            boolean: allExamples.primitives.boolean,
            nullValue: allExamples.primitives.nullValue,
            undefinedValue: allExamples.primitives.undefinedValue,
            date: allExamples.primitives.date,
            regex: allExamples.primitives.regex,
        }, category: 'Primitives'
    },
    { label: 'Primitives - String Variations', value: allExamples.primitives.strings, category: 'Primitives' },
    { label: 'Primitives - Number Variations', value: allExamples.primitives.numbers, category: 'Primitives' },

    // Arrays
    { label: 'Arrays - Basic Examples', value: allExamples.arrays.numbers, category: 'Arrays' },
    { label: 'Arrays - Mixed Types', value: allExamples.arrays.mixed, category: 'Arrays' },
    { label: 'Arrays - Nested Arrays', value: allExamples.arrays.nested, category: 'Arrays' },
    { label: 'Arrays - Array of Objects', value: allExamples.arrays.objects, category: 'Arrays' },
    { label: 'Arrays - Large Array (100 items)', value: allExamples.arrays.large, category: 'Arrays' },

    // Objects
    { label: 'Objects - Simple Object', value: allExamples.objects.simple, category: 'Objects' },
    { label: 'Objects - Deeply Nested', value: allExamples.objects.nested, category: 'Objects' },
    { label: 'Objects - With Arrays', value: allExamples.objects.withArrays, category: 'Objects' },
    { label: 'Objects - With Functions', value: allExamples.objects.withFunctions, category: 'Objects' },
    { label: 'Objects - Special Values', value: allExamples.objects.specialValues, category: 'Objects' },
    { label: 'Objects - Circular Reference', value: allExamples.objects.circular, category: 'Objects' },

    // Complex Structures
    { label: 'Complex - Deep Nesting (10 levels)', value: allExamples.complex.deepNesting, category: 'Complex' },
    { label: 'Complex - Many Properties (100)', value: allExamples.complex.manyProperties, category: 'Complex' },
    { label: 'Complex - Mixed Data Types', value: allExamples.complex.mixedTypes, category: 'Complex' },
    { label: 'Complex - API Response Simulation', value: allExamples.complex.apiResponse, category: 'Complex' },

    // Edge Cases
    { label: 'Edge - Prototype Chain', value: allExamples.edge.prototypeChain, category: 'Edge Cases' },
    { label: 'Edge - Symbols', value: allExamples.edge.symbols, category: 'Edge Cases' },
    { label: 'Edge - Collections (Map/Set)', value: allExamples.edge.collections, category: 'Edge Cases' },
    { label: 'Edge - Generators', value: allExamples.edge.generators, category: 'Edge Cases' },
    { label: 'Edge - Promises', value: allExamples.edge.promises, category: 'Edge Cases' },
    { label: 'Edge - Regular Expressions', value: allExamples.edge.regexVariations, category: 'Edge Cases' },

    // Performance Test Data
    { label: 'Performance - Small Dataset (10 items)', value: performanceTestData.small, category: 'Performance' },
    { label: 'Performance - Medium Dataset (100 items)', value: performanceTestData.medium, category: 'Performance' },
    { label: 'Performance - Large Dataset (1000 items)', value: performanceTestData.large, category: 'Performance' },
    { label: 'Performance - Supper Large Dataset (10,000 items)', value: performanceTestData.supperLarge, category: 'Performance' },
    { label: 'Performance - Universe Dataset (100,000 items)', value: performanceTestData.suppersupperLarge, category: 'Performance' },
];

export const Test = () => {
    const [selectedData, setSelectedData] = useState(testDataOptions[0]);
    const [expandLevel, setExpandLevel] = useState<number | boolean>(1);
    const [customData, setCustomData] = useState('{\n  "name": "Custom Data",\n  "value": 123,\n  "nested": {\n    "array": [1, 2, 3],\n    "boolean": true\n  }\n}');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customDataParsed, setCustomDataParsed] = useState<any>(null);
    const [parseError, setParseError] = useState<string>('');

    // NEW: Toggle state for feature flags
    const [enableResolvers, setEnableResolvers] = useState(true);
    const [enableHighlighting, setEnableHighlighting] = useState(true);
    const [enablePreviewMode, setEnablePreviewMode] = useState(true);
    const [showNonEnumerable, setShowNonEnumerable] = useState(true);
    const [objectGrouped, setObjectGrouped] = useState(25);
    const [arrayGrouped, setArrayGrouped] = useState(10);

    // Create resolver overrides when enabled
    const resolverOverrides = useMemo<Map<Constructor, ResolverFn> | undefined>(() => {
        if (!enableResolvers) {
            return undefined;
        }
        return new Map<Constructor, ResolverFn>([
            [User as Constructor, userResolver],
            [APIEndpoint as Constructor, apiEndpointResolver],
        ]);
    }, [enableResolvers]);

    const handleDataChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndex = parseInt(event.target.value);
        setSelectedData(testDataOptions[selectedIndex]);
        setIsCustomMode(false);
    };

    const handleExpandLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (value === 'true') {
            setExpandLevel(true);
        } else if (value === 'false') {
            setExpandLevel(false);
        } else {
            setExpandLevel(parseInt(value));
        }
    };

    const handleCustomDataChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;
        setCustomData(value);

        try {
            const parsed = JSON.parse(value);
            setCustomDataParsed(parsed);
            setParseError('');
        } catch (error) {
            setParseError((error as Error).message);
            setCustomDataParsed(null);
        }
    };

    const toggleCustomMode = () => {
        setIsCustomMode(!isCustomMode);
        if (!isCustomMode) {
            // Try to parse current custom data when switching to custom mode
            try {
                const parsed = JSON.parse(customData);
                setCustomDataParsed(parsed);
                setParseError('');
            } catch (error) {
                setParseError((error as Error).message);
                setCustomDataParsed(null);
            }
        }
    };

    const getCurrentData = () => {
        if (isCustomMode) {
            return customDataParsed || { error: 'Invalid JSON', message: parseError };
        }
        return selectedData.value;
    };

    const getCurrentLabel = () => {
        if (isCustomMode) {
            return parseError ? 'Custom Data (Invalid JSON)' : 'Custom Data';
        }
        return selectedData.label;
    };

    // Group options by category for better organization
    const groupedOptions = testDataOptions.reduce((acc, option, index) => {
        if (!acc[option.category]) {
            acc[option.category] = [];
        }
        acc[option.category].push({ ...option, index });
        return acc;
    }, {} as Record<string, Array<typeof testDataOptions[0] & { index: number }>>);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header Section */}
            <header style={{
                backgroundColor: '#fff',
                borderBottom: '1px solid #dee2e6',
                padding: '1rem 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ margin: '0', color: '#212529', fontSize: '1.75rem' }}>
                            🌳 React Object View
                        </h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '1rem' }}>
                            Interactive Demo - Visualize JavaScript objects with ease
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <a
                            href="https://github.com/vothanhdat/react-obj-view"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#212529',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                        <a
                            href="https://www.npmjs.com/package/react-obj-view"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            📦 npm
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#e8f4fd',
                    borderRadius: '8px',
                    border: '1px solid #bee5eb'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>🆕 New Features Demo</h3>
                    <p style={{ margin: '0', fontSize: '14px', color: '#0c5460' }}>
                        This demo showcases the latest features: Resolver overrides, keyword styling, and configurable highlighting.
                        Toggle "Class Resolvers" to see custom User and API endpoint insights in action.
                    </p>
                </div>            <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                <input
                                    type="radio"
                                    checked={!isCustomMode}
                                    onChange={() => setIsCustomMode(false)}
                                    style={{ marginRight: '8px' }}
                                />
                                Preset Data
                            </label>
                            <select
                                value={testDataOptions.indexOf(selectedData)}
                                onChange={handleDataChange}
                                disabled={isCustomMode}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    minWidth: '300px',
                                    opacity: isCustomMode ? 0.5 : 1,
                                }}
                            >
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
                        </div>

                        <div>
                            <label htmlFor="expand-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Expand Level:
                            </label>
                            <select
                                id="expand-select"
                                value={expandLevel.toString()}
                                onChange={handleExpandLevelChange}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                }}
                            >
                                <option value="false">Collapsed</option>
                                <option value="1">Level 1</option>
                                <option value="2">Level 2</option>
                                <option value="3">Level 3</option>
                                <option value="4">Level 4</option>
                                <option value="5">Level 5</option>
                                <option value="true">Fully Expanded</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW: Additional controls for new features */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                🎨 Features:
                            </label>
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={enableResolvers}
                                        onChange={(e) => setEnableResolvers(e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Class Resolvers
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={enableHighlighting}
                                        onChange={(e) => setEnableHighlighting(e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Change Highlighting
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={enablePreviewMode}
                                        onChange={(e) => setEnablePreviewMode(e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Preview Mode
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={showNonEnumerable}
                                        onChange={(e) => setShowNonEnumerable(e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Show Non-enumerable
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                📦 Grouping:
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px' }}>
                                    Objects:
                                    <input
                                        type="number"
                                        value={objectGrouped}
                                        onChange={(e) => setObjectGrouped(parseInt(e.target.value) || 25)}
                                        style={{ width: '50px', marginLeft: '4px', padding: '2px' }}
                                        min="1"
                                        max="100"
                                    />
                                </label>
                                <label style={{ fontSize: '12px' }}>
                                    Arrays:
                                    <input
                                        type="number"
                                        value={arrayGrouped}
                                        onChange={(e) => setArrayGrouped(parseInt(e.target.value) || 10)}
                                        style={{ width: '50px', marginLeft: '4px', padding: '2px' }}
                                        min="1"
                                        max="100"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ minWidth: '300px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            <input
                                type="radio"
                                checked={isCustomMode}
                                onChange={toggleCustomMode}
                                style={{ marginRight: '8px' }}
                            />
                            Custom JSON Data
                        </label>
                        <textarea
                            value={customData}
                            onChange={handleCustomDataChange}
                            disabled={!isCustomMode}
                            placeholder="Enter valid JSON here..."
                            style={{
                                width: '100%',
                                height: '120px',
                                padding: '8px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                border: `1px solid ${parseError && isCustomMode ? '#ff4444' : '#ccc'}`,
                                borderRadius: '4px',
                                opacity: !isCustomMode ? 0.5 : 1,
                                backgroundColor: parseError && isCustomMode ? '#fff5f5' : 'white',
                            }}
                        />
                        {parseError && isCustomMode && (
                            <div style={{
                                color: '#ff4444',
                                fontSize: '12px',
                                marginTop: '4px',
                                padding: '4px',
                                backgroundColor: '#fff5f5',
                                border: '1px solid #ffcccc',
                                borderRadius: '4px'
                            }}>
                                JSON Error: {parseError}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3>Currently Viewing: {getCurrentLabel()}</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        {!isCustomMode && (
                            <>
                                Category: {selectedData.category} |
                                Type: {Array.isArray(selectedData.value) ? 'Array' : typeof selectedData.value} |
                            </>
                        )}
                        {isCustomMode && (
                            <>
                                Mode: Custom JSON |
                                Status: {parseError ? 'Invalid' : 'Valid'} |
                            </>
                        )}
                        Expand Level: {expandLevel === true ? 'Full' : expandLevel === false ? 'None' : expandLevel} |
                        Resolvers: {enableResolvers ? 'ON' : 'OFF'} |
                        Preview Mode: {enablePreviewMode ? 'ON' : 'OFF'} |
                        Non-enumerable: {showNonEnumerable ? 'ON' : 'OFF'} |
                        Change Highlighting: {enableHighlighting ? 'ON' : 'OFF'} |
                        Grouping: Objects({objectGrouped}) Arrays({arrayGrouped})
                    </p>
                </div>

                <div
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    <div
                        style={{
                            // border: '1px solid #ddd',
                            maxHeight: '70vh',
                            overflow: 'auto',
                        }}
                    >

                        <V12
                            value={getCurrentData()}
                            name="testData"
                            expandLevel={expandLevel}
                            highlightUpdate={enableHighlighting}
                            objectGroupSize={objectGrouped}
                            arrayGroupSize={arrayGrouped}
                            resolver={resolverOverrides}
                            preview={enablePreviewMode}
                            nonEnumerable={showNonEnumerable}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#fff',
                borderTop: '1px solid #dee2e6',
                padding: '2rem 0',
                marginTop: '2rem'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#212529' }}>React Object View</h4>
                        <p style={{ margin: '0', color: '#6c757d', fontSize: '0.875rem' }}>
                            A powerful React component for visualizing JavaScript objects and data structures
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '1rem'
                    }}>
                        <a
                            href="https://github.com/vothanhdat/react-obj-view#readme"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            📖 Documentation
                        </a>
                        <a
                            href="https://github.com/vothanhdat/react-obj-view/blob/master/API_DOCUMENTATION.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            🔧 API Reference
                        </a>
                        <a
                            href="https://github.com/vothanhdat/react-obj-view/blob/master/USAGE_GUIDE.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            📚 Usage Guide
                        </a>
                        <a
                            href="https://github.com/vothanhdat/react-obj-view/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            🐛 Issues
                        </a>
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#adb5bd',
                        borderTop: '1px solid #e9ecef',
                        paddingTop: '1rem'
                    }}>
                        <p style={{ margin: '0' }}>
                            Made with ❤️ by <a
                                href="https://github.com/vothanhdat"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#007bff', textDecoration: 'none' }}
                            >
                                Dat Vo
                            </a> • MIT License • Version {packageVersion}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};