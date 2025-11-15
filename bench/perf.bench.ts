import { bench, describe } from 'vitest'
import { walkingToIndexFactory } from '../src/V5/walkingToIndexFactory'
import { WalkingConfig } from '../src/V5/types'

import { ObjectWalkingConfig, objectTreeWalking } from '../src/object-tree'


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


describe('walking benchmark', () => {

  for (let [name, payload, iterate] of [
    ["100k nodes", generatePayload(10000), 10],
    ["~1M nodes", generatePayload(100000), 2],
    ["~2M nodes", generatePayload(200000), 2],
  ] as [string, any, number][]) {
    describe(name, () => {
      bench('current version', () => {
        const config: WalkingConfig = {
          expandDepth: 5,
          nonEnumerable: true,
          resolver: undefined,
        }
        const factory = walkingToIndexFactory()
        factory.walking(payload, config, 'root', true)
      }, { iterations: iterate })

      bench('generic version', () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalking()
        factory.walking(payload, 'root', walkingConfig, 5)
      }, { iterations: iterate })

    })
  }


})
