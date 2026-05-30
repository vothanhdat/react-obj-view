import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import Macros from "unplugin-macros/vite";
import { builtinModules } from "node:module";
import { chmod } from "node:fs/promises";
import { resolve } from "node:path";

const chmodBin = (path: string): Plugin => ({
    name: "chmod-bin",
    apply: "build",
    async closeBundle() {
        try {
            await chmod(resolve(path), 0o755);
        } catch {
            // ignore on platforms where chmod isn't applicable
        }
    },
});

const nodeBuiltins = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
];

const external = [
    "react",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom",
    "react-reconciler",
    "react-reconciler/constants",
    "@opentui/core",
    "@opentui/react",
    "meow",
    "clipboardy",
    ...nodeBuiltins,
];

export default defineConfig({
    plugins: [
        Macros(),
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
        dts({
            include: ["src/tui-obj-view", "src/tui-obj-view-themes"],
            exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
            outDir: "dist-tui/tui",
            entryRoot: "src",
        }),
        chmodBin("dist-tui/cli/react-obj-view.js"),
    ],
    build: {
        outDir: "dist-tui",
        emptyOutDir: true,
        copyPublicDir: false,
        target: "node20",
        ssr: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                "tui/index": "src/tui-obj-view/index.ts",
                "cli/react-obj-view": "bin/react-obj-view.tsx",
            },
            external,
            output: {
                format: "esm",
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name].js",
                // OpenTUI's core is backed by a native FFI library that runs under
                // Bun (or Node started with --experimental-ffi). Plain `node` also
                // can't resolve @opentui/react's extensionless `react-reconciler/constants`
                // import, so the CLI targets Bun.
                banner: (chunk) =>
                    chunk.name === "cli/react-obj-view" ? "#!/usr/bin/env bun" : "",
            },
            preserveEntrySignatures: "strict",
        },
    },
});
