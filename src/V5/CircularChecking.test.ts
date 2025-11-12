import { describe, it, expect, beforeEach } from 'vitest'
import { CircularChecking } from './CircularChecking'

describe('CircularChecking', () => {
  let checker: CircularChecking

  beforeEach(() => {
    checker = new CircularChecking()
  })

  describe('checkCircular', () => {
    it('should return false for non-circular references', () => {
      const obj = { name: 'test' }
      
      expect(checker.checkCircular(obj)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(checker.checkCircular(42)).toBe(false)
      expect(checker.checkCircular('string')).toBe(false)
      expect(checker.checkCircular(true)).toBe(false)
      expect(checker.checkCircular(null)).toBe(false)
      expect(checker.checkCircular(undefined)).toBe(false)
    })

    it('should return true for entered objects', () => {
      const obj = { name: 'test' }
      
      checker.enterNode(obj)
      
      expect(checker.checkCircular(obj)).toBe(true)
    })

    it('should return false after exiting node', () => {
      const obj = { name: 'test' }
      
      checker.enterNode(obj)
      expect(checker.checkCircular(obj)).toBe(true)
      
      checker.exitNode(obj)
      expect(checker.checkCircular(obj)).toBe(false)
    })

    it('should handle arrays', () => {
      const arr = [1, 2, 3]
      
      expect(checker.checkCircular(arr)).toBe(false)
      
      checker.enterNode(arr)
      expect(checker.checkCircular(arr)).toBe(true)
      
      checker.exitNode(arr)
      expect(checker.checkCircular(arr)).toBe(false)
    })

    it('should handle multiple different objects', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const obj3 = { id: 3 }
      
      checker.enterNode(obj1)
      checker.enterNode(obj2)
      
      expect(checker.checkCircular(obj1)).toBe(true)
      expect(checker.checkCircular(obj2)).toBe(true)
      expect(checker.checkCircular(obj3)).toBe(false)
    })
  })

  describe('enterNode', () => {
    it('should add object to check map', () => {
      const obj = { name: 'test' }
      
      checker.enterNode(obj)
      
      expect(checker.checkCircular(obj)).toBe(true)
    })

    it('should increment stack pointer', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      
      expect(checker.stack).toBe(0)
      
      checker.enterNode(obj1)
      expect(checker.stack).toBe(1)
      
      checker.enterNode(obj2)
      expect(checker.stack).toBe(2)
    })

    it('should throw error when entering same node twice', () => {
      const obj = { name: 'test' }
      
      checker.enterNode(obj)
      
      expect(() => {
        checker.enterNode(obj)
      }).toThrow('Node already entered')
    })

    it('should handle primitive values gracefully', () => {
      // Primitives are not reference types, so enterNode returns false
      const result1 = checker.enterNode(42)
      const result2 = checker.enterNode('string')
      const result3 = checker.enterNode(true)
      
      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(result3).toBe(false)
    })

    it('should track objects in stack array', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const obj3 = { id: 3 }
      
      checker.enterNode(obj1)
      checker.enterNode(obj2)
      checker.enterNode(obj3)
      
      expect(checker.checkStack[1]).toBe(obj1)
      expect(checker.checkStack[2]).toBe(obj2)
      expect(checker.checkStack[3]).toBe(obj3)
    })
  })

  describe('exitNode', () => {
    it('should remove object from check map', () => {
      const obj = { name: 'test' }
      
      checker.enterNode(obj)
      expect(checker.checkCircular(obj)).toBe(true)
      
      checker.exitNode(obj)
      expect(checker.checkCircular(obj)).toBe(false)
    })

    it('should decrement stack pointer', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      
      checker.enterNode(obj1)
      checker.enterNode(obj2)
      expect(checker.stack).toBe(2)
      
      checker.exitNode(obj2)
      expect(checker.stack).toBe(1)
      
      checker.exitNode(obj1)
      expect(checker.stack).toBe(0)
    })

    it('should throw error when exiting wrong node', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      
      checker.enterNode(obj1)
      checker.enterNode(obj2)
      
      expect(() => {
        checker.exitNode(obj1) // Should exit obj2 first
      }).toThrow('Exit wrong node')
    })

    it('should maintain LIFO order', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const obj3 = { id: 3 }
      
      checker.enterNode(obj1)
      checker.enterNode(obj2)
      checker.enterNode(obj3)
      
      // Must exit in reverse order
      checker.exitNode(obj3)
      checker.exitNode(obj2)
      checker.exitNode(obj1)
      
      expect(checker.stack).toBe(0)
      expect(checker.checkCircular(obj1)).toBe(false)
      expect(checker.checkCircular(obj2)).toBe(false)
      expect(checker.checkCircular(obj3)).toBe(false)
    })
  })

  describe('nested circular references', () => {
    it('should detect circular reference in nested objects', () => {
      const parent: any = { name: 'parent' }
      const child: any = { name: 'child' }
      
      parent.child = child
      child.parent = parent
      
      checker.enterNode(parent)
      expect(checker.checkCircular(child)).toBe(false)
      
      checker.enterNode(child)
      expect(checker.checkCircular(parent)).toBe(true) // Now circular
      
      checker.exitNode(child)
      checker.exitNode(parent)
    })

    it('should handle deep nesting', () => {
      const objs = Array(10).fill(0).map((_, i) => ({ level: i }))
      
      // Enter all objects
      objs.forEach(obj => checker.enterNode(obj))
      
      // All should be marked as circular
      objs.forEach(obj => {
        expect(checker.checkCircular(obj)).toBe(true)
      })
      
      // Exit in reverse order
      for (let i = objs.length - 1; i >= 0; i--) {
        checker.exitNode(objs[i])
      }
      
      // All should be cleared
      objs.forEach(obj => {
        expect(checker.checkCircular(obj)).toBe(false)
      })
    })

    it('should handle complex circular graph', () => {
      const a: any = { name: 'a' }
      const b: any = { name: 'b' }
      const c: any = { name: 'c' }
      
      a.next = b
      b.next = c
      c.next = a // Creates a cycle
      
      checker.enterNode(a)
      expect(checker.checkCircular(b)).toBe(false)
      
      checker.enterNode(b)
      expect(checker.checkCircular(c)).toBe(false)
      
      checker.enterNode(c)
      expect(checker.checkCircular(a)).toBe(true) // Circular!
      
      // Clean up
      checker.exitNode(c)
      checker.exitNode(b)
      checker.exitNode(a)
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const obj = {}
      
      checker.enterNode(obj)
      expect(checker.checkCircular(obj)).toBe(true)
      checker.exitNode(obj)
      expect(checker.checkCircular(obj)).toBe(false)
    })

    it('should handle arrays with circular references', () => {
      const arr: any[] = [1, 2, 3]
      arr.push(arr) // Self-reference
      
      checker.enterNode(arr)
      expect(checker.checkCircular(arr)).toBe(true)
      checker.exitNode(arr)
      expect(checker.checkCircular(arr)).toBe(false)
    })

    it('should distinguish between different objects with same structure', () => {
      const obj1 = { value: 42 }
      const obj2 = { value: 42 }
      
      checker.enterNode(obj1)
      
      expect(checker.checkCircular(obj1)).toBe(true)
      expect(checker.checkCircular(obj2)).toBe(false) // Different object
    })

    it('should handle Date objects', () => {
      const date1 = new Date()
      const date2 = new Date()
      
      checker.enterNode(date1)
      
      expect(checker.checkCircular(date1)).toBe(true)
      expect(checker.checkCircular(date2)).toBe(false)
      
      checker.exitNode(date1)
    })

    it('should handle RegExp objects', () => {
      const regex1 = /test/gi
      const regex2 = /test/gi
      
      checker.enterNode(regex1)
      
      expect(checker.checkCircular(regex1)).toBe(true)
      expect(checker.checkCircular(regex2)).toBe(false)
      
      checker.exitNode(regex1)
    })

    it('should handle Map and Set', () => {
      const map = new Map([['key', 'value']])
      const set = new Set([1, 2, 3])
      
      checker.enterNode(map)
      checker.enterNode(set)
      
      expect(checker.checkCircular(map)).toBe(true)
      expect(checker.checkCircular(set)).toBe(true)
      
      checker.exitNode(set)
      checker.exitNode(map)
    })
  })

  describe('stack capacity', () => {
    it('should handle stack array size of 200', () => {
      // The checkStack is initialized with size 200
      expect(checker.checkStack.length).toBe(200)
    })

    it('should handle deep nesting up to stack limit', () => {
      const objects = Array(100).fill(0).map((_, i) => ({ depth: i }))
      
      // Enter many objects
      objects.forEach(obj => checker.enterNode(obj))
      
      // All should be tracked
      objects.forEach(obj => {
        expect(checker.checkCircular(obj)).toBe(true)
      })
      
      // Exit in reverse order
      for (let i = objects.length - 1; i >= 0; i--) {
        checker.exitNode(objects[i])
      }
      
      expect(checker.stack).toBe(0)
    })
  })

  describe('multiple instances', () => {
    it('should maintain independent state across instances', () => {
      const checker1 = new CircularChecking()
      const checker2 = new CircularChecking()
      
      const obj = { value: 1 }
      
      checker1.enterNode(obj)
      
      expect(checker1.checkCircular(obj)).toBe(true)
      expect(checker2.checkCircular(obj)).toBe(false)
      
      checker1.exitNode(obj)
    })
  })
})
