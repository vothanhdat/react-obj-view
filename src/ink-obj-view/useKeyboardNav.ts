import { useInput, useApp, type Key } from "ink";
import type { FlattenNodeWrapper } from "../libs/react-tree-view/FlattenNodeWrapper";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";

export type KeyboardNavParams = {
    isActive: boolean;
    totalRows: number;
    visibleRows: number;
    focusedIndex: number;
    setFocusedIndex: (next: number) => void;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined;
    toggleChildExpand: (params: { paths: PropertyKey[] }) => void;
    setChildExpand: (params: { paths: PropertyKey[]; isExpanded: boolean }) => void;
    openSearch: () => void;
    nextMatch: () => void;
    prevMatch: () => void;
    onCopy: (paths: PropertyKey[], value: unknown) => void;
    onExit?: () => void;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const useKeyboardNav = ({
    isActive,
    totalRows,
    visibleRows,
    focusedIndex,
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
    const app = useApp();

    useInput((input: string, key: Key) => {
        if (totalRows === 0) return;

        const current = getNodeByIndex(focusedIndex);

        if (key.upArrow || input === "k") {
            setFocusedIndex(clamp(focusedIndex - 1, 0, totalRows - 1));
            return;
        }
        if (key.downArrow || input === "j") {
            setFocusedIndex(clamp(focusedIndex + 1, 0, totalRows - 1));
            return;
        }
        if (key.pageUp) {
            setFocusedIndex(clamp(focusedIndex - visibleRows, 0, totalRows - 1));
            return;
        }
        if (key.pageDown) {
            setFocusedIndex(clamp(focusedIndex + visibleRows, 0, totalRows - 1));
            return;
        }
        if (input === "g") {
            setFocusedIndex(0);
            return;
        }
        if (input === "G") {
            setFocusedIndex(totalRows - 1);
            return;
        }

        if (!current) return;

        if (key.return || input === " " || key.rightArrow) {
            if (current.hasChild) {
                toggleChildExpand({ paths: current.paths });
            }
            return;
        }
        if (key.leftArrow) {
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

        if (input === "/" ) {
            openSearch();
            return;
        }
        if (input === "n") {
            nextMatch();
            return;
        }
        if (input === "N") {
            prevMatch();
            return;
        }

        if (input === "y") {
            try {
                const data = current.getData();
                onCopy(current.paths, data.value);
            } catch {
                // ignore
            }
            return;
        }

        if (input === "q" || (key.ctrl && input === "c")) {
            onExit?.();
            app.exit();
            return;
        }
    }, { isActive });
};
