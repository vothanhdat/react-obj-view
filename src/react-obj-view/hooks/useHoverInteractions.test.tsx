import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoverInteractions } from './useHoverInteractions';
import type { FlattenNodeWrapper } from '../../libs/react-tree-view';
import type { ObjectWalkingAdater } from '../../object-tree';
import type { ObjectWalkingMetaParser } from '../../object-tree/types';

describe('useHoverInteractions', () => {
    let mockGetNodeByIndex: ReturnType<typeof vi.fn>;
    let mockContainer: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        mockContainer = document.createElement('div');
        mockContainer.style.setProperty = vi.fn();
        mockContainer.style.getPropertyValue = vi.fn();

        mockGetNodeByIndex = vi.fn((index: number) => ({
            childCount: 3,
            parentIndex: [0, 1],
        } as unknown as FlattenNodeWrapper<ObjectWalkingAdater, ObjectWalkingMetaParser>));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should initialize with container ref', () => {
        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        expect(result.current.containerRef).toBeDefined();
        expect(result.current.onMouseEnter).toBeInstanceOf(Function);
        expect(result.current.onMouseLeave).toBeInstanceOf(Function);
    });

    it('should set CSS properties on mouse enter', () => {
        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        // Set the container ref
        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseEnter(5);
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-index', '5');
        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-parent', '1');
    });

    it('should handle nodes with childCount > 1', () => {
        mockGetNodeByIndex.mockReturnValue({
            childCount: 5,
            parentIndex: [0, 1, 2],
        } as unknown as FlattenNodeWrapper<ObjectWalkingAdater, ObjectWalkingMetaParser>);

        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseEnter(3);
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-index', '3');
        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-parent', '2');
    });

    it('should handle nodes with childCount <= 1', () => {
        mockGetNodeByIndex.mockReturnValue({
            childCount: 1,
            parentIndex: [0, 1, 2],
        } as unknown as FlattenNodeWrapper<ObjectWalkingAdater, ObjectWalkingMetaParser>);

        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseEnter(3);
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-index', '3');
        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-parent', '1');
    });

    it('should debounce mouse leave events', async () => {
        (mockContainer.style.getPropertyValue as any).mockReturnValue('5');

        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseLeave(5);
        });

        // Should not clear immediately
        expect(mockContainer.style.setProperty).not.toHaveBeenCalled();

        // Fast-forward past the debounce delay
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-index', '-1');
        expect(mockContainer.style.setProperty).toHaveBeenCalledWith('--active-parent', '-1');
    });

    it('should not clear properties if index does not match', async () => {
        (mockContainer.style.getPropertyValue as any).mockReturnValue('3');

        const { result } = renderHook(() => useHoverInteractions(10, mockGetNodeByIndex));

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseLeave(5);
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Should not clear because current index (3) doesn't match leave index (5)
        expect(mockContainer.style.setProperty).not.toHaveBeenCalledWith('--active-index', '-1');
    });

    it('should handle index out of bounds gracefully', () => {
        const { result } = renderHook(() => useHoverInteractions(5, mockGetNodeByIndex));

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseEnter(10); // Index > childCount
        });

        // Should not call setProperty when index is out of bounds
        expect(mockContainer.style.setProperty).not.toHaveBeenCalled();
    });

    it('should update when getNodeByIndex changes', () => {
        const { result, rerender } = renderHook(
            ({ childCount, getNodeByIndex }) => useHoverInteractions(childCount, getNodeByIndex),
            {
                initialProps: {
                    childCount: 10,
                    getNodeByIndex: mockGetNodeByIndex,
                },
            }
        );

        const newGetNodeByIndex = vi.fn((index: number) => ({
            childCount: 2,
            parentIndex: [0, 5],
        } as unknown as FlattenNodeWrapper<ObjectWalkingAdater, ObjectWalkingMetaParser>));

        rerender({ childCount: 15, getNodeByIndex: newGetNodeByIndex });

        act(() => {
            if (result.current.containerRef) {
                (result.current.containerRef as any).current = mockContainer;
            }
        });

        act(() => {
            result.current.onMouseEnter(8);
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(newGetNodeByIndex).toHaveBeenCalledWith(8);
    });
});
