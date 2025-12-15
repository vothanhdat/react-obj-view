import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { InferWalkingType } from "../libs/tree-core";
import { ObjectWalkingAdater } from "../object-tree";
import { LoadingSimple } from "./LoadingSimple";

export const SearchComponent: React.FC<{
    handleSearch: (
        searchTerm: string,
        onResult: (paths: InferWalkingType<ObjectWalkingAdater>['Key'][][]) => void,
        options: {
            iterateSize?: number;
            maxDepth?: number;
            fullSearch?: boolean;
            normalizeSymbol?: (e: string) => string;
        }
    ) => void;
    scrollToPaths: (
        paths: InferWalkingType<ObjectWalkingAdater>['Key'][]
    ) => Promise<void>;
    active: boolean;
    onClose: () => void;

}> = ({ handleSearch, scrollToPaths, active = true, onClose }) => {


    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(0)

    const deferSearchTerm = useDeferredValue(active ? searchTerm : "")

    const [results, setSearchResults] = useState({
        searchTerm: "",
        results: [] as any[][],
        currentIndex: 0,
    })

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
                {
                    fullSearch: true
                },
            )
            setLoading((l) => Math.max(l - 1, 0));
        })();


    }, [deferSearchTerm, handleSearch, scrollToPaths])


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

    return <div style={{
        position: "absolute",
        top: active ? "0.5em" : "-2em",
        transition: "top 0.4s",
        right: "0.5em",
        zIndex: 101,
    }}>
        <div style={{
            backgroundColor: "var(--bigobjview-bg-color)",
            outline: "solid 1px",
            borderRadius: "5px",
            width: "12em",
            display: "flex",
            alignItems: "center",
            padding: "0.2em",
            height: "1.3em"
        }}>
            <small style={{
                fontSize: "0.7em",
                transition: 'opacity 0.4s',
                opacity: loading > 0 ? 0.7 : 0,
                height: "1em", lineHeight: 1,
                paddingInlineStart: "0.2em"
            }}>
                <LoadingSimple active={true} />
            </small>
            <input value={searchTerm}
                placeholder="Type to search ..."
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                    console.log(e.key)
                    if (e.key == "Enter") {
                        if (e.shiftKey) prev()
                        else next()
                    } else if (e.key == "Escape") {
                        setSearchTerm("");
                        onClose?.();
                    }
                }}
                style={{
                    border: "none", outline: "none", flex: 1, width: "50px",
                    background: "none"
                }} />


            <small style={{ opacity: 0.5, fontSize: "0.7em", fontFamily: "monospace", whiteSpace: "pre" }}>
                {" "}{Math.min(results.currentIndex + 1, results.results.length)}/{results.results.length}{" "}
            </small>
            <button onClick={prev} style={{ border: "none", outline: "none", fontFamily: "monospace" }}>
                {"<"}
            </button>
            <button onClick={next} style={{ border: "none", outline: "none", fontFamily: "monospace" }}>
                {">"}
            </button>
            {onClose && <button onClick={onClose} style={{ border: "none", outline: "none", fontFamily: "monospace" }}>
                {"x"}
            </button>}
        </div>
    </div>;
};


