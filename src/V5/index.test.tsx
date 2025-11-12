import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ObjectView } from '../index'

describe('ObjectView component', () => {
  describe('basic rendering', () => {
    it('should render primitive values', () => {
      const { container } = render(
        <ObjectView valueGetter={() => 42} name="number" />
      )
      expect(container).toBeTruthy()
    })

    it('should render string values', () => {
      const { container } = render(
        <ObjectView valueGetter={() => "hello"} name="text" />
      )
      expect(container).toBeTruthy()
    })

    it('should render boolean values', () => {
      const { container } = render(
        <ObjectView valueGetter={() => true} name="flag" />
      )
      expect(container).toBeTruthy()
    })

    it('should render null', () => {
      const { container } = render(
        <ObjectView valueGetter={() => null} name="nullValue" />
      )
      expect(container).toBeTruthy()
    })

    it('should render undefined', () => {
      const { container } = render(
        <ObjectView valueGetter={() => undefined} name="undefinedValue" />
      )
      expect(container).toBeTruthy()
    })
  })

  describe('object rendering', () => {
    it('should render simple objects', () => {
      const obj = { name: 'John', age: 30 }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="user" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="data" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      const { container } = render(
        <ObjectView valueGetter={() => arr} name="numbers" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render arrays with objects', () => {
      const arr = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      const { container } = render(
        <ObjectView valueGetter={() => arr} name="items" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('expandLevel prop', () => {
    it('should work with expandLevel as number', () => {
      const obj = { a: { b: { c: 1 } } }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="nested" expandLevel={2} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should work with expandLevel as boolean true', () => {
      const obj = { a: 1, b: 2 }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="data" expandLevel={true} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should work with expandLevel as boolean false', () => {
      const obj = { a: 1, b: 2 }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="data" expandLevel={false} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('special data types', () => {
    it('should render Maps', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
      const { container } = render(
        <ObjectView valueGetter={() => map} name="mapData" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render Sets', () => {
      const set = new Set([1, 2, 3, 4])
      const { container } = render(
        <ObjectView valueGetter={() => set} name="setData" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render Dates', () => {
      const date = new Date('2024-01-01')
      const { container } = render(
        <ObjectView valueGetter={() => date} name="dateValue" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render RegExp', () => {
      const regex = /test/gi
      const { container } = render(
        <ObjectView valueGetter={() => regex} name="pattern" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render Errors', () => {
      const error = new Error('Test error')
      const { container } = render(
        <ObjectView valueGetter={() => error} name="errorObj" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('options', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <ObjectView 
          valueGetter={() => ({ a: 1 })} 
          name="data"
          className="custom-class"
        />
      )
      const root = container.querySelector('.big-objview-root')
      expect(root).toBeTruthy()
      expect(root?.classList.contains('custom-class')).toBe(true)
    })

    it('should accept style prop', () => {
      const { container } = render(
        <ObjectView 
          valueGetter={() => ({ a: 1 })} 
          name="data"
          style={{ backgroundColor: 'red' }}
        />
      )
      const root = container.querySelector('.big-objview-root') as HTMLElement
      expect(root).toBeTruthy()
      expect(root?.style.backgroundColor).toBe('red')
    })

    it('should accept lineHeight prop', () => {
      const { container } = render(
        <ObjectView 
          valueGetter={() => ({ a: 1 })} 
          name="data"
          lineHeight={20}
        />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should accept preview prop', () => {
      const { container } = render(
        <ObjectView 
          valueGetter={() => ({ a: 1, b: 2 })} 
          name="data"
          preview={false}
        />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should accept showLineNumbers prop', () => {
      const { container } = render(
        <ObjectView 
          valueGetter={() => ({ a: 1 })} 
          name="data"
          showLineNumbers={true}
        />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('complex scenarios', () => {
    it('should render deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      }
      const { container } = render(
        <ObjectView valueGetter={() => data} name="deep" expandLevel={5} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should render mixed data types', () => {
      const data = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
        date: new Date(),
        regex: /test/
      }
      const { container } = render(
        <ObjectView valueGetter={() => data} name="mixed" />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle large arrays', () => {
      const arr = Array(1000).fill(0).map((_, i) => ({ id: i, value: `Item ${i}` }))
      const { container } = render(
        <ObjectView valueGetter={() => arr} name="large" arrayGroupSize={100} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle large objects', () => {
      const obj = Object.fromEntries(
        Array(1000).fill(0).map((_, i) => [`key${i}`, i])
      )
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="large" objectGroupSize={100} />
      )
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })
})
