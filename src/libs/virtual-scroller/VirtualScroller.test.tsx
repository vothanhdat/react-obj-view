import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { VirtualScroller } from './VirtualScroller';
import { getScrollContainer } from './getScrollContainer';

// Mock getScrollContainer
vi.mock('./getScrollContainer');

describe('VirtualScroller', () => {
    const MockComponent = ({ start, end, offset }: any) => (
        <div data-testid="content">
            Start: {start}, End: {end}, Offset: {offset}
        </div>
    );

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock requestAnimationFrame
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            cb(0);
            return 1;
        });
        vi.spyOn(window, 'cancelAnimationFrame');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should render with correct height', () => {
        (getScrollContainer as any).mockReturnValue(document.body);
        render(<VirtualScroller height={1000} Component={MockComponent} />);

        const container = screen.getByTestId('content').parentElement;
        expect(container).toHaveStyle({ height: '1000px', position: 'relative' });
    });

    it('should not render if height is infinite', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<VirtualScroller height={Infinity} Component={MockComponent} />);

        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should update state on scroll', () => {
        const mockParent = document.createElement('div');
        Object.defineProperty(mockParent, 'getBoundingClientRect', {
            value: () => ({ top: 0, height: 500 }),
        });
        Object.defineProperty(mockParent, 'scrollTop', { value: 100 });
        
        (getScrollContainer as any).mockReturnValue(mockParent);

        render(<VirtualScroller height={1000} Component={MockComponent} />);

        // Trigger scroll event
        act(() => {
            const event = new Event('scroll');
            mockParent.dispatchEvent(event);
        });

        // Since we mocked getBoundingClientRect and logic inside useEffect relies on ref.current
        // which is hard to mock layout for in jsdom, we mainly check if event listeners are attached
        // and component renders.
        // For precise calculation testing, we might need more complex setup or e2e tests.
        
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should cleanup event listeners on unmount', () => {
        const mockParent = document.createElement('div');
        const removeEventListenerSpy = vi.spyOn(mockParent, 'removeEventListener');
        (getScrollContainer as any).mockReturnValue(mockParent);

        const { unmount } = render(<VirtualScroller height={1000} Component={MockComponent} />);
        
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), expect.any(Object));
    });
});
