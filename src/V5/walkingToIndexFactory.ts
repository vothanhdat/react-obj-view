import { isRef } from "../utils/isRef";
import { getEntries } from "../V3/getEntries";
import { getPropertyValue, propertyIsEnumerable } from "../ObjectViewV2/utils/createIterator";
import { WalkingConfig } from "../V3/NodeData"
import { CircularChecking } from "../V4/CircularChecking";
import { getObjectUniqueId } from "../V4/getObjectUniqueId";
import { GetStateFn, StateFactory } from "./StateFactory";



export type WalkingResult = {
    value: unknown,
    cumulate?: number[],
    name: PropertyKey,
    keys?: PropertyKey[],
    count: number,
    enumerable: boolean,
    maxDepth: number,
    expandedDepth: number,
    expanded: boolean,
    isCircular: boolean,
    childCanExpand: boolean,
    userExpand?: boolean,
    updateToken?: number,
}

// export type NodeResult = {
//     state: WalkingResult,
//     depth: number,
//     paths: PropertyKey[],
// }

export class NodeResult implements WalkingResult {
    value!: unknown
    cumulate!: number[]
    name!: PropertyKey
    keys!: PropertyKey[]
    count!: number
    enumerable!: boolean
    maxDepth!: number
    expandedDepth!: number
    expanded!: boolean
    isCircular!: boolean
    childCanExpand!: boolean
    userExpand?: boolean
    updateToken?: number

    constructor(
        state: WalkingResult,
        public depth: number,
        public paths: PropertyKey[],
    ) {
        Object.assign(this, state)
    }

    public get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join("/");
    }

}

const reuseKeyBuffer = (buffer: PropertyKey[] | undefined, size: number) => {
    if (buffer) {
        buffer.length = size;
        return buffer;
    }
    return new Array<PropertyKey>(size);
};

const reuseNumberBuffer = (buffer: number[] | undefined, size: number) => {
    if (buffer) {
        buffer.length = size;
        return buffer;
    }
    return new Array<number>(size);
};

export const objectHasChild = (e: unknown) => {
    return isRef(e)
        && !(e instanceof Date)
        && !(e instanceof RegExp)
}


