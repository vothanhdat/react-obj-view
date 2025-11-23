

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


export class LazyValueError extends Error {
    constructor(private error: any) {
        super(error)
    }
    // static name = ""
    // toString() { return  }
}

