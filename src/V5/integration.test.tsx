import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ObjectView } from '../index'

describe('ObjectView Integration Tests', () => {
  describe('circular references', () => {
    it('should handle simple circular reference', () => {
      const obj: any = { name: 'root' }
      obj.self = obj
      
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="circular" expandLevel={3} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle nested circular references', () => {
      const obj: any = {
        a: { name: 'a' },
        b: { name: 'b' }
      }
      obj.a.parent = obj
      obj.b.parent = obj
      obj.a.sibling = obj.b
      obj.b.sibling = obj.a
      
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="circular" expandLevel={3} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle circular array references', () => {
      const arr: any[] = [1, 2, 3]
      arr.push(arr)
      
      const { container } = render(
        <ObjectView valueGetter={() => arr} name="circularArray" expandLevel={3} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle mutual circular references', () => {
      const obj1: any = { name: 'obj1' }
      const obj2: any = { name: 'obj2' }
      obj1.ref = obj2
      obj2.ref = obj1
      
      const { container } = render(
        <ObjectView valueGetter={() => obj1} name="mutual" expandLevel={5} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('complex nested structures', () => {
    it('should handle deeply nested objects with arrays', () => {
      const data = {
        users: [
          {
            id: 1,
            name: 'User 1',
            posts: [
              { id: 1, title: 'Post 1', comments: [{ id: 1, text: 'Comment 1' }] },
              { id: 2, title: 'Post 2', comments: [{ id: 2, text: 'Comment 2' }] }
            ]
          },
          {
            id: 2,
            name: 'User 2',
            posts: [
              { id: 3, title: 'Post 3', comments: [] }
            ]
          }
        ]
      }
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="complex" expandLevel={5} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle mixed collections', () => {
      const data = {
        map: new Map([
          ['key1', new Set([1, 2, 3])],
          ['key2', new Map([['nested', 'value']])]
        ]),
        set: new Set([
          { type: 'object' },
          [1, 2, 3],
          new Date()
        ])
      }
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="mixed" expandLevel={3} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle promises in objects', () => {
      const data = {
        pending: new Promise(() => {}),
        resolved: Promise.resolve(42),
        rejected: Promise.reject(new Error('failed'))
      }
      
      // Catch the rejection to prevent unhandled promise rejection
      data.rejected.catch(() => {})
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="promises" expandLevel={2} />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle functions and symbols', () => {
      const sym1 = Symbol('test')
      const sym2 = Symbol.for('global')
      
      const data = {
        func: function namedFunc() { return 42 },
        arrow: () => 'arrow',
        async: async () => 'async',
        [sym1]: 'symbol value',
        [sym2]: 'global symbol'
      }
      
      const { container } = render(
        <ObjectView 
          valueGetter={() => data} 
          name="special" 
          expandLevel={1}
          includeSymbols={true}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('performance scenarios', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array(10000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random()
      }))
      
      const { container } = render(
        <ObjectView 
          valueGetter={() => largeArray} 
          name="largeArray"
          arrayGroupSize={100}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle large objects efficiently', () => {
      const largeObject = Object.fromEntries(
        Array(10000).fill(0).map((_, i) => [
          `key${i}`,
          { id: i, value: Math.random() }
        ])
      )
      
      const { container } = render(
        <ObjectView 
          valueGetter={() => largeObject} 
          name="largeObject"
          objectGroupSize={100}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle deeply nested structures', () => {
      let deep: any = { value: 'leaf' }
      for (let i = 0; i < 100; i++) {
        deep = { nested: deep }
      }
      
      const { container } = render(
        <ObjectView 
          valueGetter={() => deep} 
          name="deep"
          expandLevel={5}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const { container } = render(
        <ObjectView valueGetter={() => ({})} name="empty" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle empty arrays', () => {
      const { container } = render(
        <ObjectView valueGetter={() => []} name="emptyArray" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle objects with numeric keys', () => {
      const obj = { 0: 'zero', 1: 'one', 10: 'ten', 100: 'hundred' }
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="numeric" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle sparse arrays', () => {
      const arr = []
      arr[0] = 'first'
      arr[100] = 'hundredth'
      arr[1000] = 'thousandth'
      
      const { container } = render(
        <ObjectView valueGetter={() => arr} name="sparse" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle special number values', () => {
      const data = {
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN,
        negZero: -0,
        maxSafeInt: Number.MAX_SAFE_INTEGER,
        minSafeInt: Number.MIN_SAFE_INTEGER
      }
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="numbers" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle typed arrays', () => {
      const data = {
        int8: new Int8Array([1, 2, 3]),
        uint8: new Uint8Array([1, 2, 3]),
        int16: new Int16Array([100, 200, 300]),
        float32: new Float32Array([1.1, 2.2, 3.3]),
        float64: new Float64Array([1.1, 2.2, 3.3])
      }
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="typed" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle frozen and sealed objects', () => {
      const frozen = Object.freeze({ frozen: true })
      const sealed = Object.seal({ sealed: true })
      
      const data = { frozen, sealed }
      
      const { container } = render(
        <ObjectView valueGetter={() => data} name="immutable" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle objects with getters and setters', () => {
      const obj = {
        _value: 10,
        get value() { return this._value },
        set value(v) { this._value = v }
      }
      
      const { container } = render(
        <ObjectView valueGetter={() => obj} name="accessors" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should handle prototype chain', () => {
      class Parent {
        parentProp = 'parent'
      }
      
      class Child extends Parent {
        childProp = 'child'
      }
      
      const instance = new Child()
      
      const { container } = render(
        <ObjectView 
          valueGetter={() => instance} 
          name="inheritance"
          nonEnumerable={true}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })

  describe('data updates', () => {
    it('should handle changing data', () => {
      let data = { count: 0 }
      
      const { container, rerender } = render(
        <ObjectView valueGetter={() => data} name="counter" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
      
      // Update data
      data = { count: 1 }
      
      rerender(
        <ObjectView valueGetter={() => data} name="counter" />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })

    it('should work with highlightUpdate option', () => {
      let data = { value: 1 }
      
      const { container, rerender } = render(
        <ObjectView 
          valueGetter={() => data} 
          name="highlight"
          highlightUpdate={true}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
      
      data = { value: 2 }
      
      rerender(
        <ObjectView 
          valueGetter={() => data} 
          name="highlight"
          highlightUpdate={true}
        />
      )
      
      expect(container.querySelector('.big-objview-root')).toBeTruthy()
    })
  })
})
