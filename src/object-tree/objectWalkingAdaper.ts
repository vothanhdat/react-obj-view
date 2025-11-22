import { walkingFactory } from "../libs/tree-core";
import { LazyValue, LazyValueError } from "./custom-class/LazyValueWrapper";
import { getEntries } from "./getEntries";
import { ObjectWalkingAdater, WalkingMeta } from "./types";
import { CircularChecking } from "./utils/CircularChecking";
import { getObjectUniqueId } from "./utils/getObjectUniqueId";
import { isRef } from "./utils/isRef";
import {
    EMPTY_CHILD_BIT,
    ENUMERABLE_BIT,
    META_DEFAULT_EXPAND,
    META_HASCHILD_COND,
    META_HASCHILD_MASK,
    NON_CIRCULAR_BIT
} from "./meta" with { type: 'macro' };


export const parseWalkingMeta = (e: WalkingMeta) => {
    return {
        enumerable: !!(e & ENUMERABLE_BIT),
        isCircular: !(e & NON_CIRCULAR_BIT),
        emptyChild: !!(e & EMPTY_CHILD_BIT),
    };
};

export const objectWalkingAdaper: ObjectWalkingAdater = {
    transformValue(value, ref) {
        return value instanceof LazyValue && value.inited
            ? value.value ?? value.error
            : value;
    },
    defaultMeta() { return META_DEFAULT_EXPAND },
    defaultContext(ctx) {
        return {
            ...ctx,
            circularChecking: new CircularChecking()
        };
    },
    valueHasChild(value: unknown, key: PropertyKey, meta: WalkingMeta) {
        return isRef(value)
            && (meta & META_HASCHILD_MASK) === META_HASCHILD_COND
            && !(value instanceof Date)
            && !(value instanceof RegExp)
    },
    iterateChilds(value, { config, circularChecking }, ref, cb) {
        circularChecking.enterNode(value);
        for (const entry of getEntries(
            value,
            config as any,
            false,
            ref,
        )) {
            cb(
                entry[1], entry[0],
                entry[2] |
                (circularChecking.checkCircular(entry[1]) ? 0 : NON_CIRCULAR_BIT)
            )
        }
        circularChecking.exitNode(value);
    },
    valueDefaultExpaned(meta, context) {
        return meta === META_DEFAULT_EXPAND;
    },
    getConfigTokenId(config) {
        return getObjectUniqueId(config);
    },
};

export const objectTreeWalkingFactory = () => walkingFactory(objectWalkingAdaper);

export const valueHasChild = objectWalkingAdaper.valueHasChild
