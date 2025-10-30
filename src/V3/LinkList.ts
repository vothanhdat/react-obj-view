let counter = 0
export class LinkList<T> {
    set prev(value) { this._prev = value }
    get prev() { return this._prev }

    set next(value) { this._next = value }
    get next() { return this._next }

    constructor(
        public obj: T,
        private _prev: LinkList<T> | undefined = undefined,
        private _next: LinkList<T> | undefined = undefined,
        public idx = counter++,
    ) { }

    getLength() {
        let count = 1;
        let current: LinkList<T> | undefined = this;
        while (current && count < 1000) {
            current = current.next;
            count++;
        }

        return count;
    }

    getDistance(to: LinkList<T>) {
        let count = 0;
        let current: LinkList<T> | undefined = this;
        while (count < 100000 && current) {
            if (current == to) {
                return count
            }
            current = current.next;
        }
        return -1;
    }
}

export class FirstNode<T> extends LinkList<T> {
    set prev(value) {
        if (value != undefined) {
            throw new Error("FirstNode: prev not allowed")
        }
    }
    get prev() { return undefined }
}

export class LastNode<T> extends LinkList<T> {
    set next(value) {
        if (value != undefined) {
            throw new Error("LastNode: next not allowed")
        }
    }
    get next() { return undefined }
}

export const linkListToArray = <T>([start, end]: [LinkList<T> | undefined, LinkList<T> | undefined]): T[] => {
    let result: T[] = [];
    let current: LinkList<T> | undefined = start?.prev ?? start;
    while (current) {
        current.obj && result.push(current.obj);
        current = current.next;
    }
    return result;
};
