import { useEffect, useRef } from "react";
import { useStdin, useStdout } from "ink";

export type MouseEvent = {
    type: "press" | "release" | "scroll";
    button: number;
    x: number;
    y: number;
};

const SGR_MOUSE_RE = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;

export type MouseHandlerParams = {
    enabled: boolean;
    onClick?: (e: { row: number; col: number }) => void;
    onDoubleClick?: (e: { row: number; col: number }) => void;
    onScroll?: (delta: number) => void;
};

export const useMouse = ({ enabled, onClick, onDoubleClick, onScroll }: MouseHandlerParams) => {
    const { stdin, setRawMode } = useStdin();
    const { stdout } = useStdout();
    const lastClickRef = useRef<{ t: number; row: number; col: number } | null>(null);

    useEffect(() => {
        if (!enabled || !stdin || !stdout) return;

        // 1003 = any-motion, 1006 = SGR encoding
        const ENABLE = "\x1b[?1000h\x1b[?1006h";
        const DISABLE = "\x1b[?1000l\x1b[?1006l";

        stdout.write(ENABLE);
        setRawMode?.(true);

        const onData = (chunk: Buffer | string) => {
            const str = typeof chunk === "string" ? chunk : chunk.toString("utf8");
            SGR_MOUSE_RE.lastIndex = 0;
            let m: RegExpExecArray | null;
            while ((m = SGR_MOUSE_RE.exec(str)) !== null) {
                const btn = parseInt(m[1]!, 10);
                const x = parseInt(m[2]!, 10) - 1;
                const y = parseInt(m[3]!, 10) - 1;
                const isPress = m[4] === "M";

                // Scroll wheel: button 64 = up, 65 = down (SGR encoding)
                if (btn === 64 && isPress) { onScroll?.(-3); continue; }
                if (btn === 65 && isPress) { onScroll?.(3); continue; }

                // Left click release fires `m` with btn 0; press fires `M` with btn 0.
                // We use release as the click trigger.
                if (btn === 0 && !isPress) {
                    const now = Date.now();
                    const last = lastClickRef.current;
                    if (last && now - last.t < 350 && last.row === y && last.col === x) {
                        lastClickRef.current = null;
                        onDoubleClick?.({ row: y, col: x });
                    } else {
                        lastClickRef.current = { t: now, row: y, col: x };
                        onClick?.({ row: y, col: x });
                    }
                }
            }
        };

        stdin.on("data", onData);

        return () => {
            stdin.off("data", onData);
            stdout.write(DISABLE);
        };
    }, [enabled, stdin, stdout, setRawMode, onClick, onDoubleClick, onScroll]);
};
