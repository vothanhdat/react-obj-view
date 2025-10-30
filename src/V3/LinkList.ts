export class LinkList<T> {
    public next: LinkList<T> | undefined;

    constructor(
        public obj: T
    ) { }

    get length() {
        let count = 1;
        let current: LinkList<T> | undefined = this;
        while (current && count < 1000) {
            current = current.next;
            count++;
        }

        return count;
    }
}

export const linkListToArray = <T>([start, end]: [LinkList<T> | undefined, LinkList<T> | undefined]): T[] => {
    let result: T[] = [];
    let current: LinkList<T> | undefined = start;
    while (current) {
        result.push(current.obj);
        current = current.next;
        if (current == end) break;
    }
    return result;
};
