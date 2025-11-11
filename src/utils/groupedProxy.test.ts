import { describe, it, expect } from 'vitest'
import { objectGroupProxyFactory, GroupedProxy, proxyInfo, groupedProxyIsEqual } from './groupedProxy'

describe('groupedProxy', () => {
  describe('objectGroupProxyFactory', () => {
    it('should return original array if size is less than maxSize', () => {
      const factory = objectGroupProxyFactory()
      const arr = [1, 2, 3]
      const result = factory(arr, 10)
      expect(result).toBe(arr)
    })

    it('should return original object if size is less than maxSize', () => {
      const factory = objectGroupProxyFactory()
      const obj = { a: 1, b: 2 }
      const result = factory(obj, 10)
      expect(result).toBe(obj)
    })

    it('should create grouped proxy for large arrays', () => {
      const factory = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      const result = factory(arr, 10)
      expect(result).toBeInstanceOf(GroupedProxy)
      expect(result[proxyInfo]).toBeDefined()
      expect(result[proxyInfo].origin).toBe(arr)
    })

    it('should create grouped proxy for large objects', () => {
      const factory = objectGroupProxyFactory()
      const obj = Object.fromEntries(Array(100).fill(0).map((_, i) => [`key${i}`, i]))
      const result = factory(obj, 10)
      expect(result).toBeInstanceOf(GroupedProxy)
      expect(result[proxyInfo]).toBeDefined()
      expect(result[proxyInfo].origin).toBe(obj)
    })

    it('should handle caching when called multiple times with same value', () => {
      const factory = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      const result1 = factory(arr, 10)
      const result2 = factory(arr, 10)
      // Should use cache
      expect(result1).toBeInstanceOf(GroupedProxy)
      expect(result2).toBeInstanceOf(GroupedProxy)
    })

    it('should clear cache when value changes', () => {
      const factory = objectGroupProxyFactory()
      const arr1 = Array(100).fill(0).map((_, i) => i)
      const arr2 = Array(100).fill(0).map((_, i) => i * 2)
      
      factory(arr1, 10)
      const result = factory(arr2, 10)
      
      expect(result[proxyInfo].origin).toBe(arr2)
    })

    it('should clear cache when maxSize changes', () => {
      const factory = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      
      factory(arr, 10)
      const result = factory(arr, 20)
      
      expect(result[proxyInfo].origin).toBe(arr)
    })
  })

  describe('groupedProxyIsEqual', () => {
    it('should return true for same proxy reference', () => {
      const factory = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      const proxy = factory(arr, 10) as GroupedProxy
      
      expect(groupedProxyIsEqual(proxy, proxy)).toBe(true)
    })

    it('should return true for proxies with same origin', () => {
      const factory1 = objectGroupProxyFactory()
      const factory2 = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      
      const proxy1 = factory1(arr, 10) as GroupedProxy
      const proxy2 = factory2(arr, 10) as GroupedProxy
      
      expect(groupedProxyIsEqual(proxy1, proxy2)).toBe(true)
    })

    it('should return false for proxies with different origins', () => {
      const factory1 = objectGroupProxyFactory()
      const factory2 = objectGroupProxyFactory()
      const arr1 = Array(100).fill(0).map((_, i) => i)
      const arr2 = Array(100).fill(0).map((_, i) => i * 2)
      
      const proxy1 = factory1(arr1, 10) as GroupedProxy
      const proxy2 = factory2(arr2, 10) as GroupedProxy
      
      expect(groupedProxyIsEqual(proxy1, proxy2)).toBe(false)
    })

    it('should handle non-GroupedProxy values', () => {
      const factory = objectGroupProxyFactory()
      const arr = Array(100).fill(0).map((_, i) => i)
      const proxy = factory(arr, 10) as GroupedProxy
      
      expect(groupedProxyIsEqual(proxy, {} as GroupedProxy)).toBe(false)
      expect(groupedProxyIsEqual({} as GroupedProxy, proxy)).toBe(false)
    })

    it('should use loose equality for non-proxy values', () => {
      expect(groupedProxyIsEqual({} as GroupedProxy, {} as GroupedProxy)).toBe(false)
      expect(groupedProxyIsEqual(5 as any, 5 as any)).toBe(true)
      expect(groupedProxyIsEqual('test' as any, 'test' as any)).toBe(true)
    })
  })
})
