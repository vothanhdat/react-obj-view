

export interface LinkedNode<T> {
    obj: T | undefined;
    idx: number;
    prev: LinkedNode<T> | undefined;
    next: LinkedNode<T> | undefined;
}
let counter = 0;

export class LinkingNode<T> implements LinkedNode<T> {
    public obj: T | undefined = undefined;
    public idx = counter++;
    constructor(
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined
    ) { }

}


export class LinkedDataNode<T> implements LinkedNode<T> {
    public idx = counter++;
    constructor(
        public obj: T | undefined = undefined,
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined
    ) { }
}

export const insertNodeBefore = <T>(
    cursor: LinkedNode<T>,
    newNode: LinkedNode<T>
) => {

    cursor.prev!.next = newNode;
    newNode.prev = cursor.prev;

    newNode.next = cursor;
    cursor.prev = newNode;
};

export const insertListsBefore = <T>(
    cursor: LinkedNode<T>,
    start: LinkedNode<T>,
    end: LinkedNode<T>
) => {

    cursor.prev!.next = start;
    start.prev = cursor.prev;

    end.next = cursor;
    cursor.prev = end;
};

export const linkListToArray = <T>([start, end]: [LinkedNode<T> | undefined, LinkedNode<T> | undefined]): T[] => {
    let result: T[] = [];
    let current: LinkedNode<T> | undefined = start?.prev ?? start;
    while (current) {
        current.obj && result.push(current.obj);
        current = current.next;
    }
    return result;
};
