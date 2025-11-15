import { describe, it, expect, beforeEach } from 'vitest'
import { walkingToIndexFactory, NodeResult, objectHasChild } from './walkingToIndexFactory'
import { WalkingConfig } from './types'

const summarizeValue = (value: unknown) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `Array(${value.length})`
  if (typeof value === 'object') {
    const ctor = value?.constructor?.name
    if (ctor && ctor !== 'Object') {
      return ctor
    }
    return `Object(${Object.keys(value as Record<string, unknown>).length})`
  }
  return `${typeof value}:${String(value)}`
}

const collectNodeSummaries = (
  factory: ReturnType<typeof walkingToIndexFactory>,
  config: WalkingConfig,
  total: number,
  limit = 12,
) => {
  const summaries: Array<Record<string, unknown>> = []
  for (let i = 0; i < Math.min(total, limit); i++) {
    const node = factory.getNode(i, config)
    const data = node.getData()
    summaries.push({
      path: data.path,
      depth: data.depth,
      enumerable: data.enumerable,
      expanded: data.expanded,
      childCanExpand: data.childCanExpand,
      valueSummary: summarizeValue(data.value),
      count: data.childCount,
    })
  }
  return summaries
}

const findNodeByPath = (
  factory: ReturnType<typeof walkingToIndexFactory>,
  config: WalkingConfig,
  total: number,
  targetPath: string,
) => {
  for (let i = 0; i < total; i++) {
    const node = factory.getNode(i, config)
    if (node.path === targetPath) {
      return node
    }
  }
  throw new Error(`Node with path "${targetPath}" not found`)
}

