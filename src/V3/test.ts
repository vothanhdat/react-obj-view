import { performanceTestData } from "../exampleData";
import { isRef } from "../utils/isRef";
import { linkListToArray } from "./LinkList";
import { NodeData, walkingFactory } from "./NodeData";


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


// const obj = {
//     e: 100,
//     ee: { ee: { oo: 399, iii: [2123] }, d: 10 },
//     d: [1000, 2, 3, 4, 3, [1, 2, 34]],
//     g: {}
// }

// const obj2 = { ...obj, ee: { ...obj.ee, d: 20, } }
// const obj3 = { ...obj2, d: [123] }

// const flattenFn1 = getFlattenObj()

// // printTree(flattenLink(flattenFn1(obj)))
// // printTree(flattenLink(flattenFn1(obj2)))
// // printTree(flattenLink(flattenFn1(obj3)))

const arr = performanceTestData.supperLarge

const arr2 = arr.map((e, i) => ({ ...e, }))
const flattenFn2 = walkingFactory()
const expandMap = new Map()

console.log("-------------------------------")
for (let data of [arr, arr2]) {
    for (let depth of [6]) {
        console.group("DEPTH", depth)
        const time = performance.now()

        const link = flattenFn2.walking(data, depth)
        const timeLink = performance.now()
        console.log("timeLink", timeLink - time)

        const nodes = linkListToArray(link)
        const timeFlatten = performance.now()
        console.log("timeFlatten", timeFlatten - timeLink)

        console.log("lng", nodes.length)

        console.groupEnd()
        console.log("")
    }
}

// console.log(isRef(Symbol("")))
