
export const useStringDisplay = (
    fullValue: string,
    depth: number
) => {
    const max = depth == 0 ? 100 : 20;
    const addChar = fullValue.length > max ? '…' : '';
    const enablePopover = depth == 0 && (((fullValue.length > 40) || fullValue?.includes("\n")));
    const shortValue = fullValue.slice(0, max) + addChar;
    return {
        shortValue,
        fullValue,
        enablePopover
    };
};
