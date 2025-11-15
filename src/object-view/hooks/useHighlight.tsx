import React, { useContext, useMemo } from "react";

export function useHighlight(filterString: string) {
    const highlight = useMemo(
        () => buildRegex(filterString
            .toLowerCase()
            .split(" "), 'gi'),
        [filterString]
    );
    return { highlight };
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(words: string[], flags = 'gi') {
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

export const HightlightWrapper: React.FC<{ highlight: string, children: any }> = ({ children, highlight }) => {
    return <highlightCtx.Provider value={useHighlight(highlight)}>
        {children}
    </highlightCtx.Provider>
}

export const HighlightString: React.FC<{ text: string; }> = ({ text }) => {
    const { highlight } = useContext(highlightCtx)

    const render = useMemo(
        () => highlight ? markByToken(text, highlight) : text,
        [text, highlight]
    );

    return <>{render}</>;

};
