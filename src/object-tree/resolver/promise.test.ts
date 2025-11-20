import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promiseResolver, internalPromiseResolver, InternalPromise } from './promise'
import { ENUMERABLE_BIT } from '../meta'

describe('promise resolvers', () => {
  describe('InternalPromise', () => {
    it('should create instance for promise', () => {
      const promise = Promise.resolve(42)
      const internal = InternalPromise.getInstance(promise)
      
      expect(internal).toBeInstanceOf(InternalPromise)
      expect(internal.promise).toBe(promise)
      expect(internal.resolved).toBe(false)
    })

    it('should cache instances for same promise', () => {
      const promise = Promise.resolve(42)
      const internal1 = InternalPromise.getInstance(promise)
      const internal2 = InternalPromise.getInstance(promise)
      
      expect(internal1).toBe(internal2)
    })

    it('should mark as resolved when promise resolves', async () => {
      const promise = Promise.resolve(42)
      const internal = InternalPromise.getInstance(promise)
      
      expect(internal.resolved).toBe(false)
      
      // Wait for promise to resolve
      await promise
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(internal.resolved).toBe(true)
      expect(internal.value).toBe(42)
    })

    it('should handle rejected promises', async () => {
      const error = new Error('test error')
      const promise = Promise.reject(error)
      const internal = InternalPromise.getInstance(promise)
      
      // Wait for promise to reject
      await promise.catch(() => {})
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(internal.resolved).toBe(false)
    })
  })

  describe('promiseResolver', () => {
    it('should add [[status]] and [[result]] in preview mode', async () => {
      const promise = Promise.resolve(42)
      const cb = vi.fn()
      const next = vi.fn()
      
      promiseResolver(promise, cb, next, true, {} as any, promise)
      
      expect(cb).toHaveBeenCalledTimes(2)
      
      // Check [[status]] call
      const statusCall = cb.mock.calls[0]
      expect(statusCall[0]).toBe('[[status]]')
      expect(statusCall[1]).toBeInstanceOf(InternalPromise)
      expect(statusCall[2]).toBe(ENUMERABLE_BIT)
      
      // Check [[result]] call
      const resultCall = cb.mock.calls[1]
      expect(resultCall[0]).toBe('[[result]]')
      expect(resultCall[1]).toBeInstanceOf(InternalPromise)
      expect(resultCall[2]).toBe(ENUMERABLE_BIT)
      
      expect(next).toHaveBeenCalledWith(promise)
    })

    it('should add [[status]] and [[result]] in normal mode', () => {
      const promise = Promise.resolve(42)
      const cb = vi.fn()
      const next = vi.fn()
      
      promiseResolver(promise, cb, next, false, {} as any, promise)
      
      expect(cb).toHaveBeenCalledTimes(2)
      
      const statusCall = cb.mock.calls[0]
      expect(statusCall[0]).toBe('[[status]]')
      expect(statusCall[2]).toBe(0)
      
      const resultCall = cb.mock.calls[1]
      expect(resultCall[0]).toBe('[[result]]')
      expect(resultCall[2]).toBe(0)
      
      expect(next).toHaveBeenCalledWith(promise)
    })
  })

  describe('internalPromiseResolver', () => {
    it('should not call next for unresolved promise', () => {
      const promise = new Promise(() => {}) // Never resolves
      const internal = InternalPromise.getInstance(promise)
      
      const cb = vi.fn()
      const next = vi.fn()
      
      internalPromiseResolver(internal, cb, next, false, {} as any, internal)
      
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with value for resolved promise', async () => {
      const promise = Promise.resolve(42)
      const internal = InternalPromise.getInstance(promise)
      
      // Wait for promise to resolve
      await promise
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const cb = vi.fn()
      const next = vi.fn()
      
      internalPromiseResolver(internal, cb, next, false, {} as any, internal)
      
      expect(next).toHaveBeenCalledWith(42)
    })

    it('should work in preview mode', async () => {
      const promise = Promise.resolve('test')
      const internal = InternalPromise.getInstance(promise)
      
      await promise
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const cb = vi.fn()
      const next = vi.fn()
      
      internalPromiseResolver(internal, cb, next, true, {} as any, internal)
      
      expect(next).toHaveBeenCalledWith('test')
    })
  })
})