export const walkingToIndexFactory = () => {


    const { stateFactory, getStateOnly } = StateFactory<WalkingResult>(() => ({
        value: undefined,
        count: 0,
        name: "",
        maxDepth: 0,
        expandedDepth: 0,
        enumerable: false,
        childCanExpand: false,
        expanded: false,
        isCircular: false,
    }))

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const cirularChecking = new CircularChecking()

    const getUpdateToken = (config: WalkingConfig) => {
        return (
            (config.nonEnumerable ? 0 : 1)
            | (getObjectUniqueId(config.resolver) << 1)
        )
    }



    const walking = (
        value: unknown,
        config: WalkingConfig,
        name: PropertyKey,
        enumerable: boolean,
        updateToken = getUpdateToken(config),
        depth = 1,
        { state, cleanChild, getChild }: ReturnType<GetStateFn<WalkingResult>> = stateRoot,
    ): WalkingResult => {

        let count = 1;
        let maxDepth = depth
        let hasChild = objectHasChild(value)
        let isCircular = cirularChecking.checkCircular(value)
        let canExpand = hasChild && !isCircular
        let defaultExpanded = enumerable && depth <= config.expandDepth
        let isExpand = canExpand && (state.userExpand ?? defaultExpanded)
        let childCanExpand = canExpand && !isExpand;


        let shoudUpdate = (
            state.value !== value
            || state.expanded != isExpand
            || state.updateToken != updateToken
            || (isExpand
                && state.expandedDepth < config.expandDepth
                && state.childCanExpand
            ) || (isExpand
                && state.maxDepth >= config.expandDepth
                && state.expandedDepth > config.expandDepth
            )
        )


        if (shoudUpdate) {


            let cumulate: number[] | undefined = undefined
            let keys: PropertyKey[] | undefined = undefined

            if (hasChild && isExpand) {

                isCircular || cirularChecking.enterNode(value)

                const resolverForCtor = value && typeof value === "object"
                    ? config.resolver?.get((value as any)?.constructor)
                    : undefined;

                const canUseArrayFastPath = Array.isArray(value)
                    && !(config.resolver?.has(Array));

                const canUsePlainObjectFastPath = !canUseArrayFastPath
                    && resolverForCtor === undefined
                    && typeof value === "object"
                    && value !== null
                    && Object.getPrototypeOf(value) === Object.prototype;

                if (canUseArrayFastPath) {
                    const arrayValue = value as unknown[];
                    const length = arrayValue.length;

                    const keyBuffer = reuseKeyBuffer(state.keys, length);
                    const cumulateBuffer = reuseNumberBuffer(state.cumulate, length + 1);
                    cumulateBuffer[0] = count;

                    for (let index = 0; index < length; index++) {
                        const childValue = arrayValue[index];

                        const result = walking(
                            childValue,
                            config,
                            index,
                            true,
                            updateToken,
                            depth + 1,
                            getChild(index),
                        );

                        count += result.count;
                        if (result.maxDepth > maxDepth) {
                            maxDepth = result.maxDepth;
                        }
                        if (result.childCanExpand) {
                            childCanExpand = true;
                        }
                        keyBuffer[index] = index;
                        cumulateBuffer[index + 1] = count;
                    }

                    keys = keyBuffer;
                    cumulate = cumulateBuffer;
                } else if (canUsePlainObjectFastPath) {
                    const objectValue = value as Record<PropertyKey, unknown>;
                    const includeNonEnumerable = config.nonEnumerable;
                    const stringKeys = includeNonEnumerable
                        ? Object.getOwnPropertyNames(objectValue)
                        : Object.keys(objectValue);
                    const symbolKeys = config.symbol
                        ? Object.getOwnPropertySymbols(objectValue)
                        : undefined;
                    const includePrototype = includeNonEnumerable && objectValue !== Object.prototype;
                    const totalKeys = stringKeys.length
                        + (symbolKeys?.length ?? 0)
                        + (includePrototype ? 1 : 0);

                    const keyBuffer = reuseKeyBuffer(state.keys, totalKeys);
                    const cumulateBuffer = reuseNumberBuffer(state.cumulate, totalKeys + 1);
                    cumulateBuffer[0] = count;

                    let writeIndex = 0;

                    for (let i = 0; i < stringKeys.length; i++, writeIndex++) {
                        const key = stringKeys[i];
                        const enumerable = includeNonEnumerable
                            ? propertyIsEnumerable.call(objectValue, key)
                            : true;

                        let childValue: unknown;
                        if (!includeNonEnumerable || enumerable) {
                            try {
                                childValue = (objectValue as Record<string, unknown>)[key];
                            } catch {
                                childValue = getPropertyValue(objectValue, key);
                            }
                        } else {
                            childValue = getPropertyValue(objectValue, key);
                        }

                        const result = walking(
                            childValue,
                            config,
                            key,
                            enumerable,
                            updateToken,
                            depth + 1,
                            getChild(key),
                        );

                        count += result.count;
                        if (result.maxDepth > maxDepth) {
                            maxDepth = result.maxDepth;
                        }
                        if (result.childCanExpand) {
                            childCanExpand = true;
                        }
                        keyBuffer[writeIndex] = key;
                        cumulateBuffer[writeIndex + 1] = count;
                    }

                    if (symbolKeys) {
                        for (let i = 0; i < symbolKeys.length; i++, writeIndex++) {
                            const symbolKey = symbolKeys[i];
                            const enumerable = propertyIsEnumerable.call(objectValue, symbolKey);

                            let childValue: unknown;
                            if (enumerable) {
                                try {
                                    childValue = (objectValue as Record<symbol, unknown>)[symbolKey];
                                } catch {
                                    childValue = getPropertyValue(objectValue, symbolKey);
                                }
                            } else {
                                childValue = getPropertyValue(objectValue, symbolKey);
                            }

                            const result = walking(
                                childValue,
                                config,
                                symbolKey,
                                enumerable,
                                updateToken,
                                depth + 1,
                                getChild(symbolKey),
                            );

                            count += result.count;
                            if (result.maxDepth > maxDepth) {
                                maxDepth = result.maxDepth;
                            }
                            if (result.childCanExpand) {
                                childCanExpand = true;
                            }
                            keyBuffer[writeIndex] = symbolKey;
                            cumulateBuffer[writeIndex + 1] = count;
                        }
                    }

                    if (includePrototype) {
                        const protoKey = "[[Prototype]]" as const;
                        const protoValue = Object.getPrototypeOf(objectValue);

                        const result = walking(
                            protoValue,
                            config,
                            protoKey,
                            false,
                            updateToken,
                            depth + 1,
                            getChild(protoKey),
                        );

                        count += result.count;
                        if (result.maxDepth > maxDepth) {
                            maxDepth = result.maxDepth;
                        }
                        if (result.childCanExpand) {
                            childCanExpand = true;
                        }
                        keyBuffer[writeIndex] = protoKey;
                        cumulateBuffer[writeIndex + 1] = count;
                    }

                    keys = keyBuffer;
                    cumulate = cumulateBuffer;
                } else {
                    const keyBuffer = reuseKeyBuffer(state.keys, 0);
                    keyBuffer.length = 0;
                    const cumulateBuffer = reuseNumberBuffer(state.cumulate, 0);
                    cumulateBuffer.length = 0;
                    cumulateBuffer.push(count);

                    let entries = getEntries(value, config)

                    for (let entry of entries) {

                        const { key, value, enumerable } = entry

                        const result = walking(
                            value, config, key, enumerable,
                            updateToken,
                            depth + 1,
                            getChild(key),
                        );

                        count += result.count;
                        maxDepth = Math.max(maxDepth, result.maxDepth)
                        childCanExpand ||= result.childCanExpand;
                        keyBuffer.push(key)
                        cumulateBuffer.push(count);

                    }

                    keys = keyBuffer;
                    cumulate = cumulateBuffer;
                }

                isCircular || cirularChecking.exitNode(value)

            }


            state.count = count
            state.cumulate = cumulate
            state.value = value
            state.enumerable = enumerable
            state.maxDepth = maxDepth
            state.childCanExpand = childCanExpand
            state.expanded = isExpand
            state.expandedDepth = config.expandDepth
            state.isCircular = isCircular
            state.name = name;
            state.keys = keys;
            state.updateToken = updateToken;

            cleanChild()

            return state
        } else {
            return state
        }

    }


    const getNode = (
        index: number,
        config: WalkingConfig,
        { state, getChildOnly } = stateRead,
        depth = 1,
        paths: PropertyKey[] = [],
    ): NodeResult => {

        if (index == 0 || depth >= 100) {
            return new NodeResult(state, depth, paths)
        } else {
            if (!state.cumulate || !state.keys) {
                throw new Error("Wrong state")
            }
            const { cumulate, value } = state;

            let start = 0, end = cumulate.length - 1
            let c = 0

            while (start + 1 < end && c++ < 50) {
                let mid = (start + end) >> 1
                if (index >= cumulate[mid]) {
                    start = mid
                } else {
                    end = mid
                }
            }


            // let keyNames = getEntries(value, config).drop(start).next()?.value?.key!

            let keyNames = state.keys[start]

            return getNode(
                index - cumulate[start],
                config,
                getChildOnly(keyNames),
                depth + 1,
                [...paths, keyNames]
            )


        }
    }


    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig,
        currentState = stateRead,
    ) => {

        for (let path of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not inited")
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(path)
        }
        const currentExpand = currentState.state.userExpand
            ?? currentState.state.expanded

        currentState.state.userExpand = !currentExpand
    }

    return {
        walking,
        getNode,
        toggleExpand,
    }
}
