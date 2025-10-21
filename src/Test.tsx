

import React, { useState } from 'react';
import { ObjectView } from './ObjectView';
import { allExamples, quickExamples, performanceTestData } from './exampleData';
import './style.css';

// Create a flat list of all available test data for the dropdown
const testDataOptions = [
  // Quick Examples
  { label: 'Quick - Simple Object', value: quickExamples.simple, category: 'Quick' },
  { label: 'Quick - Moderate Nested', value: quickExamples.moderate, category: 'Quick' },
  { label: 'Quick - Complex Mixed Types', value: quickExamples.complex, category: 'Quick' },
  
  // Primitives
  { label: 'Primitives - Basic Types', value: { 
    string: allExamples.primitives.string,
    number: allExamples.primitives.number,
    boolean: allExamples.primitives.boolean,
    nullValue: allExamples.primitives.nullValue,
    undefinedValue: allExamples.primitives.undefinedValue,
    date: allExamples.primitives.date,
    regex: allExamples.primitives.regex,
  }, category: 'Primitives' },
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
];

export const Test = () => {
  const [selectedData, setSelectedData] = useState(testDataOptions[0]);
  const [expandLevel, setExpandLevel] = useState<number | boolean>(1);
  const [customData, setCustomData] = useState('{\n  "name": "Custom Data",\n  "value": 123,\n  "nested": {\n    "array": [1, 2, 3],\n    "boolean": true\n  }\n}');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDataParsed, setCustomDataParsed] = useState<any>(null);
  const [parseError, setParseError] = useState<string>('');

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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ObjectView Test Interface</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
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
          Expand Level: {expandLevel === true ? 'Full' : expandLevel === false ? 'None' : expandLevel}
        </p>
      </div>

      <div 
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#f9f9f9',
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <ObjectView 
          value={getCurrentData()} 
          name="testData"
          expandLevel={expandLevel}
        />
      </div>
    </div>
  );
};