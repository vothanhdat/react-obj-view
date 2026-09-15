import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_RESOLVER } from '../../object-tree/resolver';
import { RenderOptions } from '../types';
import { RenderPreview } from './RenderPreview';

const previewOptions: RenderOptions = {
    enablePreview: true,
    highlightUpdate: false,
    resolver: DEFAULT_RESOLVER,
    showLineNumbers: false,
    includeSymbols: false,
    nonEnumerable: false,
    onMouseEnter: () => {},
    onMouseLeave: () => {},
};

describe('RenderPreview', () => {
    it.each([false, true])('renders getter failures with nonEnumerable=%s', nonEnumerable => {
        const value = {
            get dangerous() { throw new Error('getter failed'); },
            after: 'still visible',
        };
        const options = { ...previewOptions, nonEnumerable };

        const markup = renderToStaticMarkup(
            <RenderPreview valueWrapper={() => value} options={options} />
        );

        expect(markup).toContain('dangerous');
        expect(markup).toContain('getter failed');
        expect(markup).toContain('still visible');
    });

    it.each(['Map', 'Set'])('limits a large %s preview to six entries', kind => {
        const entries = Array.from({ length: 1000 }, (_, index) => `entry-${index}`);
        const value = kind === 'Map'
            ? new Map(entries.map((entry, index) => [index, entry]))
            : new Set(entries);

        const markup = renderToStaticMarkup(
            <RenderPreview valueWrapper={() => value} options={previewOptions} />
        );

        expect(markup.match(/entry-\d+/g)).toEqual(entries.slice(0, 6));
        expect(markup).toContain('…');
    });
});
