import { performanceTestData } from "../exampleData";
import { linkListToArray } from "./LinkList";
import { NodeData, walkAsLinkList } from "./NodeData";


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

const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)
const flattenFn2 = walkAsLinkList()

for (let data of [arr, arr2]) {
    const time = performance.now()
    const link = flattenFn2(data)
    const timeLink = performance.now()
    const nodes = linkListToArray(link)
    const timeFlatten = performance.now()
    console.log("timeLink", timeLink - time)
    console.log("timeFlatten", timeFlatten - timeLink)
    console.log("lng", nodes.length)
}
