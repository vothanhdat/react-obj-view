

// export class LazyValueWrapper {

//     static map = new WeakMap<any, LazyValueWrapper>;

//     static getInstance(value: any) {
//         let v = this.map.get(value);
//         if (!v) {
//             this.map.set(value, v = new LazyValueWrapper(value));
//         }

//         return v;
//     }

//     private constructor(
//         public value: any
//     ) { }

// }

export class LazyValue {

    static map = new WeakMap<any, Map<any, LazyValue>>;

    static getInstance(object: any, key: any) {

        let subMap = this.map.get(object)
        if (!subMap) {
            this.map.set(object, subMap = new Map())
        }
        let instance = subMap.get(key)

        if (!instance) {
            subMap.set(key, instance = new LazyValue(object, key))
        }

        return instance
    }



    public inited = false
    public value: any = undefined
    public error: any = undefined

    private constructor(
        private obj: any,
        private key: any
    ) { }

    public init() {
        if (!this.inited) {
            let descriptor = Object.getOwnPropertyDescriptor(this.obj, this.key)!
            try {
                this.value = descriptor?.value ?? descriptor.get?.call(this.obj);
            } catch (error) {
                this.error = new LazyValueError(error)
            }
            this.inited = true;
        }
    }

    static name = ""
    toString() { return "" }
}

export class LazyValueError extends Array {
    constructor(private error: any) {
        super()
        this.push(error)
    }
    static name = ""
    toString() { return "" }
}

