import { walkingToIndexFactory, type WalkingConfig } from "@react-obj-view/tree-core";
import { performanceTestData } from "../exampleData";
import {
    createObjectWalkerAdapter,
    DEFAULT_RESOLVER,
    getObjectWalkerVersionToken,
    type ObjectNodeMeta,
} from "../objectWalker";


const arr = performanceTestData.suppersupperLarge

const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)

const arr3 = arr.filter((e, i) => i % 2 == 0)


const resolver = new Map(DEFAULT_RESOLVER);
const adapter = createObjectWalkerAdapter({
    resolver,
    includeSymbols: false,
    nonEnumerable: true,
});

const config: WalkingConfig = {
    expandDepth: 10,
    versionToken: getObjectWalkerVersionToken({
        resolver,
        includeSymbols: false,
        nonEnumerable: true,
    }),
};


let times = {
    first: [] as number[],
    update: [] as number[],
    half: [] as number[],
    void: [] as number[],
}

console.log(Object.keys(times)
    .join("\t"))

for (let i = 0; i < 10; i++) {

    const walking = walkingToIndexFactory<unknown, PropertyKey, ObjectNodeMeta>(adapter)

    const t1 = performance.now()

    let r1 = walking.walking(
        arr,
        config,
        "root",
        { enumerable: true },
    )

    const t2 = performance.now()
    // console.log("walking time %s ms", t2 - t1)


    walking.walking(
        arr2,
        config,
        "root",
        { enumerable: true }
    )

    const t3 = performance.now()

    walking.walking(
        arr3,
        config,
        "root",
        { enumerable: true }
    )

    const t4 = performance.now()

    walking.walking(
        arr3,
        config,
        "root",
        { enumerable: true }
    )

    const t5 = performance.now()

    // console.log("re-walking time %s ms", t3 - t2)

    times.first.push((t2 - t1) | 0)
    times.update.push((t3 - t2) | 0)
    times.half.push((t4 - t3) | 0)
    times.void.push((t5 - t4) | 0)

    console.log([t2 - t1, t3 - t2, t4 - t3, t5 - t4,]
        .map(e => e | 0)
        .join("\t"))
}


// console.table(times)

console.table({
    first_avg: times.first.reduce((e, f) => e + f, 0) / times.first.length,
    update_avg: times.update.reduce((e, f) => e + f, 0) / times.first.length,
    half_avg: times.half.reduce((e, f) => e + f, 0) / times.first.length,
    void_avg: times.void.reduce((e, f) => e + f, 0) / times.first.length,
})
