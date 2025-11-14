import { walkingToIndexFactory } from "@react-obj-view/tree-core";
import { performanceTestData } from "../exampleData";
import {
    createObjectWalkerAdapter,
    DEFAULT_RESOLVER,
    getObjectWalkerVersionToken,
    type ObjectNodeMeta,
} from "../objectWalker";


const arr = performanceTestData.supperLarge

const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)


const resolver = new Map(DEFAULT_RESOLVER);
const adapter = createObjectWalkerAdapter({
    resolver,
    includeSymbols: false,
    nonEnumerable: true,
});
const walking = walkingToIndexFactory<unknown, PropertyKey, ObjectNodeMeta>(adapter);

const config = {
    expandDepth: 10,
    versionToken: getObjectWalkerVersionToken({
        resolver,
        includeSymbols: false,
        nonEnumerable: true,
    }),
};

const t1 = performance.now()

let r1 = walking.walking(
    arr,
    config,
    "root",
    { enumerable: true },
)

const t2 = performance.now()
console.log("walking time %s ms", t2 - t1)


let r2 = walking.walking(
    arr2,
    config,
    "root",
    { enumerable: true }
)

const t3 = performance.now()
console.log("re-walking time %s ms", t3 - t2)


const t4 = performance.now()

let preGetNodes = [
    ...new Array(5)
        .fill(0).map((_, i) => i),
    ...new Array(5)
        .fill(0).map((_, i) => i + (r2.count >> 1)),
    ...new Array(5)
        .fill(0).map((_, i) => r2.count - 5 + i),
].map((i) => [i, walking.getNode(i, config).getData()] as [number, any])

const t5 = performance.now()

console.log("generate nodes %s ms", t5 - t4)
console.log("-----------------------------")
const mem = process.memoryUsage();
console.log("Memory: ", {
    rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
});
console.log("-----------------------------")

preGetNodes.forEach(([i, e]) => {
    console.log(
        ("#" + i).padEnd(6, " "),
        "  ".repeat(e.depth),
        e.name,
        ":",
        String(e.value)?.slice(0, 50)
    )
})
