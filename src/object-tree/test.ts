import { objectTreeWalkingFactory } from "./objectWalkingAdapter";
import { ObjectWalkingConfig } from "./types";
import { allExamples } from "../exampleData";
import { count } from "console";





const a = {
    ff: 1,
    b: [
        { d: "33" },
        1,
        2,
        3,
    ]
};

// const test = allExamples.complex.mixedTypes

const walkingConfig: ObjectWalkingConfig = {
    nonEnumerable: true,
    symbol: false,
    resolver: undefined
};




const { walking, walkingAsync, refreshPath, setExpand, getNode } = objectTreeWalkingFactory()

const walkingIterate = walkingAsync(a, 'root', walkingConfig, 10, 1)

console.clear()
console.group("State:")

let iterateCount = 0
for (let state of walkingIterate) {

    // console.group("Iterate Counter: %s", iterateCount)

    // console.log("childKeys", state.childKeys)
    // console.log("childOffsets", state.childOffsets)
    // console.log("childCount", state.childCount)

    let t: Record<string, any> = {}

    for (let i = 0; i < state!.childCount; i++) {
        try {
            let nodeData = getNode(i)
            t[nodeData.paths.join("/")] = {
                finish: nodeData.state.iterateFinish,
                selfStamp: nodeData.state.selfStamp,
            }
        } catch (error) {
            t[`error${i}`] = {
                finish: false,
                selfStamp: undefined,
                error: String(error)
            }
        }
        // t.push({[nodeData.paths.join("/")]:} ])
    }

    console.table(t)

    console.groupEnd()

    if (iterateCount++ >= 100)
        break;
}


console.groupEnd()
