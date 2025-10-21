// Array examples with various structures
export const arrayExamples = {
  empty: [],
  numbers: [1, 2, 3, 4, 5],
  strings: ["apple", "banana", "cherry", "date"],
  mixed: [1, "two", true, null, undefined, { nested: "object" }],
  nested: [
    [1, 2, 3],
    ["a", "b", "c"],
    [{ x: 1 }, { y: 2 }]
  ],
  sparse: (() => {
    const arr = [];
    arr[0] = "first";
    arr[5] = "sixth";
    arr[10] = "eleventh";
    return arr;
  })(),
  large: Array.from({ length: 100 }, (_, i) => i + 1),
  objects: [
    { id: 1, name: "John", age: 30 },
    { id: 2, name: "Jane", age: 25 },
    { id: 3, name: "Bob", age: 35 }
  ],
  functions: [
    function add(a: number, b: number) { return a + b; },
    (x: number) => x * 2,
    Math.sqrt,
    console.log
  ],
  dates: [
    new Date("2023-01-01"),
    new Date("2023-06-15"),
    new Date("2023-12-31")
  ]
};

export const arrayLikeObjects = {
  nodeList: (() => {
    // Simulating a NodeList-like object
    const nodeListLike: any = {
      0: { tagName: "DIV", id: "container" },
      1: { tagName: "P", className: "text" },
      2: { tagName: "SPAN", textContent: "Hello" },
      length: 3,
      item: function(index: number): any { return this[index]; },
      [Symbol.iterator]: function*(): any {
        for (let i = 0; i < this.length; i++) {
          yield this[i];
        }
      }
    };
    return nodeListLike;
  })(),
  
  arguments: (() => {
    return (function(...args: any[]) { return arguments; })(1, "two", true, { nested: "value" });
  })(),
  
  typedArray: new Uint8Array([1, 2, 3, 4, 5]),
  buffer: new ArrayBuffer(16),
  dataView: new DataView(new ArrayBuffer(16))
};