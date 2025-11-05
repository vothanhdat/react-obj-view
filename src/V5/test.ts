import { walkingToIndexFactory } from ".";
import { performanceTestData } from "../exampleData";


const arr = performanceTestData.suppersupperLarge

const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)


const walking = walkingToIndexFactory()

const config = { expandDepth: 10, nonEnumerable: false, resolver: undefined as any }

const t1 = performance.now()

let r1 = walking.walking(
    arr,
    config,
    "root",
    true,
)

const t2 = performance.now()
console.log("walking time %s ms", t2 - t1)


let r2 = walking.walking(
    arr2,
    config,
    "root",
    true
)

const t3 = performance.now()
console.log("re-walking time %s ms", t3 - t2)

// console.table([r1, r2], ["count", "maxDepth", "updateToken"])

const t4 = performance.now()

let preGetNodes = new Array(40)
    .fill(0).map((_, i) => i + (r2.count >> 1))
    .map((i) => [i, walking.getNode(i, config)])

const t5 = performance.now()

console.log("generate nodes %s ms", t5 - t4)
console.log("-----------------------------")

preGetNodes.forEach(([i, e]) => {
    console.log(
        ("#" + i).padEnd(6, " "),
        "  ".repeat(e.depth),
        e.name,
        ":",
        String(e.value)
    )
})