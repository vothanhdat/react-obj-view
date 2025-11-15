import { describe, it, expect } from 'vitest'
import { LazyValue, LazyValueError } from './LazyValueWrapper'

describe('LazyValue', () => {
  describe('getInstance', () => {
    it('should create instance for object property', () => {
      const obj = { name: 'John' }
      const lazy = LazyValue.getInstance(obj, 'name')
      
      expect(lazy).toBeInstanceOf(LazyValue)
      expect(lazy.inited).toBe(false)
    })

    it('should cache instances for same object and key', () => {
      const obj = { value: 42 }
      const lazy1 = LazyValue.getInstance(obj, 'value')
      const lazy2 = LazyValue.getInstance(obj, 'value')
      
      expect(lazy1).toBe(lazy2)
    })

    it('should create different instances for different keys', () => {
      const obj = { a: 1, b: 2 }
      const lazyA = LazyValue.getInstance(obj, 'a')
      const lazyB = LazyValue.getInstance(obj, 'b')
      
      expect(lazyA).not.toBe(lazyB)
    })

    it('should create different instances for different objects', () => {
      const obj1 = { value: 1 }
      const obj2 = { value: 2 }
      const lazy1 = LazyValue.getInstance(obj1, 'value')
      const lazy2 = LazyValue.getInstance(obj2, 'value')
      
      expect(lazy1).not.toBe(lazy2)
    })
  })

  describe('init', () => {
    it('should initialize with property value', () => {
      const obj = { name: 'John' }
      const lazy = LazyValue.getInstance(obj, 'name')
      
      lazy.init()
      
      expect(lazy.inited).toBe(true)
      expect(lazy.value).toBe('John')
      expect(lazy.error).toBeUndefined()
    })

    it('should initialize with getter value', () => {
      const obj = {
        _value: 42,
        get computed() {
          return this._value * 2
        }
      }
      const lazy = LazyValue.getInstance(obj, 'computed')
      
      lazy.init()
      
      expect(lazy.inited).toBe(true)
      expect(lazy.value).toBe(84)
      expect(lazy.error).toBeUndefined()
    })

    it('should handle getter errors', () => {
      const obj = Object.defineProperty({}, 'error', {
        get() {
          throw new Error('Getter error')
        }
      })
      const lazy = LazyValue.getInstance(obj, 'error')
      
      lazy.init()
      
      expect(lazy.inited).toBe(true)
      expect(lazy.value).toBeUndefined()
      expect(lazy.error).toBeInstanceOf(LazyValueError)
    })

    it('should only initialize once', () => {
      let callCount = 0
      const obj = Object.defineProperty({}, 'prop', {
        get() {
          callCount++
          return 'value'
        }
      })
      const lazy = LazyValue.getInstance(obj, 'prop')
      
      lazy.init()
      lazy.init()
      lazy.init()
      
      expect(callCount).toBe(1)
      expect(lazy.value).toBe('value')
    })

    it('should handle undefined values', () => {
      const obj = { undef: undefined }
      const lazy = LazyValue.getInstance(obj, 'undef')
      
      lazy.init()
      
      expect(lazy.inited).toBe(true)
      expect(lazy.value).toBeUndefined()
      expect(lazy.error).toBeUndefined()
    })

    it('should handle null values', () => {
      const obj = { nullable: null }
      const lazy = LazyValue.getInstance(obj, 'nullable')
      
      lazy.init()
      
      expect(lazy.inited).toBe(true)
      // Due to the implementation using ??, null is treated as falsy
      // and descriptor.get?.call returns undefined
      expect(lazy.value).toBeUndefined()
      expect(lazy.error).toBeUndefined()
    })
  })

  describe('toString', () => {
    it('should return empty string', () => {
      const obj = { value: 42 }
      const lazy = LazyValue.getInstance(obj, 'value')
      
      expect(lazy.toString()).toBe('')
    })
  })

  describe('static properties', () => {
    it('should have empty name', () => {
      expect(LazyValue.name).toBe('')
    })
  })
})

describe('LazyValueError', () => {
  it('should wrap error in array', () => {
    const error = new Error('test')
    const lazyError = new LazyValueError(error)
    
    expect(lazyError).toBeInstanceOf(Array)
    expect(lazyError.length).toBe(1)
    expect(lazyError[0]).toBe(error)
  })

  it('should have empty toString', () => {
    const error = new Error('test')
    const lazyError = new LazyValueError(error)
    
    expect(lazyError.toString()).toBe('')
  })

  it('should have empty name', () => {
    expect(LazyValueError.name).toBe('')
  })

  it('should wrap any error type', () => {
    const stringError = 'string error'
    const lazyError = new LazyValueError(stringError)
    
    expect(lazyError[0]).toBe(stringError)
  })
})
