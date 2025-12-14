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


describe('search', () => {

  for (let [name, payload, iterate] of [
    ["1k nodes", generatePayload(100), 10],
    ["10k nodes", generatePayload(1000), 10],
    ["100k nodes", generatePayload(10000), 2],
    ["~1M nodes", generatePayload(100000), 5],
  ] as [string, any, number][]) {
    describe(name, () => {


      bench('walking Async Full', async () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 5,
          1000000
        )

        for (let state of walkingIterate) {
          await new Promise(r => setTimeout(r, 0))
        }

      }, { iterations: iterate })



      bench('walking Async full and search', async () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 10,
          100000
        )

        const searchIterate = factory.traversalAndFindPaths(
          (value, key, paths) => {
            // console.log(paths)
            if (typeof value === 'string' && value.includes("22222")) {
              console.log("walking Async full and search", paths, ":", value)
            }
          },
          walkingConfig,
          100000,
          10,
          false
        )

        await Promise.all([
          Promise.resolve()
            .then(async () => {
              for (let state of walkingIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
          Promise.resolve()
            .then(async () => {
              for (let _ of searchIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
        ])

      }, { iterations: iterate })



      bench('walking partial and search Async Full', async () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 2,
          100000
        )

        const searchIterate = factory.traversalAndFindPaths(
          (value, key, paths) => {
            // console.log(paths)
            if (typeof value === 'string' && value.includes("22222")) {
              console.log("Walking Async Partial and search", paths, ":", value)
            }
          },
          walkingConfig,
          100000,
          10,
          true
        )

        await Promise.all([
          Promise.resolve()
            .then(async () => {
              for (let state of walkingIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
          Promise.resolve()
            .then(async () => {
              for (let _ of searchIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
        ])

      }, { iterations: iterate })
      bench('walking Full and search Async Full', async () => {
        const walkingConfig: ObjectWalkingConfig = {
          nonEnumerable: true,
          symbol: false,
          resolver: undefined
        };

        const factory = objectTreeWalkingFactory()

        const walkingIterate = factory.walkingAsync(
          payload, 'root', walkingConfig, 10,
          100000
        )

        const searchIterate = factory.traversalAndFindPaths(
          (value, key, paths) => {
            // console.log(paths)
            if (typeof value === 'string' && value.includes("22222")) {
              console.log("Walking Async Partial and search", paths, ":", value)
            }
          },
          walkingConfig,
          100000,
          10,
          true
        )

        await Promise.all([
          Promise.resolve()
            .then(async () => {
              for (let state of walkingIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
          Promise.resolve()
            .then(async () => {
              for (let _ of searchIterate) {
                await new Promise(r => setTimeout(r, 0))
              }
            }),
        ])

      }, { iterations: iterate })

    })
  }


})