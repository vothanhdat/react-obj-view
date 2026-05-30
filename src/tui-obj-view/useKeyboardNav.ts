import { useKeyboard, useRenderer } from "@opentui/react";
import type { KeyEvent } from "@opentui/core";
import type { FlattenNodeWrapper } from "../libs/react-tree-view/FlattenNodeWrapper";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";

export type KeyboardNavParams = {
    isActive: boolean;
    totalRows: number;
    visibleRows: number;
    focusedIndexRef: { current: number };
    setFocusedIndex: (next: number | ((prev: number) => number)) => void;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined;
    toggleChildExpand: (params: { paths: PropertyKey[] }) => void;
    setChildExpand: (params: { paths: PropertyKey[]; isExpanded: boolean }) => void;
    openSearch: () => void;
    nextMatch: () => void;
    prevMatch: () => void;
    onCopy: (paths: PropertyKey[], value: unknown) => void;
    onExit?: () => void;
};

export const useKeyboardNav = ({
    isActive,
    totalRows,
    visibleRows,
    focusedIndexRef,
    setFocusedIndex,
    getNodeByIndex,
    toggleChildExpand,
    setChildExpand,
    openSearch,
    nextMatch,
    prevMatch,
    onCopy,
    onExit,
}: KeyboardNavParams) => {
    const renderer = useRenderer();

    useKeyboard((key: KeyEvent) => {
        if (!isActive) return;
        if (totalRows === 0) return;

        const input = key.name;
        const seq = key.sequence;

        // Read the live focus from the ref (not a render closure) so multiple key
        // events delivered before the next commit each act on the updated value.
        const focusedIndex = focusedIndexRef.current;
        const current = getNodeByIndex(focusedIndex);

        if (input === "up" || seq === "k") {
            setFocusedIndex(prev => prev - 1);
            return;
        }
        if (input === "down" || seq === "j") {
            setFocusedIndex(prev => prev + 1);
            return;
        }
        if (input === "pageup") {
            setFocusedIndex(prev => prev - visibleRows);
            return;
        }
        if (input === "pagedown") {
            setFocusedIndex(prev => prev + visibleRows);
            return;
        }
        if (input === "home" || seq === "g") {
            setFocusedIndex(0);
            return;
        }
        if (input === "end" || seq === "G") {
            setFocusedIndex(totalRows - 1);
            return;
        }

        if (!current) return;

        if (input === "return" || input === "space" || input === "right") {
            if (current.hasChild) {
                toggleChildExpand({ paths: current.paths });
            }
            return;
        }
        if (input === "left") {
            const data = current.getData();
            if (data.expanded && current.hasChild) {
                setChildExpand({ paths: current.paths, isExpanded: false });
            } else if (current.paths.length > 0) {
                const parentIdx = current.parentIndex.at(-1);
                if (typeof parentIdx === "number" && parentIdx >= 0) {
                    setFocusedIndex(parentIdx);
                }
            }
            return;
        }

        if (seq === "/") {
            openSearch();
            return;
        }
        if (seq === "n") {
            nextMatch();
            return;
        }
        if (seq === "N") {
            prevMatch();
            return;
        }

        if (seq === "y") {
            try {
                const data = current.getData();
                onCopy(current.paths, data.value);
            } catch {
                // ignore
            }
            return;
        }

        if (seq === "q" || (key.ctrl && input === "c")) {
            onExit?.();
            renderer?.destroy();
            return;
        }
    });
};
