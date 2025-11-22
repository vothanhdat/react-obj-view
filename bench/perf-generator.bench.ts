import { bench, describe } from 'vitest'

import { objectTreeWalkingFactory, ObjectWalkingConfig } from '../src/object-tree'


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
    ["10k nodes", generatePayload(1000), 10],
    ["100k nodes", generatePayload(10000), 10],
    ["~1M nodes", generatePayload(100000), 5],
  ] as [string, any, number][]) {
    describe(name, () => {

      bench('walking sync', () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()
        factory.walking(payload, 'root', walkingConfig, 5)
      }, { iterations: iterate })

      bench('walking Async First', () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 5,
          100000
        )

        for (let state of walkingIterate) {
          break;
        }

      }, { iterations: iterate })
      bench('walking Async Full',  () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 5,
          100000
        )

        for (let state of walkingIterate) {
          // await new Promise(r => setTimeout(r,16))
        }

      }, { iterations: iterate })

    })
  }


})
