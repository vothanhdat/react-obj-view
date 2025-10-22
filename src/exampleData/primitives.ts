// Primitive data types examples
export const primitiveExamples = {
  string: "Hello World",
  number: 42,
  boolean: true,
  nullValue: null,
  undefinedValue: undefined,
  bigint: BigInt(123456789012345678901234567890n),
  symbol: Symbol("unique"),
  date: new Date("2023-12-25T10:30:00Z"),
  regex: /^[a-zA-Z0-9]+$/g,
  function: function greet(name: string) { return `Hello, ${name}!`; },
  arrowFunction: (x: number, y: number) => x + y,
  error: new Error("Sample error message"),
};

export const stringVariations = {
  empty: "",
  singleChar: "a",
  multiline: `This is a
multiline
string with
several lines`,
  unicode: "Hello 世界 🌍 🚀",
  escaped: "Line 1\nLine 2\tTabbed\r\nCarriage return",
  longString: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10),
  html: "<div class='container'><p>HTML content</p></div>",
  json: '{"key": "value", "number": 123, "array": [1, 2, 3]}',
  url: "https://www.example.com/path?param=value&other=123#section",
};

export const numberVariations = {
  zero: 0,
  negativeZero: -0,
  positiveInteger: 123,
  negativeInteger: -456,
  decimal: 123.456,
  scientific: 1.23e10,
  infinity: Infinity,
  negativeInfinity: -Infinity,
  notANumber: NaN,
  maxSafeInteger: Number.MAX_SAFE_INTEGER,
  minSafeInteger: Number.MIN_SAFE_INTEGER,
  epsilon: Number.EPSILON,
};
