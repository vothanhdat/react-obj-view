import { WalkingAdaper, walkingFactory } from "../tree-core";
import { isRef } from "../utils/isRef";
import { getEntriesCb } from "../V5/getEntries";
import { ResolverFn } from "../V5/types";
import { LazyValue } from "../V5/LazyValueWrapper";


export type ObjectWalkingMeta = number
export type ObjectWalkingConfig = {
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
}


const objectWalkingAdaper: WalkingAdaper<unknown, PropertyKey, ObjectWalkingMeta, ObjectWalkingConfig> = {
    valueHasChild(value) {
        return isRef(value)
            && !(value instanceof Date)
            && !(value instanceof RegExp)
            && !(value instanceof LazyValue)
    },
    defaultMeta() { return 1 },
    iterateChilds(value, config, ref, cb) {
        getEntriesCb(
            value,
            config as any,
            false,
            ref,
            (key, value, enumerable) => cb(
                value, key,
                enumerable ? 1 : 0,
            )
        )
    },
    valueDefaultExpaned(value, key, meta, config) {
        return (meta & 1) as any
    },
}

export const objectTreeWalking = () => walkingFactory<unknown, PropertyKey, ObjectWalkingMeta, ObjectWalkingConfig>(
    objectWalkingAdaper
)

