import React, { RefObject, useEffect, useImperativeHandle } from "react";
import { LoadingSimple } from "../LoadingSimple";
import { joinClasses } from "../../utils/joinClasses";
import { UseSearchParam, useObjectViewSearch } from "./useObjectViewSearch";
import "./search.css"


export type SearchComponentHandler = {
    focus: () => void
}


export type SearchComponentProps = UseSearchParam & {
    onClose: () => void;
    className?: string,
    containerDivProps?: React.HTMLAttributes<HTMLDivElement>
    ref?: RefObject<SearchComponentHandler | undefined>
}

export const SearchComponent: React.FC<SearchComponentProps> = (props) => {

    const { active, onClose, containerDivProps, ref, className } = props

    const {
        inputRef,
        searching,
        next, prev,
        results,
        searchTerm,
        setSearchTerm
    } = useObjectViewSearch(props)

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
            <small className="loading-indicator" style={{ opacity: searching ? 0.7 : 0, }}  >
                <LoadingSimple active={searching} />
            </small>
            <input
                ref={inputRef}
                className="input"
                value={searchTerm}
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


