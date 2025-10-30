import { performanceTestData } from "../exampleData";
import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";


const getEntries = function* (value: any) {
    if (!value)
        return;
    if (value instanceof Array) {
        for (let key = 0; key < value.length; key++) {
            yield { key, value: value[key], enumrable: true }
        }
    } else if (value instanceof Object) {
        for (var key in value) {
            yield { key, value: value[key], enumrable: true }
        }
    }
}

type Ctx = {
    path: string,
    inited: boolean
    object: any,
    start: LinkList<NodeData>,
    end: LinkList<NodeData>,
}
type NodeData = {
    path: any,
    name: any,
    value: any,
    depth: number
}

class LinkList<T> {
    public next: LinkList<T> | undefined

    constructor(
        public obj: T,
    ) { }

    get length() {
        let count = 1;
        let current: LinkList<T> | undefined = this;
        while (current && count < 1000) {
            current = current.next;
            count++;
        }

        return count
    }
}

const getFlattenObj = (
    map = createMemorizeMap((...path) => ({
        inited: false,
        object: undefined,
        path: path.join("."),
    }) as Ctx),
) => {

    const flattenOBject = (
        object: any,
        paths: any[] = ["root"],
        context = map(...paths),
    ): [LinkList<NodeData>, LinkList<NodeData>] => {

        if (context.object !== object) {

            context.start = context.end = new LinkList<NodeData>({
                value: object,
                path: paths.join("/"),
                depth: paths.length,
                name: paths.at(-1),
            })

            context.inited = true
            context.object = object

            let currentLink = context.start;

            if (isRef(object)) {
                for (let { key, value, enumrable } of getEntries(object)) {
                    paths.push(key);

                    const [start, end] = flattenOBject(value, paths)

                    if (!start || !end) {
                        console.log({ value, start, end })
                        throw new Error("Invalid")
                    }

                    paths.pop();
                    currentLink.next = start;
                    currentLink = end;
                }
            }

            currentLink.next = undefined

            context.end = currentLink;


            return [context.start, context.end]
        } else {
            return [context.start, context.end]
        }


    }

    return flattenOBject
}

const flattenLink = <T>([start, end]: [LinkList<T>, LinkList<T>]): T[] => {
    let result: T[] = []
    let current: LinkList<T> | undefined = start
    while (current) {
        result.push(current.obj)
        current = current.next;
        if (current == end) break;
    }
    return result
}

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

// const arr = performanceTestData.supperLarge

// const arr2 = [
//     ...performanceTestData.supperLarge.slice(0, 3000),
//     {
//         ...performanceTestData.supperLarge.at(3000),
//         description: "This is new Description"
//     },
//     ...performanceTestData.supperLarge.slice(3001),
// ]
// const flattenFn2 = getFlattenObj()

// for (let data of [arr, arr2]) {
//     const time = performance.now()
//     const link = flattenFn2(data)
//     const timeLink = performance.now()
//     const nodes = flattenLink(link)
//     const timeFlatten = performance.now()
//     console.log("timeLink", timeLink - time)
//     console.log("timeFlatten", timeFlatten - timeLink)
//     console.log("lng", nodes.length)
// }
