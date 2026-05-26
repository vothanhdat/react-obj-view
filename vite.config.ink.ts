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
    "ink",
    "ink-text-input",
    "meow",
    "clipboardy",
    "chalk",
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
            include: ["src/ink-obj-view", "src/ink-obj-view-themes"],
            exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
            outDir: "dist-ink/ink",
            entryRoot: "src",
        }),
        chmodBin("dist-ink/cli/react-obj-view.js"),
    ],
    build: {
        outDir: "dist-ink",
        emptyOutDir: true,
        target: "node20",
        ssr: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                "ink/index": "src/ink-obj-view/index.ts",
                "cli/react-obj-view": "bin/react-obj-view.tsx",
            },
            external,
            output: {
                format: "esm",
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name].js",
                banner: (chunk) =>
                    chunk.name === "cli/react-obj-view" ? "#!/usr/bin/env node" : "",
            },
            preserveEntrySignatures: "strict",
        },
    },
});
