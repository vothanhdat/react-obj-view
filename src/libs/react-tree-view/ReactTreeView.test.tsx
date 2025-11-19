import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactTreeView } from './ReactTreeView';
import { VirtualScroller } from '../virtual-scroller';

// Mock VirtualScroller since we are testing ReactTreeView
vi.mock('../virtual-scroller', () => ({
    VirtualScroller: vi.fn(() => <div data-testid="virtual-scroller" />),
}));

describe('ReactTreeView', () => {
    it('should render VirtualScroller with correct props', () => {
        const props = {
            childCount: 10,
            lineHeight: 20,
            containerDivProps: { className: 'container' },
            otherProp: 'test',
        } as any;

        render(<ReactTreeView {...props} />);

        expect(screen.getByTestId('virtual-scroller')).toBeInTheDocument();
        expect(VirtualScroller).toHaveBeenCalledWith(
            expect.objectContaining({
                height: 200, // 10 * 20
                otherProp: 'test',
            }),
            undefined
        );
    });

    it('should render container div with provided props', () => {
        const props = {
            childCount: 10,
            lineHeight: 20,
            containerDivProps: { className: 'test-container', id: 'tree-root' },
        } as any;

        const { container } = render(<ReactTreeView {...props} />);

        const div = container.firstChild as HTMLElement;
        expect(div).toHaveClass('test-container');
        expect(div).toHaveAttribute('id', 'tree-root');
    });
});
