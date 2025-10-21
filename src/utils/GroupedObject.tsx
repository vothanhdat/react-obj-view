
export class GroupedObject {
    constructor(
        public obj: any,
        public keys = Object.keys(obj),
        public from = 0,
        public to = keys.length
    ) { }

    getSize() {
        return this.to - this.from;
    }

    getKey(maxLength = 10) {
        return this.obj instanceof Array
            ? `${this.from}..${this.to}`
            : `${this.keys[this.from]?.slice(0, maxLength)}..${this.keys[this.to - 1]?.slice(0, maxLength)}`;
    }

    getKeys() {
        return this.keys.slice(this.from, this.to);
    }

    getObject() {
        return Object.fromEntries(
            this.keys.slice(this.from, this.to)
                .map(k => [k, this.obj[k]])
        );
    }

}



export const toGrouped = (grouped: GroupedObject, max = 10) => {
    let size = grouped.getSize();
    let seperator = max ** Math.floor(Math.log(size - 1) / Math.log(max));
    if (seperator > 0) {
        return new Array(Math.ceil((size - 1) / seperator))
            .fill(0).map((_, i) => new GroupedObject(
                grouped.obj,
                grouped.keys,
                grouped.from + i * seperator,
                Math.min(grouped.from + (i + 1) * seperator, grouped.to)
            ));
    } else {
        return [grouped];
    }
};
