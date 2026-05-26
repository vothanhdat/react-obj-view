import { LazyValue, InternalPromise } from "../../object-tree";
import { NON_CIRCULAR_BIT } from "../../object-tree/meta" with { type: "macro" };
import { scheduleIdle } from "../../utils/scheduleIdle";
import { RenderOptions, SearchOptionBase } from "../types";

export type SearchFilterFn = (value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean;

export type TravelAndSearchFn = (
    cb: (value: any, key: any, paths: any[]) => boolean | void,
    iterateSize?: number,
    maxDepth?: number,
    fullSearch?: boolean,
    fullSearchShouldIterate?: (value: any, key: any, meta: number, ctx: any) => boolean,
) => Iterable<unknown>;

export type CreateSearchHandlerParams = {
    travelAndSearch: TravelAndSearchFn;
    setSearch: (next: RenderOptions["search"]) => void;
    onResetMark?: () => void;
};

const EMPTY_SEARCH: NonNullable<RenderOptions["search"]> = Object.freeze({
    markTerm: undefined,
    filterFn: undefined,
}) as any;

export const createSearchHandler = ({
    travelAndSearch,
    setSearch,
    onResetMark,
}: CreateSearchHandlerParams) => {

    let currentFilterFn: SearchFilterFn | undefined;

    const search = async (
        filterFn?: SearchFilterFn,
        markTerm?: string | RegExp,
        onResult: (results: PropertyKey[][]) => void = () => { },
        options: SearchOptionBase = {},
    ): Promise<void> => {

        currentFilterFn = filterFn;

        setSearch(filterFn ? { markTerm, filterFn } : EMPTY_SEARCH);

        onResetMark?.();

        if (!filterFn) return;

        let searchResults: PropertyKey[][] = [];
        let counter = 0;
        const MAX_RESULT = options?.maxResult ?? 99999;

        for (const _ of travelAndSearch(
            (value, key, path) => {
                if (filterFn(value, key, path)) {
                    searchResults.push([...path]);
                    counter++;
                    return counter >= MAX_RESULT;
                }
            },
            options?.iterateSize,
            options?.maxDepth,
            options?.fullSearch,
            (value, key, meta) => {
                return typeof value === "object"
                    && (meta & NON_CIRCULAR_BIT) === NON_CIRCULAR_BIT
                    && key !== "[[Prototype]]"
                    && key !== "[[buffer]]"
                    && key !== "[[data]]"
                    && !(value instanceof LazyValue)
                    && !(value instanceof InternalPromise);
            },
        )) {

            onResult(searchResults);
            searchResults = [];

            await new Promise<void>(r => scheduleIdle(r));

            if (currentFilterFn !== filterFn) return;
            if (counter >= MAX_RESULT) break;
        }

        onResult(searchResults);
    };

    return { search };
};
