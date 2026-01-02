import { walkingFactory } from "../libs/tree-core";
import { LazyValue, LazyValueError } from "./custom-class/LazyValueWrapper";
import { getEntriesCb } from "./getEntries";
import { ObjectWalkingAdapter, WalkingMeta, ObjectWalkingContext } from "./types";
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

export const objectWalkingAdapter: ObjectWalkingAdapter = {
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
    valueHasChild(value: unknown, meta: WalkingMeta, ctx: ObjectWalkingContext) {
        return (ctx.config.nonEnumerable ? isRef(value) : (value !== null && typeof value  === 'object'))
            && (meta & META_HASCHILD_MASK) === META_HASCHILD_COND
            && !(value instanceof Date)
            && !(value instanceof RegExp)
    },
    iterateChilds(value, { config, circularChecking }: ObjectWalkingContext, ref, cb) {
        circularChecking.enterNode(value);
        getEntriesCb(
            value,
            config as any,
            false,
            ref,
            (key, value, meta) => cb(
                value, key,
                meta |
                (circularChecking.checkCircular(value) ? 0 : NON_CIRCULAR_BIT)
            )
        );
        circularChecking.exitNode(value);
    },
    valueDefaultExpaned(meta, context) {
        return meta === META_DEFAULT_EXPAND;
    },
    getConfigTokenId(config) {
        return getObjectUniqueId(config);
    },
};

export const objectTreeWalkingFactory = () => walkingFactory(objectWalkingAdapter);

export const valueHasChild = objectWalkingAdapter.valueHasChild
