import { performanceTestData } from "../exampleData";
import { walkingFactoryV4 } from "../V4/walkingV4";
import { linkListToArray } from "./LinkedNode";
import { NodeData } from "./NodeData";


const printTree = (nodes: NodeData[]) => {
    console.log("\nTREE ----------------------------")

    for (let e of nodes) {
        console.log(
            "  ".repeat(e.depth),
            e.name,
            ":",
            String(e.value)
        )
    }

    console.log("")

}


const obj = {
    e: 100,
    ee: { ee: { oo: 399, iii: [2123, { z: 1000 }] }, d: 10 },
    d: [1000, 2, 3, 4, 3, [1, 2, 34]],
    g: { a: 2 }
}

const obj2 = { ...obj, ee: { ...obj.ee, d: 20, } }
const obj3 = { ...obj2, d: [123] }


console.log("-------------------------------")

const arr = performanceTestData.suppersupperLarge

const arr2 = arr.map((e, i) => i % 5 == 0 ? ({ ...e, }) : e)

const flattenFn2 = walkingFactoryV4()

console.log("-------------------------------")
for (let data of [obj]) {
    // for (let data of [arr]) {
    for (let depth of [0, 1, 2, 3, 2, 1, 0]) {
        console.group("DEPTH", depth)
        const time = performance.now()

        const link = flattenFn2.walking(data, { expandDepth: depth, nonEnumerable: false, resolver: undefined })
        const timeLink = performance.now()
        console.log("timeLink", timeLink - time)

        const nodes = linkListToArray(link)
        const timeFlatten = performance.now()
        console.log("timeFlatten", timeFlatten - timeLink)

        console.log("lng", nodes.length)
        console.table(nodes.map(e => ({ path: e.paths.join("/"), value: String(e.value) })))

        console.groupEnd()
        console.log("")
    }
}

// console.log(isRef(Symbol("")))
