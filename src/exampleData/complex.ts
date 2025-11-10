// Complex data structures for testing edge cases
export const complexStructures = {
  // Deeply nested object with mixed types
  deepNesting: {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              level6: {
                level7: {
                  level8: {
                    level9: {
                      level10: {
                        deepValue: "You found me!",
                        deepArray: [1, 2, { evenDeeper: { value: "nested in array" } }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  
  // Large object with many properties
  manyProperties: (() => {
    const obj: any = {};
    for (let i = 0; i < 100; i++) {
      obj[`property_${i}`] = {
        id: i,
        value: `Value ${i}`,
        isEven: i % 2 === 0,
        timestamp: new Date(2023, 0, i + 1),
        nested: {
          doubleValue: i * 2,
          squareValue: i * i,
          details: {
            description: `This is property number ${i}`,
            tags: [`tag-${i}`, `category-${Math.floor(i / 10)}`],
          },
        },
      };
    }
    return obj;
  })(),
  manyManyProperties: (() => {
    const obj: any = {};
    for (let i = 0; i < 1000; i++) {
      obj[`property_${i}`] = {
        id: i,
        value: `Value ${i}`,
        isEven: i % 2 === 0,
        timestamp: new Date(2023, 0, i + 1),
        nested: {
          doubleValue: i * 2,
          squareValue: i * i,
          details: {
            description: `This is property number ${i}`,
            tags: [`tag-${i}`, `category-${Math.floor(i / 10)}`],
          },
        },
      };
    }
    return obj;
  })(),
  
  // Mixed data types in complex structure
  mixedTypes: {
    strings: {
      simple: "Hello World",
      multiline: `Line 1
Line 2
Line 3`,
      withEscapes: "Tab:\t Newline:\n Quote:\" Backslash:\\",
      unicode: "🎉 Unicode: αβγ 中文 العربية",
      empty: "",
    },
    numbers: {
      integers: [0, 1, -1, 42, -42, 999999],
      floats: [0.1, -0.1, 3.14159, 2.71828, 1.618],
      special: [Infinity, -Infinity, NaN, Number.MAX_VALUE, Number.MIN_VALUE],
    },
    booleans: {
      trueValue: true,
      falseValue: false,
      truthyValues: [1, "hello", [], {}],
      falsyValues: [0, "", null, undefined, false, NaN],
    },
    dates: {
      now: new Date(),
      epoch: new Date(0),
      y2k: new Date("2000-01-01T00:00:00Z"),
      future: new Date("2099-12-31T23:59:59Z"),
      invalid: new Date("invalid"),
    },
    errors: {
      generic: new Error("Generic error"),
      syntaxError: new SyntaxError("Syntax error message"),
      typeError: new TypeError("Type error message"),
      rangeError: new RangeError("Range error message"),
      customError: (() => {
        class CustomError extends Error {
          constructor(message: string, public code: number) {
            super(message);
            this.name = "CustomError";
          }
        }
        return new CustomError("Custom error message", 500);
      })(),
    },
  },
  
  // Data structures that might cause rendering issues
  problematicData: {
    hugeString: "A".repeat(10000),
    hugeArray: Array.from({ length: 1000 }, (_, i) => i),
    hugeObject: (() => {
      const obj: any = {};
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = `value${i}`;
      }
      return obj;
    })(),
    binaryData: new Uint8Array(Array.from({ length: 256 }, (_, i) => i)),
    specialCharacters: {
      controlChars: "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F",
      highUnicode: "𝕰𝖒𝖔𝖏𝖎 𝖆𝖓𝖉 𝖚𝖓𝖎𝖈𝖔𝖉𝖊: 🎭🎪🎨🎯🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿",
      rtlText: "مرحبا بالعالم العربي",
      mixedDirections: "Hello مرحبا World עולם",
    },
  },
  
  // Real-world like API responses
  apiResponse: {
    user: {
      id: 12345,
      username: "johndoe",
      email: "john.doe@example.com",
      profile: {
        firstName: "John",
        lastName: "Doe",
        avatar: "https://example.com/avatars/johndoe.jpg",
        bio: "Software developer passionate about React and TypeScript",
        location: {
          city: "San Francisco",
          country: "USA",
          timezone: "America/Los_Angeles",
        },
        social: {
          twitter: "@johndoe",
          github: "johndoe",
          linkedin: "john-doe-dev",
          website: "https://johndoe.dev",
        },
      },
      settings: {
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        privacy: {
          profileVisible: true,
          showEmail: false,
          showLocation: true,
        },
        preferences: {
          theme: "dark",
          language: "en-US",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "12h",
        },
      },
      activity: {
        lastLogin: new Date("2023-12-01T14:30:00Z"),
        loginCount: 1234,
        postsCount: 567,
        followersCount: 890,
        followingCount: 123,
      },
    },
    posts: [
      {
        id: 1,
        title: "Getting Started with React",
        content: "React is a powerful library for building user interfaces...",
        author: "johndoe",
        createdAt: new Date("2023-11-15T10:00:00Z"),
        updatedAt: new Date("2023-11-15T10:05:00Z"),
        tags: ["react", "javascript", "frontend", "tutorial"],
        stats: {
          views: 1250,
          likes: 89,
          comments: 23,
          shares: 12,
        },
        metadata: {
          readTime: 8,
          difficulty: "beginner",
          featured: true,
        },
      },
      {
        id: 2,
        title: "Advanced TypeScript Patterns",
        content: "TypeScript offers many advanced features that can help...",
        author: "johndoe",
        createdAt: new Date("2023-11-20T15:30:00Z"),
        updatedAt: new Date("2023-11-20T16:00:00Z"),
        tags: ["typescript", "javascript", "patterns", "advanced"],
        stats: {
          views: 892,
          likes: 67,
          comments: 15,
          shares: 8,
        },
        metadata: {
          readTime: 12,
          difficulty: "advanced",
          featured: false,
        },
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 15,
      pageSize: 10,
      totalItems: 147,
      hasNext: true,
      hasPrevious: false,
    },
    meta: {
      apiVersion: "v2.1",
      timestamp: new Date(),
      responseTime: 145,
      server: "api-server-03",
      requestId: "req_abc123def456",
    },
  },
};