/** @jsxImportSource @opentui/react */
import React from "react";
import { createCliRenderer, CliRenderEvents } from "@opentui/core";
import { createRoot } from "@opentui/react";
import meow from "meow";
import { readFileSync, openSync } from "node:fs";
import { TuiObjectView } from "../src/tui-obj-view/TuiObjectView";
import { builtInTuiThemes, BuiltInTuiThemeName, themeMono } from "../src/tui-obj-view-themes";

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

async function main() {
    const data = await loadJSON();

    const themeName = (cli.flags.theme as string).toLowerCase() as BuiltInTuiThemeName;
    const theme = cli.flags.color
        ? (builtInTuiThemes[themeName] ?? builtInTuiThemes.dark)
        : themeMono;

    // If stdin was used to feed JSON, reopen /dev/tty for interactive input.
    let inputStream: NodeJS.ReadStream = process.stdin;
    if (!process.stdin.isTTY) {
        try {
            const fd = openSync("/dev/tty", "r");
            const tty = await import("node:tty");
            inputStream = new tty.ReadStream(fd) as unknown as NodeJS.ReadStream;
        } catch {
            process.stderr.write("Interactive TTY unavailable; cannot run interactively.\n");
            process.exit(1);
        }
    }

    // OpenTUI manages the alternate screen, raw mode, mouse tracking and
    // signal/Ctrl+C handling itself — no manual ANSI bookkeeping needed.
    const renderer = await createCliRenderer({
        stdin: inputStream,
        stdout: process.stdout,
        exitOnCtrlC: true,
        useMouse: cli.flags.mouse as boolean,
    });

    const exited = new Promise<void>((resolve) => {
        renderer.once(CliRenderEvents.DESTROY, () => resolve());
    });

    const root = createRoot(renderer);
    root.render(
        <TuiObjectView
            valueGetter={() => data}
            expandLevel={cli.flags.depth as number}
            theme={theme}
            arrayGroupSize={cli.flags.arrayGroup as number}
            objectGroupSize={cli.flags.objectGroup as number}
            showLineNumbers={cli.flags.lineNumbers as boolean}
            includeSymbols={cli.flags.includeSymbols as boolean}
            nonEnumerable={cli.flags.nonEnumerable as boolean}
            enableMouse={cli.flags.mouse as boolean}
            onExit={() => renderer.destroy()}
        />,
    );

    await exited;
    process.exit(0);
}

main().catch((err) => {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
});