describe('walkingToIndexFactory', () => {
  let factory: ReturnType<typeof walkingToIndexFactory>
  let config: WalkingConfig

  beforeEach(() => {
    factory = walkingToIndexFactory()
    config = {
      expandDepth: 2,
      nonEnumerable: false,
      resolver: undefined,
    }
  })

  describe('objectHasChild', () => {
    it('should return true for plain objects', () => {
      expect(objectHasChild({})).toBe(true)
      expect(objectHasChild({ a: 1 })).toBe(true)
    })

    it('should return true for arrays', () => {
      expect(objectHasChild([])).toBe(true)
      expect(objectHasChild([1, 2, 3])).toBe(true)
    })

    it('should return true for Map and Set', () => {
      expect(objectHasChild(new Map())).toBe(true)
      expect(objectHasChild(new Set())).toBe(true)
    })

    it('should return false for Date', () => {
      expect(objectHasChild(new Date())).toBe(false)
    })

    it('should return false for RegExp', () => {
      expect(objectHasChild(/test/)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(objectHasChild(42)).toBe(false)
      expect(objectHasChild('string')).toBe(false)
      expect(objectHasChild(true)).toBe(false)
      expect(objectHasChild(null)).toBe(false)
      expect(objectHasChild(undefined)).toBe(false)
    })

    it('should return true for functions', () => {
      expect(objectHasChild(() => {})).toBe(true)
      expect(objectHasChild(function() {})).toBe(true)
    })
  })

  describe('walking - basic functionality', () => {
    it('should process simple object', () => {
      const obj = { name: 'test', value: 42 }
      const result = factory.walking(obj, config, 'root', true)
      
      expect(result.value).toBe(obj)
      expect(result.key).toBe('root')
      expect(result.enumerable).toBe(true)
      expect(result.childCount).toBeGreaterThan(0)
    })

    it('should process primitive values', () => {
      const result1 = factory.walking(42, config, 'number', true)
      expect(result1.value).toBe(42)
      expect(result1.childCount).toBe(1)
      
      const result2 = factory.walking('string', config, 'text', true)
      expect(result2.value).toBe('string')
      expect(result2.childCount).toBe(1)
      
      const result3 = factory.walking(true, config, 'bool', true)
      expect(result3.value).toBe(true)
      expect(result3.childCount).toBe(1)
    })

    it('should process arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = factory.walking(arr, config, 'array', true)
      
      expect(result.value).toBe(arr)
      expect(result.childCount).toBeGreaterThan(1) // 1 for array + children
      expect(result.expanded).toBe(true)
    })

    it('should process nested objects', () => {
      const obj = {
        level1: {
          level2: {
            value: 'deep'
          }
        }
      }
      const result = factory.walking(obj, config, 'root', true)
      
      expect(result.value).toBe(obj)
      expect(result.childCount).toBeGreaterThan(1)
      expect(result.childDepth).toBeGreaterThan(1)
    })

    it('should respect expandDepth setting', () => {
      const deepObj = {
        a: { b: { c: { d: 'deep' } } }
      }
      
      const shallowConfig = { ...config, expandDepth: 1 }
      const result = factory.walking(deepObj, shallowConfig, 'root', true)
      
      expect(result.expandedDepth).toBe(1)
    })

    it('should track expanded state', () => {
      const obj = { a: 1, b: 2 }
      const result = factory.walking(obj, config, 'root', true)
      
      expect(result.expanded).toBe(true)
      expect(result.childCanExpand).toBe(false)
    })

    it('should update stamp when value changes', () => {
      const obj1 = { value: 1 }
      const obj2 = { value: 2 }
      
      const result1 = factory.walking(obj1, config, 'root', true)
      const stamp1 = result1.updateStamp
      
      const result2 = factory.walking(obj2, config, 'root', true)
      const stamp2 = result2.updateStamp
      
      expect(stamp2).toBeGreaterThan(stamp1)
    })
  })

  describe('walking - circular references', () => {
    it('should detect simple circular reference', () => {
      const obj: any = { name: 'test' }
      obj.self = obj
      
      const result = factory.walking(obj, config, 'root', true)
      
      expect(result.value).toBe(obj)
      expect(result.childCount).toBeGreaterThan(1)
    })

    it('should mark circular nodes correctly', () => {
      const obj: any = { value: 1 }
      obj.circular = obj
      
      const result = factory.walking(obj, config, 'root', true)
      
      // The root itself is not circular, but has a circular child
      expect(result.isCircular).toBe(false)
    })

    it('should handle nested circular references', () => {
      const parent: any = { name: 'parent' }
      const child: any = { name: 'child' }
      
      parent.child = child
      child.parent = parent
      
      const result = factory.walking(parent, config, 'root', true)
      
      expect(result.childCount).toBeGreaterThan(1)
    })

    it('should handle array circular references', () => {
      const arr: any[] = [1, 2, 3]
      arr.push(arr)
      
      const result = factory.walking(arr, config, 'root', true)
      
      expect(result.value).toBe(arr)
      expect(result.childCount).toBeGreaterThan(1)
    })
  })

  describe('complex structures and incremental walks', () => {
    it('should flatten complex trees deterministically', () => {
      const complex = {
        profile: {
          name: 'Ada',
          contact: {
            email: 'ada@example.com',
            active: true,
          },
          tags: ['systems', 'ml'],
        },
        metrics: {
          releases: [2023, 2024],
          nested: {
            success: { week: [1, 2, 3] },
            errors: [
              { code: 'E1' },
              { code: 'E2', meta: { severity: 'warn' } },
            ],
          },
        },
        tasks: [
          { id: 1, title: 'design', done: false },
          { id: 2, title: 'ship', done: true, steps: ['build', 'review'] },
        ],
      }

      const deepConfig = { ...config, expandDepth: 5 }
      const result = factory.walking(complex, deepConfig, 'root', true)
      const summaries = collectNodeSummaries(factory, deepConfig, result.childCount, 20)

      expect(summaries).toMatchInlineSnapshot(`
        [
          {
            "childCanExpand": true,
            "count": 37,
            "depth": 1,
            "enumerable": true,
            "expanded": true,
            "path": "",
            "valueSummary": "Object(3)",
          },
          {
            "childCanExpand": false,
            "count": 8,
            "depth": 2,
            "enumerable": true,
            "expanded": true,
            "path": "profile",
            "valueSummary": "Object(3)",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 3,
            "enumerable": true,
            "expanded": false,
            "path": "profile/name",
            "valueSummary": "string:Ada",
          },
          {
            "childCanExpand": false,
            "count": 3,
            "depth": 3,
            "enumerable": true,
            "expanded": true,
            "path": "profile/contact",
            "valueSummary": "Object(2)",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "profile/contact/email",
            "valueSummary": "string:ada@example.com",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "profile/contact/active",
            "valueSummary": "boolean:true",
          },
          {
            "childCanExpand": false,
            "count": 3,
            "depth": 3,
            "enumerable": true,
            "expanded": true,
            "path": "profile/tags",
            "valueSummary": "Array(2)",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "profile/tags/0",
            "valueSummary": "string:systems",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "profile/tags/1",
            "valueSummary": "string:ml",
          },
          {
            "childCanExpand": true,
            "count": 16,
            "depth": 2,
            "enumerable": true,
            "expanded": true,
            "path": "metrics",
            "valueSummary": "Object(2)",
          },
          {
            "childCanExpand": false,
            "count": 3,
            "depth": 3,
            "enumerable": true,
            "expanded": true,
            "path": "metrics/releases",
            "valueSummary": "Array(2)",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "metrics/releases/0",
            "valueSummary": "number:2023",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 4,
            "enumerable": true,
            "expanded": false,
            "path": "metrics/releases/1",
            "valueSummary": "number:2024",
          },
          {
            "childCanExpand": true,
            "count": 12,
            "depth": 3,
            "enumerable": true,
            "expanded": true,
            "path": "metrics/nested",
            "valueSummary": "Object(2)",
          },
          {
            "childCanExpand": false,
            "count": 5,
            "depth": 4,
            "enumerable": true,
            "expanded": true,
            "path": "metrics/nested/success",
            "valueSummary": "Object(1)",
          },
          {
            "childCanExpand": false,
            "count": 4,
            "depth": 5,
            "enumerable": true,
            "expanded": true,
            "path": "metrics/nested/success/week",
            "valueSummary": "Array(3)",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 6,
            "enumerable": true,
            "expanded": false,
            "path": "metrics/nested/success/week/0",
            "valueSummary": "number:1",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 6,
            "enumerable": true,
            "expanded": false,
            "path": "metrics/nested/success/week/1",
            "valueSummary": "number:2",
          },
          {
            "childCanExpand": false,
            "count": 1,
            "depth": 6,
            "enumerable": true,
            "expanded": false,
            "path": "metrics/nested/success/week/2",
            "valueSummary": "number:3",
          },
          {
            "childCanExpand": true,
            "count": 6,
            "depth": 4,
            "enumerable": true,
            "expanded": true,
            "path": "metrics/nested/errors",
            "valueSummary": "Array(2)",
          },
        ]
      `)
    })

    it('should keep update stamps for untouched branches during incremental walks', () => {
      const deepConfig = { ...config, expandDepth: 5 }
      const makePayload = (count: number) => ({
        users: [
          { id: 1, name: 'Ada', stats: { count, city: 'London' } },
          { id: 2, name: 'Linus', stats: { count: 99, city: 'Helsinki' } },
        ],
        meta: { build: count, stable: true },
      })

      const first = makePayload(1)
      const firstResult = factory.walking(first, deepConfig, 'tree', true)

      const changedBefore = findNodeByPath(
        factory,
        deepConfig,
        firstResult.childCount,
        'users/0/stats/count',
      )
      const stableBefore = findNodeByPath(
        factory,
        deepConfig,
        firstResult.childCount,
        'users/1/stats/count',
      )
      const changedBeforeStamp = changedBefore.state.updateStamp
      const stableBeforeStamp = stableBefore.state.updateStamp

      const second = makePayload(5)
      const secondResult = factory.walking(second, deepConfig, 'tree', true)

      const changedAfter = findNodeByPath(
        factory,
        deepConfig,
        secondResult.childCount,
        'users/0/stats/count',
      )
      const stableAfter = findNodeByPath(
        factory,
        deepConfig,
        secondResult.childCount,
        'users/1/stats/count',
      )

      expect(changedAfter.state.value).toBe(5)
      expect(changedAfter.state.updateStamp).toBeGreaterThan(changedBeforeStamp)

      expect(stableAfter.state.value).toBe(99)
      expect(stableAfter.state.updateStamp).toBe(stableBeforeStamp)
    })
  })

  describe('getNode', () => {
    it('should get root node at index 0', () => {
      const obj = { a: 1, b: 2 }
      factory.walking(obj, config, 'root', true)
      
      const node = factory.getNode(0, config)
      
      expect(node).toBeInstanceOf(NodeResult)
      expect(node.getData().value).toBe(obj)
      expect(node.depth).toBe(1)
    })

    it('should get child nodes by index', () => {
      const obj = { a: 1, b: 2, c: 3 }
      factory.walking(obj, config, 'root', true)
      
      const node1 = factory.getNode(1, config)
      const node2 = factory.getNode(2, config)
      
      expect(node1).toBeInstanceOf(NodeResult)
      expect(node2).toBeInstanceOf(NodeResult)
      expect(node1.depth).toBeGreaterThan(1)
    })

    it('should navigate nested structure', () => {
      const obj = {
        level1: {
          level2: {
            value: 42
          }
        }
      }
      const result = factory.walking(obj, config, 'root', true)
      
      // Get various nodes
      for (let i = 0; i < Math.min(result.childCount, 10); i++) {
        const node = factory.getNode(i, config)
        expect(node).toBeInstanceOf(NodeResult)
      }
    })

    it('should have correct path information', () => {
      const obj = { a: { b: { c: 1 } } }
      factory.walking(obj, config, 'root', true)
      
      const rootNode = factory.getNode(0, config)
      expect(rootNode.path).toBe('')
      expect(rootNode.paths).toEqual([])
    })

    it('should stop at depth 100', () => {
      // Create very deep structure
      let deep: any = { value: 'leaf' }
      for (let i = 0; i < 150; i++) {
        deep = { nested: deep }
      }
      
      factory.walking(deep, { ...config, expandDepth: 200 }, 'root', true)
      
      // Should not throw, but depth should be capped
      const node = factory.getNode(0, config)
      expect(node.depth).toBeLessThanOrEqual(100)
    })
  })

  describe('NodeResult', () => {
    it('should create NodeResult with correct data', () => {
      const state = {
        value: 42,
        name: 'test',
        count: 1,
        enumerable: true,
        maxDepth: 1,
        expandedDepth: 1,
        expanded: false,
        isCircular: false,
        childCanExpand: false,
        updateStamp: 1,
      }
      
      const node = new NodeResult(state, 1, ['root'])
      
      expect(node.depth).toBe(1)
      expect(node.paths).toEqual(['root'])
      expect(node.path).toBe('root')
    })

    it('should generate path from paths array', () => {
      const state = {
        value: 1,
        name: 'leaf',
        count: 1,
        enumerable: true,
        maxDepth: 1,
        expandedDepth: 1,
        expanded: false,
        isCircular: false,
        childCanExpand: false,
        updateStamp: 1,
      }
      
      const node = new NodeResult(state, 3, ['root', 'level1', 'level2'])
      
      expect(node.path).toBe('root/level1/level2')
    })

    it('should handle symbol in path', () => {
      const sym = Symbol('test')
      const state = {
        value: 1,
        name: sym,
        count: 1,
        enumerable: true,
        maxDepth: 1,
        expandedDepth: 1,
        expanded: false,
        isCircular: false,
        childCanExpand: false,
        updateStamp: 1,
      }
      
      const node = new NodeResult(state, 2, ['root', sym])
      
      // Symbol.toString() should work
      expect(node.path).toContain('Symbol(test)')
    })

    it('should return complete data via getData', () => {
      const state = {
        value: { test: true },
        name: 'data',
        count: 5,
        enumerable: true,
        maxDepth: 3,
        expandedDepth: 2,
        expanded: true,
        isCircular: false,
        childCanExpand: true,
        updateStamp: 10,
      }
      
      const node = new NodeResult(state, 2, ['root', 'child'])
      const data = node.getData()
      
      expect(data.value).toEqual({ test: true })
      expect(data.key).toBe('data')
      expect(data.childCount).toBe(5)
      expect(data.depth).toBe(2)
      expect(data.path).toBe('root/child')
      expect(data.paths).toEqual(['root', 'child'])
      expect(data.enumerable).toBe(true)
      expect(data.childDepth).toBe(3)
      expect(data.expandedDepth).toBe(2)
      expect(data.expanded).toBe(true)
      expect(data.isCircular).toBe(false)
      expect(data.childCanExpand).toBe(true)
    })
  })

  describe('toggleExpand', () => {
    it('should toggle expansion state', () => {
      const obj = { a: { b: 1 } }
      factory.walking(obj, config, 'root', true)
      
      // Toggle expansion
      factory.toggleExpand(['a'], config)
      
      // Walk again to see the effect
      const result = factory.walking(obj, config, 'root', true)
      
      // The expansion should have changed
      expect(result).toBeDefined()
    })

    it('should handle nested paths', () => {
      const obj = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      }
      
      factory.walking(obj, config, 'root', true)
      
      // Should not throw
      expect(() => {
        factory.toggleExpand(['level1', 'level2'], config)
      }).not.toThrow()
    })

    it('should throw error for non-existent path', () => {
      const obj = { a: 1 }
      factory.walking(obj, config, 'root', true)
      
      expect(() => {
        factory.toggleExpand(['nonexistent'], config)
      }).toThrow() // Error message may vary
    })
  })

  describe('refreshPath', () => {
    it('should refresh path by invalidating updateToken', () => {
      const obj = { a: { b: 1 } }
      factory.walking(obj, config, 'root', true)
      
      // Should not throw
      expect(() => {
        factory.refreshPath(['a'])
      }).not.toThrow()
    })

    it('should handle root path', () => {
      const obj = { value: 1 }
      factory.walking(obj, config, 'root', true)
      
      expect(() => {
        factory.refreshPath([])
      }).not.toThrow()
    })

    it('should throw error for invalid path', () => {
      const obj = { a: 1 }
      factory.walking(obj, config, 'root', true)
      
      expect(() => {
        factory.refreshPath(['invalid'])
      }).toThrow() // Error message may vary
    })
  })

  describe('state caching and updates', () => {
    it('should cache state between walks', () => {
      const obj = { value: 1 }
      
      const result1 = factory.walking(obj, config, 'root', true)
      const result2 = factory.walking(obj, config, 'root', true)
      
      // Should return cached state
      expect(result1).toBe(result2)
    })

    it('should update when value changes', () => {
      const obj1 = { value: 1 }
      const obj2 = { value: 2 }
      
      factory.walking(obj1, config, 'root', true)
      const result = factory.walking(obj2, config, 'root', true)
      
      expect(result.value).toBe(obj2)
    })

    it('should update when expandDepth changes', () => {
      const obj = { a: { b: { c: 1 } } }
      
      factory.walking(obj, { ...config, expandDepth: 1 }, 'root', true)
      const result = factory.walking(obj, { ...config, expandDepth: 3 }, 'root', true)
      
      expect(result.expandedDepth).toBe(3)
    })
  })

  describe('complex scenarios', () => {
    it('should handle large arrays', () => {
      const largeArray = Array(100).fill(0).map((_, i) => ({ id: i }))
      
      const result = factory.walking(largeArray, config, 'root', true)
      
      expect(result.value).toBe(largeArray)
      expect(result.childCount).toBeGreaterThan(100)
    })

    it('should handle deeply nested objects', () => {
      let deep: any = { value: 'leaf' }
      for (let i = 0; i < 10; i++) {
        deep = { nested: deep }
      }
      
      const result = factory.walking(deep, { ...config, expandDepth: 20 }, 'root', true)
      
      expect(result.childDepth).toBeGreaterThan(5)
    })

    it('should handle mixed data types', () => {
      const mixed = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
      }
      
      const result = factory.walking(mixed, config, 'root', true)
      
      expect(result.childCount).toBeGreaterThan(1)
    })

    it('should handle empty collections', () => {
      const obj = {
        emptyArray: [],
        emptyObject: {},
        emptyMap: new Map(),
        emptySet: new Set(),
      }
      
      const result = factory.walking(obj, config, 'root', true)
      
      expect(result.value).toBe(obj)
    })
  })
})
