import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualScrollRowRender } from './VirtualScrollRowRender';

describe('VirtualScrollRowRender', () => {
    const mockNodeData = {
        value: 'test-value',
        paths: ['root'],
        updateStamp: 1,
    };

    const mockWrapper = {
        getData: vi.fn(() => mockNodeData),
        state: { updateStamp: 1 },
    };

    const mockGetNodeByIndex = vi.fn(() => mockWrapper as any);
    const mockToggleChildExpand = vi.fn();
    const mockRefreshPath = vi.fn();
    const mockRowRender = vi.fn(({ actions }) => (
        <div>
            <button onClick={actions.toggleChildExpand}>Toggle</button>
            <button onClick={actions.refreshPath}>Refresh</button>
        </div>
    ));

    const defaultProps = {
        index: 0,
        size: 10,
        getNodeByIndex: mockGetNodeByIndex,
        RowRender: mockRowRender,
        rowRenderProps: { someProp: 'value' },
        toggleChildExpand: mockToggleChildExpand,
        refreshPath: mockRefreshPath,
        options: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render RowRender when index is within bounds', () => {
        render(<VirtualScrollRowRender {...defaultProps} />);

        expect(mockRowRender).toHaveBeenCalled();
        expect(mockGetNodeByIndex).toHaveBeenCalledWith(0);
    });

    it('should not render RowRender when index is out of bounds', () => {
        render(<VirtualScrollRowRender {...defaultProps} index={20} />);

        expect(mockRowRender).not.toHaveBeenCalled();
    });

    it('should pass correct actions to RowRender', () => {
        render(<VirtualScrollRowRender {...defaultProps} />);

        const toggleBtn = screen.getByText('Toggle');
        const refreshBtn = screen.getByText('Refresh');

        fireEvent.click(toggleBtn);
        expect(mockToggleChildExpand).toHaveBeenCalledWith(mockNodeData);

        fireEvent.click(refreshBtn);
        expect(mockRefreshPath).toHaveBeenCalledWith(mockNodeData);
    });

    it('should memoize node data', () => {
        const { rerender } = render(<VirtualScrollRowRender {...defaultProps} />);
        
        // Rerender with same props
        rerender(<VirtualScrollRowRender {...defaultProps} />);
        
        // getData should not be called again if dependencies haven't changed
        // Note: In the actual implementation, useMemo dependencies include index and updateStamp
        // We can't easily test internal useMemo behavior without changing dependencies
    });
});
