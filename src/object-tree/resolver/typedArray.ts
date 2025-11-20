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
    buffer: ArrayBuffer
    [Symbol.toStringTag]: string
}

export class ItemViewBase {
    render() {
        return [] as string[]
    }
    chars(): string[] | undefined {
        return undefined
    }
}

const CONTROL_CHARS: Record<number, string> = {
    0x00: '\u2400', // ␀
    0x01: '\u2401', // ␁
    0x02: '\u2402', // ␂
    0x03: '\u2403', // ␃
    0x04: '\u2404', // ␄
    0x05: '\u2405', // ␅
    0x06: '\u2406', // ␆
    0x07: '\u2407', // ␇
    0x08: '\u2408', // ␈
    0x09: '\u2409', // ␉
    0x0A: '\u240A', // ␊
    0x0B: '\u240B', // ␋
    0x0C: '\u240C', // ␌
    0x0D: '\u240D', // ␍
    0x0E: '\u240E', // ␎
    0x0F: '\u240F', // ␏
    0x10: '\u2410', // ␐
    0x11: '\u2411', // ␑
    0x12: '\u2412', // ␒
    0x13: '\u2413', // ␓
    0x14: '\u2414', // ␔
    0x15: '\u2415', // ␕
    0x16: '\u2416', // ␖
    0x17: '\u2417', // ␗
    0x18: '\u2418', // ␘
    0x19: '\u2419', // ␙
    0x1A: '\u241A', // ␚
    0x1B: '\u241B', // ␛
    0x1C: '\u241C', // ␜
    0x1D: '\u241D', // ␝
    0x1E: '\u241E', // ␞
    0x1F: '\u241F', // ␟
    0x7F: '\u2421', // ␡
    // optionally, visualize space as well:
    0x20: '\u2420', // ␠
};

class BufferItemView extends ItemViewBase {

    constructor(
        public value: DataViewLike,
        public from: number,
        public to: number,
    ) {
        super()
    }

    render() {
        if (this.value) {
            let from = Math.min(this.from, this.value.byteLength)
            let to = Math.min(this.to, this.value.byteLength)
            return new Array(to - from)
                .fill(0)
                .map((_, index) => from + index)
                .map(offset => this.value.getUint8(offset).toString(16).padStart(2, "0"))

        }
        return []
    }



    chars() {
        if (this.value) {
            let from = Math.min(this.from, this.value.byteLength)
            let to = Math.min(this.to, this.value.byteLength)
            return new Array(to - from)
                .fill(0)
                .map((_, index) => from + index)
                .map(offset => this.value.getUint8(offset))
                .map(code => code in CONTROL_CHARS
                    ? CONTROL_CHARS[code]
                    : String.fromCharCode(code)
                )

        }
        return undefined
    }

}


class TypedArrayItemView extends ItemViewBase {

    static formatFn: Record<string, (e: number) => string> = {

        Int8Array: (e) => String(e),
        Uint8Array: (e) => e.toString().padStart(3, " "),
        Uint8ClampedArray: (e) => e.toString().padStart(3, " "),

        Int16Array: (e) => e.toString().padStart(5, " "),
        Uint16Array: (e) => e.toString().padStart(5, " "),

        Int32Array: (e) => e.toString().padStart(10, " "),
        Uint32Array: (e) => e.toString().padStart(10, " "),

        // BigInt64Array: (e) => String(e),
        // BigUint64Array: (e) => String(e),

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
            let from = Math.min(this.from, this.value.length)
            let to = Math.min(this.to, this.value.length)
            let format = this.format
            return new Array(to - from)
                .fill(0)
                .map((_, index) => from + index)
                .map(offset => format(this.value.at(offset)))
        }
        return []
    }



}


class WrappedBufferView implements DataViewLike {
    [hidePrototype] = true
    static name = ""
    toString() { return "" }

    static #cache = new WeakMap();

    static getInstance(e: ArrayBuffer) {
        if (!this.#cache.has(e)) {
            this.#cache.set(e, new WrappedBufferView(e));
        }
        return this.#cache.get(e);
    }

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

class WrappedTypedArray {
    [hidePrototype] = true
    static name = ""
    toString() { return "" }

    static #cache = new WeakMap();
    static getInstance(e: TypedArrayLike) {
        if (!this.#cache.has(e)) {
            this.#cache.set(e, new WrappedTypedArray(e));
        }
        return this.#cache.get(e);
    }

    private constructor(
        public data: TypedArrayLike,
    ) { }

}


const dataViewLikeResolver: ResolverFn<DataViewLike> = (
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

const bufferResolver: ResolverFn<ArrayBuffer> = (
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

const typeArrayResolver: ResolverFn<TypedArrayLike> = (
    value: TypedArrayLike,
    cb,
    next,
    isPreview,
    config,
    stableRef
) => {
    if (isPreview) {
        cb("length", value.length, ENUMERABLE_BIT)
        cb("byteLength", value.byteLength, ENUMERABLE_BIT)
    } else {
        cb("length", value.length, 0)
        cb("byteLength", value.byteLength, 0)
        cb("[[data]]", WrappedTypedArray.getInstance(value), 0)
        cb("[[buffer]]", WrappedBufferView.getInstance(value.buffer), 0)
    }
}



const wrappedTypedArrayResolver: ResolverFn<WrappedTypedArray> = (
    value: WrappedTypedArray,
    cb,
    next,
    isPreview,
    config,
    stableRef
) => {
    if (isPreview) {

    } else {
        let arr = value.data
        let formatFn = TypedArrayItemView.formatFn[arr[Symbol.toStringTag]]
            ?? TypedArrayItemView.formatFn.default
        let addrPadStart = arr.length.toString(16).length
        let current = 0;
        let CHUNK = arr.BYTES_PER_ELEMENT >= 4 ? 4 : 8
        while (current < arr.length) {
            let next = Math.min(current + CHUNK, arr.length)
            if (cb(
                '0x' + current.toString(16).padStart(addrPadStart, '0'),
                new TypedArrayItemView(arr, formatFn, current, next,),
                EMPTY_CHILD_BIT,
            )) return;
            current = next;
        }
    }

}

export const TYPED_ARRAY_RESOLVERS = new Map([
    [WrappedBufferView, dataViewLikeResolver],
    [WrappedTypedArray, wrappedTypedArrayResolver],


    [ArrayBuffer, bufferResolver],
    [DataView, dataViewLikeResolver],

    [Uint8Array, typeArrayResolver],
    [Uint8ClampedArray, typeArrayResolver],

    [Uint16Array, typeArrayResolver],
    [Uint32Array, typeArrayResolver],
    [Int8Array, typeArrayResolver],
    [Int16Array, typeArrayResolver],
    [Int32Array, typeArrayResolver],
    [Float32Array, typeArrayResolver],
    [Float64Array, typeArrayResolver],

] as [any, ResolverFn<any>][])