import {
    buildAndroidMpvIntentUrl,
    buildDesktopMpvProtocolUrl,
    buildExternalMpvLaunchHref,
    canOpenViaMpvProtocol,
    dispatchMpvProtocolUrl,
    isAndroidUserAgent,
    isIosUserAgent,
    MPV_ANDROID_PACKAGE,
    MPV_ANDROID_PLAY_STORE_URL,
} from './mpv-protocol.util';

describe('mpv-protocol.util', () => {
    const streamUrl = 'https://cdn.example.com/live/news.ts?token=abc';

    it('accepts only http(s) stream URLs', () => {
        expect(canOpenViaMpvProtocol(streamUrl)).toBe(true);
        expect(canOpenViaMpvProtocol('http://example.com/a.m3u8')).toBe(true);
        expect(canOpenViaMpvProtocol('rtmp://example.com/live')).toBe(false);
        expect(canOpenViaMpvProtocol('not a url')).toBe(false);
    });

    it('detects Android and iOS user agents', () => {
        expect(
            isAndroidUserAgent(
                'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0'
            )
        ).toBe(true);
        expect(
            isIosUserAgent(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
            )
        ).toBe(true);
        expect(
            isAndroidUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
            )
        ).toBe(false);
    });

    it('percent-encodes the nested stream for desktop mpv://', () => {
        expect(buildDesktopMpvProtocolUrl(streamUrl)).toBe(
            `mpv://${encodeURIComponent(streamUrl)}`
        );
    });

    it('builds an mpv-android intent with video/any for extension-less URLs', () => {
        const href = buildAndroidMpvIntentUrl(
            'https://cdn.example.com/live/123',
            'News'
        );

        expect(href.startsWith('intent://cdn.example.com/live/123#Intent;')).toBe(
            true
        );
        expect(href).toContain('scheme=https');
        expect(href).toContain('type=video/any');
        expect(href).toContain(`package=${MPV_ANDROID_PACKAGE}`);
        expect(href).toContain('S.title=News');
        expect(href).toContain(
            `S.browser_fallback_url=${encodeURIComponent(MPV_ANDROID_PLAY_STORE_URL)}`
        );
    });

    it('keeps query tokens in the Android intent path', () => {
        const href = buildAndroidMpvIntentUrl(streamUrl);
        expect(href).toContain(
            'intent://cdn.example.com/live/news.ts?token=abc#Intent;'
        );
    });

    it('selects intent URLs on Android and mpv:// elsewhere', () => {
        expect(
            buildExternalMpvLaunchHref(
                streamUrl,
                'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0',
                'News'
            )
        ).toContain('package=is.xyz.mpv');
        expect(
            buildExternalMpvLaunchHref(
                streamUrl,
                'Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0'
            )
        ).toBe(`mpv://${encodeURIComponent(streamUrl)}`);
        expect(
            buildExternalMpvLaunchHref(
                streamUrl,
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
            )
        ).toBeNull();
    });

    it('dispatches by clicking a temporary anchor', () => {
        const click = jest.fn();
        const remove = jest.fn();
        const anchor = {
            href: '',
            rel: '',
            style: { display: '' },
            click,
            remove,
        };
        const doc = {
            createElement: jest.fn(() => anchor),
            body: { appendChild: jest.fn() },
        };

        dispatchMpvProtocolUrl('mpv://https%3A%2F%2Fexample.com%2Fa.ts', doc);

        expect(doc.createElement).toHaveBeenCalledWith('a');
        expect(anchor.href).toBe('mpv://https%3A%2F%2Fexample.com%2Fa.ts');
        expect(anchor.rel).toBe('noopener noreferrer');
        expect(doc.body.appendChild).toHaveBeenCalledWith(anchor);
        expect(click).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledTimes(1);
    });
});
