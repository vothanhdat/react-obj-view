import React, { useContext, useMemo } from "react";

export function useHighlight(highlightTerm: string | RegExp | undefined) {
    const highlight = useMemo(
        () => highlightTerm
            && typeof highlightTerm == 'string' ? buildRegex(highlightTerm.toLowerCase().split(" "), 'gi')
            : highlightTerm instanceof RegExp ? highlightTerm
                : undefined,
        [highlightTerm]
    );
    return { highlight };
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildRegex(words: string[], flags = 'gi') {
    const pattern = words.map(escapeRegex).join('|');
    return new RegExp(`(${pattern})`, flags);
}

function markByToken(text: string, regex: RegExp) {
    const result = [];
    let last = 0;
    for (const match of text.matchAll(regex)) {
        const [m] = match;
        const start = match.index;
        if (start > last) result.push(text.slice(last, start));
        result.push(<mark key={start}>{m}</mark>);
        last = start + m.length;
    }
    if (last < text.length) result.push(text.slice(last));
    return result;
}

const highlightCtx = React.createContext<{ highlight?: RegExp }>({
    highlight: undefined
})

const HighLightInternal: React.FC<{ text: string }> = ({ text }) => {
    const { highlight } = useContext(highlightCtx)

    const render = useMemo(
        () => (highlight) ? markByToken(text, highlight) : text,
        [text, highlight]
    );

    return <>{render}</>;

};

export const HightlightWrapper: React.FC<{ highlight: string | RegExp | undefined, children: any }> = ({ children, highlight }) => {
    return <highlightCtx.Provider value={useHighlight(highlight)}>
        {children}
    </highlightCtx.Provider>
}

export const HighlightString: React.FC<{ text: string; enable?: boolean }> = ({ text, enable = true }) => {
    return enable
        ? <HighLightInternal text={text} />
        : text
};
