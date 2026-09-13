import {
    STREAM_RELAY_PROXY_BASE_URL,
    buildStreamRelayUrl,
} from './stream-relay.util';

describe('stream-relay.util', () => {
    it('builds a relay URL with an encoded stream parameter', () => {
        const streamUrl = 'https://example.com/live/stream.m3u8?token=abc';
        expect(buildStreamRelayUrl(streamUrl)).toBe(
            `${STREAM_RELAY_PROXY_BASE_URL}?url=${encodeURIComponent(streamUrl)}`
        );
    });

    it('returns null for empty or invalid stream URLs', () => {
        expect(buildStreamRelayUrl('')).toBeNull();
        expect(buildStreamRelayUrl('   ')).toBeNull();
        expect(buildStreamRelayUrl('not a url')).toBeNull();
    });
});
