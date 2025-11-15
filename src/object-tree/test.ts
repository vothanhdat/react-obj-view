import { objectTreeWalking, ObjectWalkingConfig } from ".";
import { walkingToIndexFactory } from "../V5/walkingToIndexFactory";





const a = {
    ff: 1,
    b: [1, 2, 3, { d: "33" }]
};

const walkingConfig: ObjectWalkingConfig = {
    nonEnumerable: true,
    symbol: false,
    resolver: undefined
};


console.group("Current:")


const { walking, refreshPath, toggleExpand, getNode } = objectTreeWalking()

const result = walking(a, 'root', walkingConfig, 10)


for (let i = 0; i < result.childCount; i++) {
    let nodeData = getNode(i)
    console.log(nodeData.paths)
}

console.groupEnd()
