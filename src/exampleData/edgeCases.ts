// Edge cases and special JavaScript constructs
export const edgeCases = {
  // Prototype chain examples
  prototypeChain: (() => {
    function Animal(this: any, name: string) {
      this.name = name;
    }
    Animal.prototype.speak = function() {
      return `${(this as any).name} makes a sound`;
    };
    
    function Dog(this: any, name: string, breed: string) {
      Animal.call(this, name);
      this.breed = breed;
    }
    Dog.prototype = Object.create(Animal.prototype);
    Dog.prototype.constructor = Dog;
    Dog.prototype.speak = function() {
      return `${(this as any).name} barks`;
    };
    
    return new (Dog as any)("Buddy", "Golden Retriever");
  })(),
  
  // Symbols and well-known symbols
  symbols: (() => {
    const obj: any = {};
    const sym1 = Symbol("description");
    const sym2 = Symbol.for("global");
    
    obj[sym1] = "Symbol property";
    obj[sym2] = "Global symbol property";
    obj[Symbol.iterator] = function*() { yield 1; yield 2; yield 3; };
    obj[Symbol.toStringTag] = "CustomObject";
    obj[Symbol.toPrimitive] = function(hint: string) {
      if (hint === "number") return 42;
      if (hint === "string") return "custom object";
      return null;
    };
    
    return obj;
  })(),
  
  // Proxies
  proxyObject: new Proxy(
    { name: "Original", value: 100 },
    {
      get(target, prop) {
        console.log(`Getting property: ${String(prop)}`);
        return (target as any)[prop];
      },
      set(target, prop, value) {
        console.log(`Setting property: ${String(prop)} = ${value}`);
        (target as any)[prop] = value;
        return true;
      },
      has(target, prop) {
        console.log(`Checking if property exists: ${String(prop)}`);
        return prop in target;
      },
      ownKeys(target) {
        console.log("Getting own keys");
        return Reflect.ownKeys(target);
      }
    }
  ),
  
  // WeakMap and WeakSet (these won't show much in object view)
  weakCollections: {
    weakMap: (() => {
      const wm = new WeakMap();
      const key1 = {};
      const key2 = {};
      wm.set(key1, "value1");
      wm.set(key2, "value2");
      return wm;
    })(),
    weakSet: (() => {
      const ws = new WeakSet();
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      ws.add(obj1);
      ws.add(obj2);
      return ws;
    })(),
  },
  
  // Map and Set with various key types
  collections: {
    mapWithVariousKeys: (() => {
      const map = new Map();
      map.set("string", "string key");
      map.set(42, "number key");
      map.set(true, "boolean key");
      map.set({}, "object key");
      map.set([], "array key");
      map.set(Symbol("sym"), "symbol key");
      map.set(null, "null key");
      map.set(undefined, "undefined key");
      return map;
    })(),
    
    setWithVariousValues: (() => {
      const set = new Set();
      set.add("string");
      set.add(42);
      set.add(true);
      set.add({});
      set.add([]);
      set.add(Symbol("sym"));
      set.add(null);
      set.add(undefined);
      return set;
    })(),
    
    nestedCollections: {
      mapOfMaps: (() => {
        const outer = new Map();
        const inner1 = new Map([["a", 1], ["b", 2]]);
        const inner2 = new Map([["x", 10], ["y", 20]]);
        outer.set("first", inner1);
        outer.set("second", inner2);
        return outer;
      })(),
      
      setOfSets: (() => {
        const outer = new Set();
        const inner1 = new Set([1, 2, 3]);
        const inner2 = new Set(["a", "b", "c"]);
        outer.add(inner1);
        outer.add(inner2);
        return outer;
      })(),
    },
  },
  
  // Generators and iterators
  generators: {
    simpleGenerator: (function*() {
      yield 1;
      yield 2;
      yield 3;
    })(),
    
    infiniteGenerator: (function*() {
      let i = 0;
      while (true) {
        yield i++;
      }
    })(),
    
    customIterator: {
      data: [1, 2, 3, 4, 5],
      [Symbol.iterator]: function*() {
        for (const item of this.data) {
          yield item * 2;
        }
      }
    },
  },
  
  // Promises and async functions
  promises: {
    resolved: Promise.resolve("Resolved value"),
    rejected: Promise.reject(new Error("Rejected promise")),
    pending: new Promise(() => {}), // Never resolves
    
    asyncFunction: async function() {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "Async result";
    },
  },
  
  // Regular expressions with various flags
  regexVariations: {
    basic: /hello/,
    global: /hello/g,
    ignoreCase: /hello/i,
    multiline: /^hello$/m,
    dotAll: /hello.world/s,
    unicode: /\u{1F600}/u,
    sticky: /hello/y,
    allFlags: /hello/gimsy,
    complex: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  },
  
  // Various built-in objects
  builtInObjects: {
    math: Math,
    json: JSON,
    console: console,
    date: Date,
    array: Array,
    object: Object,
    string: String,
    number: Number,
    boolean: Boolean,
    regExp: RegExp,
    error: Error,
    promise: Promise,
    symbol: Symbol,
    map: Map,
    set: Set,
    weakMap: WeakMap,
    weakSet: WeakSet,
  },
};