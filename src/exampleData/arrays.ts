const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = ONE_KILOBYTE * ONE_KILOBYTE;

// Array examples with various structures
const createUint8Sequence = (length: number, step: number = 1) => {
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = (i * step) % 256;
  }
  return arr;
};

const createUint16Sequence = (length: number, step: number = 256) => {
  const arr = new Uint16Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = (i * step) % 65536;
  }
  return arr;
};

const createInt32Sequence = (length: number, step: number = 1024) => {
  const arr = new Int32Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = (i * step) | 0;
  }
  return arr;
};

const createFloat32Wave = (length: number) => {
  const arr = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = Math.sin(i / 5) * Math.cos(i / 10);
  }
  return arr;
};

const createFloat64Noise = (length: number) => {
  const arr = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const base = Math.sin(i / 50) + Math.cos(i / 75);
    arr[i] = base + (Math.random() - 0.5) * 0.01;
  }
  return arr;
};

const createArrayBufferWithPattern = (size: number, step: number = 17) => {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = (i * step) % 256;
  }
  return buffer;
};

const largeBinary512KB = createUint8Sequence(512 * ONE_KILOBYTE, 17);
const largeBinary1MB = createUint8Sequence(ONE_MEGABYTE, 13);
const largeInt32Array1MB = createInt32Sequence(ONE_MEGABYTE / 4, 4096);
const largeFloat64Array1MB = createFloat64Noise(ONE_MEGABYTE / 8);
const halfMBBuffer = createArrayBufferWithPattern(512 * ONE_KILOBYTE, 23);
const largeBuffer1MB = createArrayBufferWithPattern(ONE_MEGABYTE, 31);
const largeDataView1MB = new DataView(createArrayBufferWithPattern(ONE_MEGABYTE, 37));

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
  uintArray: new Uint32Array([0, 1024, 65535, 2147483647]),
  typedArraySeries: {
    uint8Small: new Uint8Array([0, 5, 10, 15, 20, 25, 30, 35]),
    uint16Pattern: createUint16Sequence(32, 1024),
    float32Waveform: createFloat32Wave(128),
    largeBinary512KB,
    largeBinary1MB,
    largeInt32: largeInt32Array1MB,
    largeFloat64: largeFloat64Array1MB,
  },
  buffer: new ArrayBuffer(16),
  dataView: new DataView(new ArrayBuffer(16)),
  largeBuffers: {
    halfMBBuffer,
    oneMBBuffer: largeBuffer1MB,
    oneMBDataView: largeDataView1MB,
  },
};
