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
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(mapResolver(map, next, true, {} as any, map), e => [...e])
      
      expect(entries).toHaveLength(3)
      expect(next).toHaveBeenCalledWith(map)
      
      // Check that CustomEntry instances were created
      expect(entries[0][0]).toBe(0)
      expect(entries[0][1]).toBeInstanceOf(CustomEntry)
      expect(entries[0][2]).toBe(ENUMERABLE_BIT)
    })

    it('should resolve map in normal mode', () => {
      const map = new Map([['a', 1], ['b', 2]])
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(mapResolver(map, next, false, {} as any, map), e => [...e])
      
      expect(entries).toContainEqual(['[[Entries]]', expect.any(CustomIterator), 0])
      expect(entries).toContainEqual(['size', 2, ENUMERABLE_BIT])
      
      expect(next).toHaveBeenCalledWith(map)
    })
  })

  describe('setResolver', () => {
    it('should resolve set in preview mode', () => {
      const set = new Set([1, 2, 3])
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(setResolver(set, next, true, {} as any, set), e => [...e])
      
      expect(entries).toHaveLength(3)
      expect(entries[0]).toEqual([0, 1, ENUMERABLE_BIT])
      expect(entries[1]).toEqual([1, 2, ENUMERABLE_BIT])
      expect(entries[2]).toEqual([2, 3, ENUMERABLE_BIT])
      expect(next).toHaveBeenCalledWith(set)
    })

    it('should resolve set in normal mode', () => {
      const set = new Set([1, 2, 3])
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(setResolver(set, next, false, {} as any, set), e => [...e])
      
      // Should call cb for [[Entries]] and size
      expect(entries).toContainEqual(['[[Entries]]', expect.any(CustomIterator), 0])
      expect(entries).toContainEqual(['size', 3, ENUMERABLE_BIT])
      expect(next).toHaveBeenCalledWith(set)
    })
  })

  describe('iteraterResolver', () => {
    it('should iterate over Map entries', () => {
      const map = new Map([['a', 1], ['b', 2]])
      const iterator = CustomIterator.getIterator(map)
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(iteraterResolver(iterator, next, false, {} as any, iterator), e => [...e])
      
      expect(entries).toHaveLength(2)
      
      expect(entries[0][0]).toBe(0)
      expect(entries[0][1]).toBeInstanceOf(CustomEntry)
      expect(entries[0][2]).toBe(ENUMERABLE_BIT)
    })

    it('should iterate over Set entries', () => {
      const set = new Set([1, 2, 3])
      const iterator = CustomIterator.getIterator(set)
      
      const next = vi.fn(function* () {})
      
      const entries = Array.from(iteraterResolver(iterator, next, false, {} as any, iterator), e => [...e])
      
      expect(entries).toHaveLength(3)
      expect(entries[0]).toEqual([0, 1, ENUMERABLE_BIT])
      expect(entries[1]).toEqual([1, 2, ENUMERABLE_BIT])
      expect(entries[2]).toEqual([2, 3, ENUMERABLE_BIT])
    })
  })
})
