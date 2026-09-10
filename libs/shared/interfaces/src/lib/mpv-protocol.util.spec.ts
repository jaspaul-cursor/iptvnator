import {
    buildMpvProtocolUrl,
    canOpenViaMpvProtocol,
    createMpvProtocolLaunchSession,
    dispatchMpvProtocolUrl,
} from './mpv-protocol.util';

describe('mpv-protocol.util', () => {
    it('accepts http and https stream URLs', () => {
        expect(canOpenViaMpvProtocol('https://example.com/live.m3u8')).toBe(true);
        expect(canOpenViaMpvProtocol('http://127.0.0.1:8080/stream.ts')).toBe(
            true
        );
    });

    it('rejects non-network and invalid URLs', () => {
        expect(canOpenViaMpvProtocol('rtmp://example.com/live')).toBe(false);
        expect(canOpenViaMpvProtocol('file:///tmp/stream.ts')).toBe(false);
        expect(canOpenViaMpvProtocol('not-a-url')).toBe(false);
    });

    it('percent-encodes the nested stream URL', () => {
        expect(
            buildMpvProtocolUrl('https://example.com/live?token=abc&user=1')
        ).toBe(
            'mpv://https%3A%2F%2Fexample.com%2Flive%3Ftoken%3Dabc%26user%3D1'
        );
    });

    it('creates a non-closable protocol launch session', () => {
        const session = createMpvProtocolLaunchSession({
            streamUrl: 'https://example.com/live.m3u8',
            title: 'News',
            isLive: true,
        });

        expect(session.player).toBe('mpv');
        expect(session.status).toBe('opened');
        expect(session.canClose).toBe(false);
        expect(session.streamUrl).toBe('https://example.com/live.m3u8');
    });

    it('dispatches the protocol URL through a temporary anchor', () => {
        const doc = {
            createElement: jest.fn(() => {
                const anchor = {
                    href: '',
                    rel: '',
                    style: { display: '' },
                    click: jest.fn(),
                    remove: jest.fn(),
                };
                return anchor;
            }),
            body: {
                appendChild: jest.fn(),
            },
        };

        dispatchMpvProtocolUrl(
            'mpv://https%3A%2F%2Fexample.com',
            doc as unknown as Pick<Document, 'createElement' | 'body'>
        );

        const anchor = doc.createElement.mock.results[0].value;
        expect(anchor.href).toBe('mpv://https%3A%2F%2Fexample.com');
        expect(anchor.click).toHaveBeenCalled();
        expect(anchor.remove).toHaveBeenCalled();
    });
});
