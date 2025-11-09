import { performanceTestData } from "../exampleData";
import { walkingFactoryV4 } from "./walkingV4";


const arr = performanceTestData.suppersupperLarge

const arr2 = arr.map((e, i) => i % 100 == 0 ? ({ ...e, }) : e)

const config = { expandDepth: 10, nonEnumerable: false, resolver: undefined as any }


let times = {
    first: [] as number[],
    update: [] as number[],
    void: [] as number[],
}

for (let i = 0; i < 10; i++) {

    const walking = walkingFactoryV4()

    const t1 = performance.now()

    let r1 = walking.walking(
        arr,
        config,
        "root",
    )

    const t2 = performance.now()
    // console.log("walking time %s ms", t2 - t1)


    let r2 = walking.walking(
        arr2,
        config,
        "root",
    )

    const t3 = performance.now()


    let r3 = walking.walking(
        arr2,
        config,
        "root",
    )
    const t4 = performance.now()

    // console.log("re-walking time %s ms", t3 - t2)

    times.first.push((t2 - t1) | 0)
    times.update.push((t3 - t2) | 0)
    times.void.push((t4 - t3) | 0)
    // times.push({
    //     first: t2 - t1,
    //     update: t3 - t2,
    // })

    gc?.();
    console.log('..')
}


console.table(times)

console.table({
    first_avg: times.first.reduce((e, f) => e + f, 0) / times.first.length,
    update_avg: times.update.reduce((e, f) => e + f, 0) / times.first.length,
    void_avg: times.void.reduce((e, f) => e + f, 0) / times.first.length,
})

