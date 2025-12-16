import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { InferWalkingType } from "../../libs/tree-core";
import { ObjectWalkingAdater } from "../../object-tree";
import { LoadingSimple } from "../LoadingSimple";
import { joinClasses } from "../../utils/joinClasses";
import "./search.css"
import { ObjectViewHandle, SearchOptions } from "../types";


export type SearchComponentProps = {
    handleSearch: ObjectViewHandle['search']
    scrollToPaths: ObjectViewHandle['scrollToPaths']
    active: boolean;
    onClose: () => void;
    options?: SearchOptions,
    className?: string,
    containerDivProps?: React.HTMLAttributes<HTMLDivElement>
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
    onClose
}) => {


    const [searchTermRaw, setSearchTerm] = useState("")
    const searchTerm = useDebounceValue(searchTermRaw)
    const deferSearchTerm = useDeferredValue(active ? searchTerm : "")
    const [loading, setLoading] = useState(0)
    const [results, setSearchResults] = useState({
        searchTerm: "",
        results: [] as any[][],
        currentIndex: 0,
    })
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {

        setSearchResults({
            searchTerm: deferSearchTerm,
            currentIndex: 0,
            results: []
        });

        (async () => {
            setLoading((l) => l + 1);
            await handleSearch?.(
                deferSearchTerm,
                (results: any[][]) => {
                    setSearchResults(e => e.searchTerm === deferSearchTerm
                        ? ({
                            ...e,
                            results: [...e.results, ...results]
                        }) : e)
                },
                options,
            )
            setLoading((l) => Math.max(l - 1, 0));
        })();


    }, [deferSearchTerm, handleSearch, scrollToPaths, options])


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

    return <div {...containerDivProps} className={joinClasses("big-objview-search", active && "active", className)}>
        <div className="search-box">
            <small className="loading-indicator" style={{ opacity: loading > 0 ? 0.7 : 0, }}  >
                <LoadingSimple active={true} />
            </small>
            <input
                ref={inputRef}
                className="input"
                value={searchTermRaw}
                placeholder="Type to search ..."
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                    if (e.key == "Enter") {
                        if (e.shiftKey) prev()
                        else next()
                    } else if (e.key == "Escape") {
                        setSearchTerm("");
                        onClose?.();
                    }
                }}
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


