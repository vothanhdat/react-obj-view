import { hidePrototype } from "../getEntries";
import { EMPTY_CHILD_BIT, ENUMERABLE_BIT } from "../meta";
import { ResolverFn } from "../types";

type DataViewLike = {
    getUint8(e: number): number,
    byteLength: number
    byteOffset: number
}

type TypedArrayLike = {
    BYTES_PER_ELEMENT: number,
    length: number,
    byteLength: number,
    byteOffset: number,
    at(index: number): number,
    [Symbol.toStringTag]: string
}

export class ItemViewBase {
    render() {
        return ""
    }
}

export class BufferItemView extends ItemViewBase {
    constructor(
        public value: DataViewLike,
        public from: number,
        public to: number,
    ) {
        super()
    }

    render() {
        if (this.value) {
            let from = Math.min(this.from, this.value.byteLength - 1)
            let to = Math.min(this.to, this.value.byteLength - 1)
            return new Array(to - from)
                .fill(0)
                .map((_, index) => from + index)
                .map(offset => ' ' + this.value.getUint8(offset).toString(16).padStart(2, "0"))
                .join(" ")
        }
        return ""
    }

}


export class TypedArrayItemView extends ItemViewBase {

    static formatFn: Record<string, (e: number) => string> = {

        Int8Array: (e) => String(e),
        Uint8Array: (e) => e.toString().padStart(3, " "),
        Uint8ClampedArray: (e) => String(e),

        Int16Array: (e) => e.toString().padStart(5, " "),
        Uint16Array: (e) => e.toString().padStart(5, " "),

        Int32Array: (e) => e.toString().padStart(10, " "),
        Uint32Array: (e) => e.toString().padStart(10, " "),

        BigInt64Array: (e) => String(e),
        BigUint64Array: (e) => String(e),

        Float32Array: (e) => (e >= 0 ? " " : "") + e.toExponential(4),
        Float64Array: (e) => (e >= 0 ? " " : "") + e.toExponential(4),

        default: (e) => String(e),
    }

    constructor(
        public value: TypedArrayLike,
        public format: (e: number) => string,
        public from: number,
        public to: number,
    ) {
        super()
    }


    render() {
        if (this.value) {
            let from = Math.min(this.from, this.value.length - 1)
            let to = Math.min(this.to, this.value.length - 1)
            let format = this.format
            return new Array(to - from)
                .fill(0)
                .map((_, index) => from + index)
                .map(offset => format(this.value.at(offset)))
                .join(" ")
        }
        return ""

    }

}


export class WrappedBufferView implements DataViewLike {
    [hidePrototype] = true
    static #cache = new WeakMap();

    static getInstance(e: ArrayBuffer) {
        if (!this.#cache.has(e)) {
            this.#cache.set(e, new WrappedBufferView(e));
        }
        return this.#cache.get(e);
    }


    static name = ""
    toString() { return "" }

    private constructor(
        public buff: ArrayBuffer,
        public data = new DataView(buff),
    ) { }

    getUint8(e: number): number {
        return this.data.getUint8(e);
    }

    get byteLength() {
        return this.data.byteLength;
    }

    get byteOffset() {
        return 0
    }



}


export const dataViewLikeResolver: ResolverFn<DataViewLike> = (
    value,
    cb,
    next,
    isPreview,
    config,
    stableRef
) => {
    if (isPreview) {
        if (value instanceof DataView) {
            cb("byteOffset", value.byteOffset, ENUMERABLE_BIT)
            cb("byteLength", value.byteLength, ENUMERABLE_BIT)
        }
    } else {
        if (value instanceof DataView || value instanceof WrappedBufferView) {
            let addrPaddStart = value.byteLength.toString(16).length
            let current = 0;
            while (current < value.byteLength) {
                let next = Math.min(current + 8, value.byteLength)
                if (cb(
                    '0x' + current.toString(16).padStart(addrPaddStart, '0'),
                    new BufferItemView(value, current, next),
                    EMPTY_CHILD_BIT,
                )) return;
                current = next;
            }
        } else {
            next(value)
        }
    }

}

export const bufferResolver: ResolverFn<ArrayBuffer> = (
    value,
    cb,
    next,
    isPreview,
    config,
    stableRef
) => {
    if (isPreview) {
        cb("byteLength", value.byteLength, ENUMERABLE_BIT)
    } else {
        cb("byteLength", value.byteLength, 0)
        cb("[[buffer]]", WrappedBufferView.getInstance(value), 0)
        next(value)
    }
}


// const TypeArrayBaseConstructor = Object.getPrototypeOf(new Uint8Array()).constructor;

export const typeArrayLikeResolver: ResolverFn<TypedArrayLike> = (
    value: TypedArrayLike,
    cb,
    next,
    isPreview,
    config,
    stableRef
) => {
    if (isPreview) {
        // if (value instanceof DataView) {
        //     cb("byteOffset", value.byteOffset, ENUMERABLE_BIT)
        //     cb("byteLength", value.byteLength, ENUMERABLE_BIT)
        // }
    } else {
        let formatFn = TypedArrayItemView.formatFn[value[Symbol.toStringTag]]
            ?? TypedArrayItemView.formatFn.default
        let addrPadStart = value.length.toString(16).length
        let current = 0;
        let CHUNK = value.BYTES_PER_ELEMENT >= 4 ? 4 : 8
        while (current < value.length) {
            let next = Math.min(current + CHUNK, value.length)
            if (cb(
                '0x' + current.toString(16).padStart(addrPadStart, '0'),
                new TypedArrayItemView(value, formatFn, current, next,),
                EMPTY_CHILD_BIT,
            )) return;
            current = next;
        }
        // } else {
        //     next(value)
        // }
    }

}

export const typeArrayResolverMap = new Map([
    [ArrayBuffer, bufferResolver],
    [DataView, dataViewLikeResolver],
    [WrappedBufferView, dataViewLikeResolver],

    [Uint8Array, typeArrayLikeResolver],
    [Uint16Array, typeArrayLikeResolver],
    [Uint32Array, typeArrayLikeResolver],
    [Int8Array, typeArrayLikeResolver],
    [Int16Array, typeArrayLikeResolver],
    [Int32Array, typeArrayLikeResolver],
    [Float32Array, typeArrayLikeResolver],
    [Float64Array, typeArrayLikeResolver],

] as [any, ResolverFn<any>][])