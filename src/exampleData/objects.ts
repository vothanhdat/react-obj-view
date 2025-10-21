// Object examples with various structures and nesting levels
export const objectExamples = {
  empty: {},
  
  simple: {
    name: "John Doe",
    age: 30,
    active: true,
  },
  
  nested: {
    user: {
      profile: {
        personal: {
          firstName: "Jane",
          lastName: "Smith",
          birthDate: new Date("1990-05-15"),
        },
        contact: {
          email: "jane.smith@example.com",
          phone: "+1-555-0123",
          address: {
            street: "123 Main St",
            city: "Anytown",
            state: "CA",
            zipCode: "12345",
            coordinates: {
              lat: 37.7749,
              lng: -122.4194,
            },
          },
        },
      },
      preferences: {
        theme: "dark",
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        language: "en-US",
      },
    },
  },
  
  circular: (() => {
    const obj: any = {
      name: "Circular Reference Example",
      data: {
        values: [1, 2, 3],
      },
    };
    obj.self = obj;
    obj.data.parent = obj;
    return obj;
  })(),
  
  withArrays: {
    numbers: [1, 2, 3, 4, 5],
    users: [
      { id: 1, name: "Alice", roles: ["admin", "user"] },
      { id: 2, name: "Bob", roles: ["user"] },
      { id: 3, name: "Charlie", roles: ["moderator", "user"] },
    ],
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    tags: ["frontend", "react", "typescript", "javascript"],
  },
  
  withFunctions: {
    calculator: {
      add: (a: number, b: number) => a + b,
      subtract: (a: number, b: number) => a - b,
      multiply: function(a: number, b: number) { return a * b; },
      divide: function divide(a: number, b: number) { return b !== 0 ? a / b : null; },
    },
    utils: {
      formatDate: Date.prototype.toISOString,
      parseJSON: JSON.parse,
      stringifyJSON: JSON.stringify,
      randomNumber: Math.random,
    },
  },
  
  specialValues: {
    nullValue: null,
    undefinedValue: undefined,
    emptyString: "",
    zeroNumber: 0,
    falseBoolean: false,
    emptyArray: [],
    emptyObject: {},
    infinity: Infinity,
    negativeInfinity: -Infinity,
    notANumber: NaN,
  },
  
  descriptors: (() => {
    const obj: any = {};
    Object.defineProperty(obj, "readOnly", {
      value: "This is read-only",
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(obj, "hidden", {
      value: "This is hidden",
      writable: true,
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(obj, "getter", {
      get() { return "Dynamic value: " + Date.now(); },
      enumerable: true,
      configurable: true,
    });
    return obj;
  })(),
};