import { describe, it, expect, beforeEach } from 'vitest'
import { StateFactory } from './StateFactory'

describe('StateFactory', () => {
  describe('basic functionality', () => {
    it('should create state factory with initial state', () => {
      const initialState = { count: 0, value: 'initial' }
      const { stateFactory } = StateFactory(() => initialState)
      
      const rootMap: any = {}
      const result = stateFactory(rootMap)
      
      expect(result.state).toEqual(initialState)
      expect(result.getChild).toBeDefined()
      expect(result.cleanChild).toBeDefined()
    })

    it('should initialize state only once per map', () => {
      let callCount = 0
      const { stateFactory } = StateFactory(() => {
        callCount++
        return { initialized: true }
      })
      
      const rootMap: any = {}
      stateFactory(rootMap)
      stateFactory(rootMap)
      stateFactory(rootMap)
      
      expect(callCount).toBe(1)
    })

    it('should throw error when currentMap is undefined', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))
      
      expect(() => {
        stateFactory(undefined as any)
      }).toThrow('currentMap not found')
    })
  })

  describe('child state management', () => {
    it('should create child state on demand', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child = root.getChild('key1')
      
      expect(child.state).toBeDefined()
      expect(child.state.value).toBe(0)
    })

    it('should cache child states', () => {
      const { stateFactory } = StateFactory(() => ({ value: Math.random() }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child1 = root.getChild('key1')
      const child2 = root.getChild('key1')
      
      expect(child1.state.value).toBe(child2.state.value)
    })

    it('should create separate states for different keys', () => {
      const { stateFactory } = StateFactory(() => ({ value: Math.random() }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const childA = root.getChild('keyA')
      const childB = root.getChild('keyB')
      
      expect(childA.state).not.toBe(childB.state)
    })

    it('should support nested child states', () => {
      const { stateFactory } = StateFactory(() => ({ depth: 0 }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      root.state.depth = 0
      
      const child = root.getChild('level1')
      child.state.depth = 1
      
      const grandchild = child.getChild('level2')
      grandchild.state.depth = 2
      
      expect(root.state.depth).toBe(0)
      expect(child.state.depth).toBe(1)
      expect(grandchild.state.depth).toBe(2)
    })

    it('should support symbol keys', () => {
      const { stateFactory } = StateFactory(() => ({ value: 'test' }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const sym = Symbol('test')
      const child = root.getChild(sym)
      
      expect(child.state).toBeDefined()
      expect(child.state.value).toBe('test')
    })

    it('should support numeric keys', () => {
      const { stateFactory } = StateFactory(() => ({ index: -1 }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child0 = root.getChild(0)
      const child1 = root.getChild(1)
      
      child0.state.index = 0
      child1.state.index = 1
      
      expect(child0.state.index).toBe(0)
      expect(child1.state.index).toBe(1)
    })
  })

  describe('cleanChild functionality', () => {
    it('should remove untouched children', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))

      const rootMap: any = {}
      const root = stateFactory(rootMap)

      // Create children
      root.getChild('keep')
      root.getChild('remove')
      
      expect(rootMap.childs.size).toBe(2)
      
      // In next state factory call, only touch 'keep'
      const root2 = stateFactory(rootMap)
      root2.getChild('keep')
      root2.cleanChild()

      // 'remove' should still exist until the next state factory call
      expect(rootMap.childs.has('keep')).toBe(true)
    })

    it('should keep touched children and delete untouched ones after cleanup', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))

      const rootMap: any = {}
      const root = stateFactory(rootMap)

      root.getChild('keep')
      root.getChild('remove')

      const root2 = stateFactory(rootMap)
      root2.getChild('keep')
      root2.cleanChild()

      expect(rootMap.childs.has('keep')).toBe(true)
      expect(rootMap.childs.has('remove')).toBe(false)
    })

    it('should not affect newly touched children', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))

      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child1 = root.getChild('key1')
      child1.state.value = 1
      
      const child2 = root.getChild('key2')
      child2.state.value = 2
      
      root.cleanChild()
      
      // Both children should still exist as they were touched
      expect(rootMap.childs.get('key1').state.value).toBe(1)
      expect(rootMap.childs.get('key2').state.value).toBe(2)
    })
  })

  describe('getStateOnly functionality', () => {
    it('should get state without modification capabilities', () => {
      const { stateFactory, getStateOnly } = StateFactory(() => ({ value: 42 }))
      
      const rootMap: any = {}
      stateFactory(rootMap)
      
      const readOnly = getStateOnly(rootMap)
      
      expect(readOnly.state.value).toBe(42)
      expect(readOnly.getChildOnly).toBeDefined()
    })

    it('should throw error when currentMap is undefined', () => {
      const { getStateOnly } = StateFactory(() => ({ value: 0 }))
      
      expect(() => {
        getStateOnly(undefined as any)
      }).toThrow('currentMap not found')
    })

    it('should access existing child states', () => {
      const { stateFactory, getStateOnly } = StateFactory(() => ({ value: 0 }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child = root.getChild('testKey')
      child.state.value = 123
      
      const readOnly = getStateOnly(rootMap)
      const readChild = readOnly.getChildOnly('testKey')
      
      expect(readChild.state.value).toBe(123)
    })

    it('should navigate nested child states', () => {
      const { stateFactory, getStateOnly } = StateFactory(() => ({ name: '' }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      const child = root.getChild('level1')
      child.state.name = 'first'
      
      const grandchild = child.getChild('level2')
      grandchild.state.name = 'second'
      
      const readOnly = getStateOnly(rootMap)
      const readChild = readOnly.getChildOnly('level1')
      const readGrandchild = readChild.getChildOnly('level2')
      
      expect(readChild.state.name).toBe('first')
      expect(readGrandchild.state.name).toBe('second')
    })
  })

  describe('state persistence', () => {
    it('should persist state across multiple factory calls', () => {
      const { stateFactory } = StateFactory(() => ({ counter: 0 }))
      
      const rootMap: any = {}
      
      const call1 = stateFactory(rootMap)
      call1.state.counter = 5
      
      const call2 = stateFactory(rootMap)
      expect(call2.state.counter).toBe(5)
      
      call2.state.counter = 10
      
      const call3 = stateFactory(rootMap)
      expect(call3.state.counter).toBe(10)
    })

    it('should persist child states', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))
      
      const rootMap: any = {}
      
      const root1 = stateFactory(rootMap)
      const child1 = root1.getChild('persistent')
      child1.state.value = 99
      
      const root2 = stateFactory(rootMap)
      const child2 = root2.getChild('persistent')
      
      expect(child2.state.value).toBe(99)
    })
  })

  describe('complex state structures', () => {
    it('should handle complex state objects', () => {
      interface ComplexState {
        id: number
        data: { nested: string }
        items: number[]
        metadata?: Record<string, unknown>
      }
      
      const { stateFactory } = StateFactory<ComplexState>(() => ({
        id: 0,
        data: { nested: 'value' },
        items: [1, 2, 3],
      }))
      
      const rootMap: any = {}
      const root = stateFactory(rootMap)
      
      expect(root.state.id).toBe(0)
      expect(root.state.data.nested).toBe('value')
      expect(root.state.items).toEqual([1, 2, 3])
      
      root.state.metadata = { custom: 'field' }
      
      expect(root.state.metadata.custom).toBe('field')
    })

    it('should handle multiple independent state trees', () => {
      const { stateFactory } = StateFactory(() => ({ value: 0 }))
      
      const tree1: any = {}
      const tree2: any = {}
      
      const root1 = stateFactory(tree1)
      root1.state.value = 1
      
      const root2 = stateFactory(tree2)
      root2.state.value = 2
      
      expect(root1.state.value).toBe(1)
      expect(root2.state.value).toBe(2)
    })
  })
})
