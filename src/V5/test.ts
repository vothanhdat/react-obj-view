import { walkingToIndexFactory } from ".";
import { performanceTestData } from "../exampleData";


const arr = performanceTestData.suppersupperLarge

const arr2 = arr.map((e, i) => i % 5 == 0 ? ({ ...e, }) : e)



const walking = walkingToIndexFactory()


const t1 = performance.now()

walking.walking(
    arr,
    { expandDepth: 10, nonEnumerable: false, resolver: undefined as any },
    "root",
    true,
)

const t2 = performance.now()
console.log("walking time %s ms", t2 - t1)


walking.walking(
    arr2,
    { expandDepth: 10, nonEnumerable: false, resolver: undefined as any },
    "root",
    true
)

const t3 = performance.now()
console.log("re-walking time %s ms", t3 - t2)
