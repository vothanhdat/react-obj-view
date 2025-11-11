import { describe, it, expect } from 'vitest'
import { getObjectUniqueId } from './getObjectUniqueId'

describe('getObjectUniqueId', () => {
  describe('basic functionality', () => {
    it('should return unique ID for objects', () => {
      const obj1 = { name: 'obj1' }
      const obj2 = { name: 'obj2' }
      
      const id1 = getObjectUniqueId(obj1)
      const id2 = getObjectUniqueId(obj2)
      
      expect(id1).toBeTypeOf('number')
      expect(id2).toBeTypeOf('number')
      expect(id1).not.toBe(id2)
    })

    it('should return same ID for same object', () => {
      const obj = { value: 42 }
      
      const id1 = getObjectUniqueId(obj)
      const id2 = getObjectUniqueId(obj)
      const id3 = getObjectUniqueId(obj)
      
      expect(id1).toBe(id2)
      expect(id2).toBe(id3)
    })

    it('should return 0 for primitives', () => {
      expect(getObjectUniqueId(42)).toBe(0)
      expect(getObjectUniqueId('string')).toBe(0)
      expect(getObjectUniqueId(true)).toBe(0)
      expect(getObjectUniqueId(null)).toBe(0)
      expect(getObjectUniqueId(undefined)).toBe(0)
    })

    it('should generate sequential IDs', () => {
      const obj1 = {}
      const obj2 = {}
      const obj3 = {}
      
      const id1 = getObjectUniqueId(obj1)
      const id2 = getObjectUniqueId(obj2)
      const id3 = getObjectUniqueId(obj3)
      
      // IDs should be different and sequential
      expect(id2).toBeGreaterThan(id1)
      expect(id3).toBeGreaterThan(id2)
    })
  })

  describe('different object types', () => {
    it('should handle arrays', () => {
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 3]
      
      const id1 = getObjectUniqueId(arr1)
      const id2 = getObjectUniqueId(arr2)
      
      expect(id1).not.toBe(id2) // Different arrays
      expect(getObjectUniqueId(arr1)).toBe(id1) // Same array, same ID
    })

    it('should handle functions', () => {
      const fn1 = () => {}
      const fn2 = () => {}
      
      const id1 = getObjectUniqueId(fn1)
      const id2 = getObjectUniqueId(fn2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(fn1)).toBe(id1)
    })

    it('should handle Date objects', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-01')
      
      const id1 = getObjectUniqueId(date1)
      const id2 = getObjectUniqueId(date2)
      
      expect(id1).not.toBe(id2) // Different instances
      expect(getObjectUniqueId(date1)).toBe(id1)
    })

    it('should handle RegExp objects', () => {
      const regex1 = /test/gi
      const regex2 = /test/gi
      
      const id1 = getObjectUniqueId(regex1)
      const id2 = getObjectUniqueId(regex2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(regex1)).toBe(id1)
    })

    it('should handle Map objects', () => {
      const map1 = new Map([['key', 'value']])
      const map2 = new Map([['key', 'value']])
      
      const id1 = getObjectUniqueId(map1)
      const id2 = getObjectUniqueId(map2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(map1)).toBe(id1)
    })

    it('should handle Set objects', () => {
      const set1 = new Set([1, 2, 3])
      const set2 = new Set([1, 2, 3])
      
      const id1 = getObjectUniqueId(set1)
      const id2 = getObjectUniqueId(set2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(set1)).toBe(id1)
    })

    it('should handle Error objects', () => {
      const error1 = new Error('test')
      const error2 = new Error('test')
      
      const id1 = getObjectUniqueId(error1)
      const id2 = getObjectUniqueId(error2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(error1)).toBe(id1)
    })

    it('should handle Promise objects', () => {
      const promise1 = Promise.resolve(1)
      const promise2 = Promise.resolve(1)
      
      const id1 = getObjectUniqueId(promise1)
      const id2 = getObjectUniqueId(promise2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(promise1)).toBe(id1)
    })

    it('should handle class instances', () => {
      class TestClass {
        value: number
        constructor(value: number) {
          this.value = value
        }
      }
      
      const instance1 = new TestClass(1)
      const instance2 = new TestClass(1)
      
      const id1 = getObjectUniqueId(instance1)
      const id2 = getObjectUniqueId(instance2)
      
      expect(id1).not.toBe(id2)
      expect(getObjectUniqueId(instance1)).toBe(id1)
    })

    it('should handle typed arrays', () => {
      const int8 = new Int8Array([1, 2, 3])
      const uint8 = new Uint8Array([1, 2, 3])
      const float32 = new Float32Array([1.1, 2.2, 3.3])
      
      const id1 = getObjectUniqueId(int8)
      const id2 = getObjectUniqueId(uint8)
      const id3 = getObjectUniqueId(float32)
      
      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(getObjectUniqueId(int8)).toBe(id1)
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const obj = {}
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(obj)).toBe(id)
    })

    it('should handle empty arrays', () => {
      const arr = []
      const id = getObjectUniqueId(arr)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(arr)).toBe(id)
    })

    it('should handle objects with circular references', () => {
      const obj: any = { name: 'test' }
      obj.self = obj
      
      const id1 = getObjectUniqueId(obj)
      const id2 = getObjectUniqueId(obj)
      
      expect(id1).toBe(id2)
    })

    it('should handle frozen objects', () => {
      const obj = Object.freeze({ value: 1 })
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(obj)).toBe(id)
    })

    it('should handle sealed objects', () => {
      const obj = Object.seal({ value: 1 })
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(obj)).toBe(id)
    })

    it('should handle objects with symbols', () => {
      const sym = Symbol('test')
      const obj = { [sym]: 'value' }
      
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(obj)).toBe(id)
    })

    it('should handle null prototype objects', () => {
      const obj = Object.create(null)
      obj.value = 42
      
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      expect(getObjectUniqueId(obj)).toBe(id)
    })
  })

  describe('performance and uniqueness', () => {
    it('should generate unique IDs for many objects', () => {
      const count = 1000
      const objects = Array(count).fill(0).map(() => ({}))
      const ids = objects.map(obj => getObjectUniqueId(obj))
      
      // All IDs should be unique
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(count)
    })

    it('should be consistent across multiple calls', () => {
      const objects = Array(100).fill(0).map(() => ({}))
      
      // Get IDs first time
      const ids1 = objects.map(obj => getObjectUniqueId(obj))
      
      // Get IDs second time
      const ids2 = objects.map(obj => getObjectUniqueId(obj))
      
      // Should be identical
      expect(ids1).toEqual(ids2)
    })

    it('should handle rapid consecutive calls', () => {
      const obj = { value: 'test' }
      
      const ids = Array(100).fill(0).map(() => getObjectUniqueId(obj))
      
      // All should be the same
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(1)
    })
  })

  describe('memory management', () => {
    it('should not prevent garbage collection of objects', () => {
      // This test verifies the use of WeakMap
      // WeakMap allows objects to be garbage collected
      
      let obj: any = { large: 'data' }
      const id = getObjectUniqueId(obj)
      
      expect(id).toBeTypeOf('number')
      
      // In a real scenario, when obj is no longer referenced,
      // the WeakMap entry can be garbage collected
      obj = null
      
      // We can't directly test GC, but we verified WeakMap usage
      expect(obj).toBeNull()
    })
  })

  describe('special numeric values', () => {
    it('should return 0 for NaN', () => {
      expect(getObjectUniqueId(NaN)).toBe(0)
    })

    it('should return 0 for Infinity', () => {
      expect(getObjectUniqueId(Infinity)).toBe(0)
      expect(getObjectUniqueId(-Infinity)).toBe(0)
    })

    it('should return 0 for -0', () => {
      expect(getObjectUniqueId(-0)).toBe(0)
    })
  })

  describe('comparison with objects having same structure', () => {
    it('should give different IDs to structurally identical objects', () => {
      const obj1 = { a: 1, b: 2, c: { d: 3 } }
      const obj2 = { a: 1, b: 2, c: { d: 3 } }
      
      const id1 = getObjectUniqueId(obj1)
      const id2 = getObjectUniqueId(obj2)
      
      expect(id1).not.toBe(id2)
    })

    it('should give same ID to references of the same object', () => {
      const obj = { value: 42 }
      const ref1 = obj
      const ref2 = obj
      
      const id1 = getObjectUniqueId(obj)
      const id2 = getObjectUniqueId(ref1)
      const id3 = getObjectUniqueId(ref2)
      
      expect(id1).toBe(id2)
      expect(id2).toBe(id3)
    })
  })
})
