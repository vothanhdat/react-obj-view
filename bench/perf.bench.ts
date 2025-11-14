import { bench, describe } from 'vitest'
import { walkingToIndexFactory } from '../src/V5/walkingToIndexFactory'
import { WalkingConfig } from '../src/V5/types'

const generatePayload = (rows: number) => {
  return {
    users: Array.from({ length: rows }, (_, index) => ({
      id: index,
      name: `user-${index}`,
      stats: {
        active: index % 2 === 0,
        score: index * 3,
        history: Array.from({ length: 3 }, (__, offset) => ({
          day: offset,
          delta: index + offset,
        })),
      },
      tags: [`tag-${index % 10}`, `tag-${(index + 1) % 10}`],
    })),
    meta: {
      version: rows,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      flags: {
        preview: true,
        tracing: rows % 2 === 1,
      },
    },
  }
}

const config: WalkingConfig = {
  expandDepth: 5,
  nonEnumerable: false,
  resolver: undefined,
}

describe('walkingToIndexFactory benchmark', () => {
  describe('100,000 nodes', () => {

    const payload100k = generatePayload(10000)
    const payload1M = generatePayload(100000)
    const payload2M = generatePayload(200000)

    bench('flatten ~100k nodes payload', () => {
      const factory = walkingToIndexFactory()
      factory.walking(payload100k, config, 'root', true)
    }, { iterations: 50 })

    bench('flatten ~1m nodes payload', () => {
      const factory = walkingToIndexFactory()
      factory.walking(payload1M, config, 'root', true)
    }, { iterations: 5 })

    bench('flatten ~2m nodes payload', () => {
      const factory = walkingToIndexFactory()
      factory.walking(payload2M, config, 'root', true)
    }, { iterations: 5 })

  })

})
