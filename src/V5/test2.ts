import { NodeResult, walkingToIndexFactory } from "./walkingToIndexFactory";
import { performanceTestData } from "../exampleData";



let data1 = {
    a: 1,
    b: 2,
    d: {
        a: 1,
        c: 2,
        zzzzz: 100,
    },
    ee: {}
}

let data2 = {
    d: {
        a: 1,
        c: 2,
    },
}

const config = { expandDepth: 10, nonEnumerable: true, resolver: undefined as any }

const walking = walkingToIndexFactory()

walking.walking(data1, config, "root", true)

walking.walking(data2, config, "root", true)


// const arr = performanceTestData.suppersupperLarge

// const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)



// const config = { expandDepth: 10, nonEnumerable: true, resolver: undefined as any }

// const t1 = performance.now()

// let r1 = walking.walking(
//     arr,
//     config,
//     "root",
//     true,
// )

// const t2 = performance.now()
// console.log("walking time %s ms", t2 - t1)


// let r2 = walking.walking(
//     arr2,
//     config,
//     "root",
//     true
// )

// const t3 = performance.now()
// console.log("re-walking time %s ms", t3 - t2)


// const t4 = performance.now()

// let preGetNodes = new Array(50)
//     .fill(0).map((_, i) => i + (r2.count >> 1))
//     .map((i) => [i, walking.getNode(i, config)]) as [number, NodeResult][]

// const t5 = performance.now()

// console.log("generate nodes %s ms", t5 - t4)
// console.log("-----------------------------")
// const mem = process.memoryUsage();
// console.log("Memory: ", {
//     rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
//     heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
//     heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
//     external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
// });
// console.log("-----------------------------")

// preGetNodes.forEach(([i, e]) => {
//     console.log(
//         ("#" + i).padEnd(6, " "),
//         "  ".repeat(e.depth),
//         e.name,
//         ":",
//         String(e.value)
//     )
// })