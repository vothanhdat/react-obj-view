import { objectTreeWalkingFactory } from "./objectWalkingAdaper";
import { ObjectWalkingConfig } from "./types";
import { allExamples } from "../exampleData";





const a = {
    ff: 1,
    b: [1, 2, 3, { d: "33" }]
};

const test = allExamples.objects.circular

const walkingConfig: ObjectWalkingConfig = {
    nonEnumerable: true,
    symbol: false,
    resolver: undefined
};


console.group("Current:")


const { walking, refreshPath, toggleExpand, getNode } = objectTreeWalkingFactory()

const result = walking(test, 'root', walkingConfig, 10)


for (let i = 0; i < result.childCount; i++) {
    let nodeData = getNode(i)
    console.log(nodeData.paths, (nodeData.state.meta)?.toString(2))
}

console.groupEnd()
