import React from "react";
import { render } from "ink";
import meow from "meow";
import { readFileSync, openSync } from "node:fs";
import { InkObjectView, builtInInkThemes, BuiltInInkThemeName, themeMono } from "../src/ink-obj-view";

const cli = meow(`
    Usage
      $ react-obj-view <file>
      $ cat data.json | react-obj-view

    Options
      --depth=<n>           Initial expand depth (default 1)
      --theme=<name>        dark | light | mono (default dark)
      --array-group=<n>     Group large arrays into chunks of n
      --object-group=<n>    Group large objects into chunks of n
      --no-color            Disable colored output
      --line-numbers        Show row indices on the left
      --include-symbols     Include symbol-keyed properties
      --non-enumerable      Show non-enumerable properties
      --mouse               Enable mouse click + scroll wheel (disables native text selection)
`, {
    importMeta: import.meta,
    flags: {
        depth: { type: "number", default: 1 },
        theme: { type: "string", default: "dark" },
        arrayGroup: { type: "number", default: 0 },
        objectGroup: { type: "number", default: 0 },
        color: { type: "boolean", default: true },
        lineNumbers: { type: "boolean", default: false },
        includeSymbols: { type: "boolean", default: false },
        nonEnumerable: { type: "boolean", default: false },
        mouse: { type: "boolean", default: false },
    },
});

async function readStdin(): Promise<string> {
    return await new Promise((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => { data += chunk; });
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
    });
}

async function loadJSON(): Promise<unknown> {
    const filePath = cli.input[0];
    let raw: string;
    if (filePath) {
        raw = readFileSync(filePath, "utf8");
    } else if (!process.stdin.isTTY) {
        raw = await readStdin();
    } else {
        cli.showHelp(2);
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        process.stderr.write(`Failed to parse JSON: ${(e as Error).message}\n`);
        process.exit(1);
    }
}

const ALT_SCREEN_ENTER = "\x1b[?1049h\x1b[2J\x1b[H";
const ALT_SCREEN_EXIT = "\x1b[?1049l";

async function main() {
    const data = await loadJSON();

    const themeName = (cli.flags.theme as string).toLowerCase() as BuiltInInkThemeName;
    const theme = cli.flags.color
        ? (builtInInkThemes[themeName] ?? builtInInkThemes.dark)
        : themeMono;

    // If stdin was used to feed JSON, reopen /dev/tty for interactive input.
    let inkStdin: NodeJS.ReadStream = process.stdin;
    if (!process.stdin.isTTY) {
        try {
            const fd = openSync("/dev/tty", "r");
            const tty = await import("node:tty");
            inkStdin = new tty.ReadStream(fd) as unknown as NodeJS.ReadStream;
        } catch {
            process.stderr.write("Interactive TTY unavailable; cannot run interactively.\n");
            process.exit(1);
        }
    }

    const useAltScreen = process.stdout.isTTY && !process.env.REACT_OBJ_VIEW_NO_ALT;

    let restored = false;
    const restore = () => {
        if (restored) return;
        restored = true;
        if (useAltScreen) process.stdout.write(ALT_SCREEN_EXIT);
    };

    if (useAltScreen) process.stdout.write(ALT_SCREEN_ENTER);
    process.on("exit", restore);
    process.on("SIGINT", () => { restore(); process.exit(130); });
    process.on("SIGTERM", () => { restore(); process.exit(143); });

    const { waitUntilExit } = render(
        <InkObjectView
            valueGetter={() => data}
            expandLevel={cli.flags.depth as number}
            theme={theme}
            arrayGroupSize={cli.flags.arrayGroup as number}
            objectGroupSize={cli.flags.objectGroup as number}
            showLineNumbers={cli.flags.lineNumbers as boolean}
            includeSymbols={cli.flags.includeSymbols as boolean}
            nonEnumerable={cli.flags.nonEnumerable as boolean}
            enableMouse={cli.flags.mouse as boolean}
        />,
        { stdin: inkStdin, exitOnCtrlC: true },
    );

    try {
        await waitUntilExit();
    } finally {
        restore();
    }
}

main().catch((err) => {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
});
