import { describe, it, expect } from 'vitest'
import { getPropertyValue, hasOwnProperty, propertyIsEnumerable } from './object'

describe('object utilities', () => {
  describe('getPropertyValue', () => {
    it('should get regular property value', () => {
      const obj = { name: 'John', age: 30 }
      expect(getPropertyValue(obj, 'name')).toBe('John')
      expect(getPropertyValue(obj, 'age')).toBe(30)
    })

    it('should handle getter properties', () => {
      const obj = {
        _value: 42,
        get value() {
          return this._value * 2
        }
      }
      expect(getPropertyValue(obj, 'value')).toBe(84)
    })

    it('should handle getter that throws error', () => {
      const obj = Object.defineProperty({}, 'error', {
        get() {
          throw new Error('Getter error')
        }
      })
      expect(getPropertyValue(obj, 'error')).toBeUndefined()
    })

    it('should handle property access that throws error', () => {
      const obj = new Proxy({}, {
        get() {
          throw new Error('Access denied')
        }
      })
      expect(getPropertyValue(obj, 'anything')).toBeUndefined()
    })

    it('should handle undefined properties', () => {
      const obj = { name: 'John' }
      expect(getPropertyValue(obj, 'age')).toBeUndefined()
    })

    it('should handle symbol properties', () => {
      const sym = Symbol('test')
      const obj = { [sym]: 'symbol value' }
      expect(getPropertyValue(obj, sym)).toBe('symbol value')
    })
  })

  describe('hasOwnProperty', () => {
    it('should be the native hasOwnProperty method', () => {
      expect(hasOwnProperty).toBe(Object.prototype.hasOwnProperty)
    })
  })

  describe('propertyIsEnumerable', () => {
    it('should be the native propertyIsEnumerable method', () => {
      expect(propertyIsEnumerable).toBe(Object.prototype.propertyIsEnumerable)
    })
  })
})
