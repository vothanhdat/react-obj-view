import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualScrollRender } from './VirtualScrollRender';
import { useRednerIndexesWithSticky } from './useRednerIndexesWithSticky';

// Mock dependencies
vi.mock('./useRednerIndexesWithSticky');
vi.mock('./VirtualScrollRowRender', () => ({
    VirtualScrollRowRender: vi.fn(() => <div data-testid="row-render" />),
}));

describe('VirtualScrollRender', () => {
    const mockProps = {
        start: 0,
        end: 10,
        offset: 0,
        childCount: 100,
        RowRenderer: vi.fn(),
        lineHeight: 20,
        options: {},
        rowDivProps: { className: 'row' },
        computeItemKey: (index: number) => `key-${index}`,
        getNodeByIndex: vi.fn(),
        refreshPath: vi.fn(),
        toggleChildExpand: vi.fn(),
        stickyPathHeaders: true,
        showLineNumbers: true,
    } as any;

    it('should render rows based on calculated indexes', () => {
        (useRednerIndexesWithSticky as any).mockReturnValue([
            { isStick: false, index: 0, isLastStick: false, position: 0 },
            { isStick: false, index: 1, isLastStick: false, position: 1 },
        ]);

        render(<VirtualScrollRender {...mockProps} />);

        const rows = screen.getAllByTestId('row-render');
        expect(rows).toHaveLength(2);
    });

    it('should apply sticky styles correctly', () => {
        (useRednerIndexesWithSticky as any).mockReturnValue([
            { isStick: true, index: 0, isLastStick: true, position: 0 },
        ]);

        const { container } = render(<VirtualScrollRender {...mockProps} />);
        const rowDiv = container.firstChild as HTMLElement;

        expect(rowDiv).toHaveStyle({
            position: 'sticky',
            top: '0px',
            height: '20px',
            zIndex: '100',
        });
    });

    it('should apply absolute styles for non-sticky rows', () => {
        (useRednerIndexesWithSticky as any).mockReturnValue([
            { isStick: false, index: 5, isLastStick: false, position: 5 },
        ]);

        const { container } = render(<VirtualScrollRender {...mockProps} />);
        const rowDiv = container.firstChild as HTMLElement;

        expect(rowDiv).toHaveStyle({
            position: 'absolute',
            top: '100px', // 5 * 20
            height: '20px',
        });
    });

    it('should render line numbers when enabled', () => {
        (useRednerIndexesWithSticky as any).mockReturnValue([
            { isStick: false, index: 5, isLastStick: false, position: 5 },
        ]);

        render(<VirtualScrollRender {...mockProps} showLineNumbers={true} />);

        expect(screen.getByText(/5:/)).toBeInTheDocument();
    });

    it('should not render line numbers when disabled', () => {
        (useRednerIndexesWithSticky as any).mockReturnValue([
            { isStick: false, index: 5, isLastStick: false, position: 5 },
        ]);

        render(<VirtualScrollRender {...mockProps} showLineNumbers={false} />);

        expect(screen.queryByText(/5:/)).not.toBeInTheDocument();
    });
});
