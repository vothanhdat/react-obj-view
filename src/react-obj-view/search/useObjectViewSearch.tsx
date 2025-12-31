import { useState, useEffect, useDeferredValue, useRef, useMemo, useCallback } from "react";
import { buildRegex } from "../hooks/useHighlight";
import { ObjectViewHandle, SearchOptions } from "../types";



export type UseSearchParam = {
    handleSearch?: ObjectViewHandle['search'];
    scrollToPaths?: ObjectViewHandle['scrollToPaths'];
    active: boolean;
    options?: SearchOptions;
};

export const useDebounceValue = <T,>(value: T, debounce = 100): T => {
    let [debounceValue, setValue] = useState<T>(() => value);

    useEffect(() => {
        let t = setTimeout(() => setValue(value), debounce);
        return () => clearTimeout(t);
    }, [value, debounce]);

    return debounceValue;
};

export const useObjectViewSearch = ({
    handleSearch, scrollToPaths, options, active = true,
}: UseSearchParam) => {

    const [searchTerm, setSearchTerm] = useState("");
    const deboucedSearchTerm = useDebounceValue(searchTerm);
    const deferSearchTerm = useDeferredValue(active ? deboucedSearchTerm : "");
    const [searchTaskCounter, setSearching] = useState(0);
    const [results, setSearchResults] = useState({
        filterFn: undefined as any,
        results: [] as any[][],
        currentIndex: 0,
    });

    const inputRef = useRef<HTMLInputElement | null>(null);

    const searchTermNomalize = useMemo(
        () => {
            let searchTermNomalize = deferSearchTerm.toLowerCase();

            if (typeof options?.normalizeSymbol == 'function') {
                searchTermNomalize = options.normalizeSymbol(searchTermNomalize);
            }
            return searchTermNomalize;
        },
        [deferSearchTerm, options?.normalizeSymbol]
    );

    const { filterFn, markTerm } = useMemo(
        () => {

            let tokens = searchTermNomalize
                .split(" ")
                .filter(Boolean);

            const hasTokens = tokens.length > 0;

            const filterFn = hasTokens
                ? (value: any, key: any, paths: any[]) => {
                    try {
                        let str = String(key);

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
                            str = [...str].map((options?.normalizeSymbol)!).join("");
                        }


                        let prevIndex = 0;

                        for (let token of tokens) {
                            prevIndex = str.indexOf(token, prevIndex);
                            if (prevIndex < 0)
                                return false;
                            prevIndex += token.length;
                        }

                        return prevIndex > -1;

                    } catch (error) {
                        return false;
                    }

                }
                : undefined;

            return {
                filterFn,
                markTerm: hasTokens ? buildRegex(tokens) : undefined
            };

        },
        [searchTermNomalize, options?.normalizeSymbol]
    );

    // console.log({ filterFn, markTerm })
    useEffect(() => {

        setSearchResults({ filterFn, currentIndex: 0, results: [] });

        (async () => {
            setSearching((l) => l + 1);

            await handleSearch?.(
                filterFn,
                markTerm,
                (results: any[][]) => {
                    setSearchResults(e => e.filterFn === filterFn
                        ? ({
                            ...e,
                            results: [...e.results, ...results]
                        }) : e);
                },
                options
            );

            setSearching((l) => Math.max(l - 1, 0));
        })();


    }, [filterFn, markTerm, handleSearch, options]);


    let currentPositionPaths = useMemo(
        () => results.results[results.currentIndex],
        [results.results, results.currentIndex]
    );

    let prev = useCallback(() => setSearchResults(r => ({
        ...r,
        currentIndex: r.results.length
            ? (r.currentIndex + r.results.length - 1) % r.results.length
            : 0
    })), []);

    let next = useCallback(() => setSearchResults(r => ({
        ...r,
        currentIndex: r.results.length
            ? (r.currentIndex + 1) % r.results.length
            : 0
    })), []);


    useEffect(() => {
        if (currentPositionPaths) {
            scrollToPaths?.(currentPositionPaths);
        }
    }, [scrollToPaths, currentPositionPaths]);


    return {
        inputRef,
        setSearchTerm,
        searchTerm,
        results,
        prev, next,
        searching: searchTaskCounter > 0
    };

};
