import React, { RefObject, useCallback, useDeferredValue, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { LoadingSimple } from "../LoadingSimple";
import { joinClasses } from "../../utils/joinClasses";
import { ObjectViewHandle, SearchOptions } from "../types";
import { buildRegex } from "../hooks/useHighlight";
import "./search.css"


export type SearchComponentHandler = {
    focus: () => void
}

export type SearchComponentProps = {
    handleSearch: ObjectViewHandle['search']
    scrollToPaths: ObjectViewHandle['scrollToPaths']
    active: boolean;
    onClose: () => void;
    options?: SearchOptions,
    className?: string,
    containerDivProps?: React.HTMLAttributes<HTMLDivElement>
    ref?: RefObject<SearchComponentHandler | undefined>
}

export const useDebounceValue = <T,>(value: T, debounce = 100): T => {
    let [debounceValue, setValue] = useState<T>(() => value);

    useEffect(() => {
        let t = setTimeout(() => setValue(value), debounce)
        return () => clearTimeout(t);
    }, [value, debounce])

    return debounceValue
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
    handleSearch, scrollToPaths,
    className,
    containerDivProps,
    options,
    active = true,
    onClose,
    ref
}) => {


    const [searchTermRaw, setSearchTerm] = useState("")
    const searchTerm = useDebounceValue(searchTermRaw)
    const deferSearchTerm = useDeferredValue(active ? searchTerm : "")
    const [loading, setLoading] = useState(0)
    const [results, setSearchResults] = useState({
        filterFn: undefined as any,
        results: [] as any[][],
        currentIndex: 0,
    })

    const inputRef = useRef<HTMLInputElement | null>(null)

    const searchTermNomalize = useMemo(
        () => {
            let searchTermNomalize = deferSearchTerm.toLowerCase();

            if (options?.normalizeSymbol) {
                searchTermNomalize = [...searchTermNomalize].map(options.normalizeSymbol).join("")
            }
            return searchTermNomalize
        },
        [deferSearchTerm, options?.normalizeSymbol]
    )

    const { filterFn, markTerm } = useMemo(
        () => {

            let tokens = searchTermNomalize
                .split(" ")
                .filter(Boolean)

            const filterFn = tokens.length
                ? (value: any, key: any, paths: any[]) => {
                    try {
                        let str = String(key)

                        if (typeof value === 'string'
                            || typeof value === 'number'
                            || typeof value === 'boolean'
                            || typeof value === 'bigint'
                            || (typeof value === 'object' && (
                                value instanceof Date || value instanceof RegExp
                            ))) {
                            str += " " + String(value);
                        }

                        str = str.toLowerCase();

                        if (options?.normalizeSymbol) {
                            str = [...str].map(options?.normalizeSymbol!).join("")
                        }


                        let prevIndex = 0;

                        for (let token of tokens) {
                            prevIndex = str.indexOf(token, prevIndex)
                            if (prevIndex < 0)
                                return false;
                            prevIndex += token.length;
                        }

                        return prevIndex > -1;

                    } catch (error) {
                        return false
                    }

                }
                : undefined

            return {
                filterFn,
                markTerm: buildRegex(tokens)
            }

        },
        [searchTermNomalize, options?.normalizeSymbol]
    )

    // console.log({ filterFn, markTerm })

    useEffect(() => {

        setSearchResults({ filterFn, currentIndex: 0, results: [] });

        (async () => {
            setLoading((l) => l + 1);

            await handleSearch?.(
                filterFn,
                markTerm,
                (results: any[][]) => {
                    setSearchResults(e => e.filterFn === filterFn
                        ? ({
                            ...e,
                            results: [...e.results, ...results]
                        }) : e)
                },
                options,
            );

            setLoading((l) => Math.max(l - 1, 0));
        })();


    }, [filterFn, markTerm, handleSearch, options])


    let currentPositionPaths = useMemo(
        () => results.results[results.currentIndex],
        [results.results, results.currentIndex]
    )

    let prev = useCallback(() => setSearchResults(r => ({
        ...r,
        currentIndex: r.results.length
            ? (r.currentIndex + r.results.length - 1) % r.results.length
            : 0
    })), [])

    let next = useCallback(() => setSearchResults(r => ({
        ...r,
        currentIndex: r.results.length
            ? (r.currentIndex + 1) % r.results.length
            : 0
    })), [])


    useEffect(() => {
        if (currentPositionPaths) {
            scrollToPaths?.(currentPositionPaths)
        }
    }, [currentPositionPaths])

    useEffect(() => {
        if (active) {
            inputRef?.current?.focus()
        }
    }, [active, inputRef])

    useImperativeHandle(ref, () => ({
        focus() { inputRef?.current?.focus() },
    }), [inputRef])

    return <div {...containerDivProps} className={joinClasses("big-objview-search", active && "active", className)}>
        <div
            className="search-box"
            tabIndex={-1}
            onKeyDown={e => {
                if (e.key == "Enter" && !(e.target instanceof HTMLButtonElement)) {
                    if (e.shiftKey) prev()
                    else next();
                    e.preventDefault();
                } else if (e.key == "Escape") {
                    setSearchTerm("");
                    onClose?.();
                    e.preventDefault();
                } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() == "f") {
                    e.preventDefault();
                    inputRef?.current?.select();
                }
            }}>
            <small className="loading-indicator" style={{ opacity: loading > 0 ? 0.7 : 0, }}  >
                <LoadingSimple active={loading > 0} />
            </small>
            <input
                ref={inputRef}
                className="input"
                value={searchTermRaw}
                placeholder="Type to search ..."
                onChange={e => setSearchTerm(e.target.value)}
            />


            <small className="search-cursor">
                {" "}{Math.min(results.currentIndex + 1, results.results.length)}/{results.results.length}{" "}
            </small>
            <button onClick={prev}>
                {"▲"}
            </button>
            <button onClick={next}>
                {"▼"}
            </button>
            {onClose && <button onClick={() => (onClose?.(), setSearchTerm(""))}>
                {"×"}
            </button>}
        </div>
    </div>;
};


