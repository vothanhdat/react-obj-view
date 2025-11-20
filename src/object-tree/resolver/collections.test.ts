import { describe, it, expect, vi } from 'vitest'
import { mapResolver, setResolver, iteraterResolver, CustomIterator, CustomEntry } from './collections'
import { ENUMERABLE_BIT } from '../meta'

describe('collections resolvers', () => {
  describe('CustomIterator', () => {
    it('should create iterator from Map', () => {
      const map = new Map([['a', 1], ['b', 2]])
      const iterator = CustomIterator.getIterator(map)
      
      expect(iterator).toBeInstanceOf(CustomIterator)
      expect(iterator.size).toBe(2)
    })

    it('should create iterator from Set', () => {
      const set = new Set([1, 2, 3])
      const iterator = CustomIterator.getIterator(set)
      
      expect(iterator).toBeInstanceOf(CustomIterator)
      expect(iterator.size).toBe(3)
    })

    it('should cache iterators for same object', () => {
      const map = new Map([['a', 1]])
      const iterator1 = CustomIterator.getIterator(map)
      const iterator2 = CustomIterator.getIterator(map)
      
      expect(iterator1).toBe(iterator2)
    })

    it('should have empty toString', () => {
      const map = new Map([['a', 1]])
      const iterator = CustomIterator.getIterator(map)
      
      expect(iterator.toString()).toBe('')
    })
  })

  describe('CustomEntry', () => {
    it('should create entry with key and value', () => {
      const ref = {}
      const entry = CustomEntry.getEntry(ref, 'key', 'value')
      
      expect(entry).toBeInstanceOf(CustomEntry)
      expect(entry.key).toBe('key')
      expect(entry.value).toBe('value')
    })

    it('should cache entries for same ref and key', () => {
      const ref = {}
      const entry1 = CustomEntry.getEntry(ref, 'key', 'value')
      const entry2 = CustomEntry.getEntry(ref, 'key', 'value')
      
      expect(entry1).toBe(entry2)
    })

    it('should update entry when value changes', () => {
      const ref = {}
      const entry1 = CustomEntry.getEntry(ref, 'key', 'value1')
      const entry2 = CustomEntry.getEntry(ref, 'key', 'value2')
      
      expect(entry2).not.toBe(entry1)
      expect(entry2.value).toBe('value2')
    })

    it('should have empty toString', () => {
      const entry = CustomEntry.getEntry({}, 'key', 'value')
      expect(entry.toString()).toBe('')
    })
  })

  describe('mapResolver', () => {
    it('should resolve map in preview mode', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ])
      
      const cb = vi.fn()
      const next = vi.fn()
      
      mapResolver(map, cb, next, true, {} as any, map)
      
      expect(cb).toHaveBeenCalledTimes(3)
      expect(next).toHaveBeenCalledWith(map)
      
      // Check that CustomEntry instances were created
      const firstCall = cb.mock.calls[0]
      expect(firstCall[0]).toBe(0)
      expect(firstCall[1]).toBeInstanceOf(CustomEntry)
      expect(firstCall[2]).toBe(ENUMERABLE_BIT)
    })

    it('should resolve map in normal mode', () => {
      const map = new Map([['a', 1], ['b', 2]])
      
      const cb = vi.fn()
      const next = vi.fn()
      
      mapResolver(map, cb, next, false, {} as any, map)
      
      // Should call cb for [[Entries]] and size
      expect(cb).toHaveBeenCalledWith('[[Entries]]', expect.any(CustomIterator), 0)
      expect(cb).toHaveBeenCalledWith('size', 2, ENUMERABLE_BIT)
      expect(next).toHaveBeenCalledWith(map)
    })
  })

  describe('setResolver', () => {
    it('should resolve set in preview mode', () => {
      const set = new Set([1, 2, 3])
      
      const cb = vi.fn()
      const next = vi.fn()
      
      setResolver(set, cb, next, true, {} as any, set)
      
      expect(cb).toHaveBeenCalledTimes(3)
      expect(cb).toHaveBeenCalledWith(0, 1, ENUMERABLE_BIT)
      expect(cb).toHaveBeenCalledWith(1, 2, ENUMERABLE_BIT)
      expect(cb).toHaveBeenCalledWith(2, 3, ENUMERABLE_BIT)
      expect(next).toHaveBeenCalledWith(set)
    })

    it('should resolve set in normal mode', () => {
      const set = new Set([1, 2, 3])
      
      const cb = vi.fn()
      const next = vi.fn()
      
      setResolver(set, cb, next, false, {} as any, set)
      
      // Should call cb for [[Entries]] and size
      expect(cb).toHaveBeenCalledWith('[[Entries]]', expect.any(CustomIterator), 0)
      expect(cb).toHaveBeenCalledWith('size', 3, ENUMERABLE_BIT)
      expect(next).toHaveBeenCalledWith(set)
    })
  })

  describe('iteraterResolver', () => {
    it('should iterate over Map entries', () => {
      const map = new Map([['a', 1], ['b', 2]])
      const iterator = CustomIterator.getIterator(map)
      
      const cb = vi.fn().mockReturnValue(false)
      const next = vi.fn()
      
      iteraterResolver(iterator, cb, next, false, {} as any, iterator)
      
      expect(cb).toHaveBeenCalledTimes(2)
      
      const firstCall = cb.mock.calls[0]
      expect(firstCall[0]).toBe(0)
      expect(firstCall[1]).toBeInstanceOf(CustomEntry)
      expect(firstCall[2]).toBe(ENUMERABLE_BIT)
    })

    it('should iterate over Set entries', () => {
      const set = new Set([1, 2, 3])
      const iterator = CustomIterator.getIterator(set)
      
      const cb = vi.fn().mockReturnValue(false)
      const next = vi.fn()
      
      iteraterResolver(iterator, cb, next, false, {} as any, iterator)
      
      expect(cb).toHaveBeenCalledTimes(3)
      expect(cb).toHaveBeenCalledWith(0, 1, ENUMERABLE_BIT)
      expect(cb).toHaveBeenCalledWith(1, 2, ENUMERABLE_BIT)
      expect(cb).toHaveBeenCalledWith(2, 3, ENUMERABLE_BIT)
    })

    it('should stop iteration when cb returns true', () => {
      const set = new Set([1, 2, 3])
      const iterator = CustomIterator.getIterator(set)
      
      const cb = vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      const next = vi.fn()
      
      iteraterResolver(iterator, cb, next, false, {} as any, iterator)
      
      // Should stop after second call
      expect(cb).toHaveBeenCalledTimes(2)
    })
  })
})
