/** Public IPTVnator stream relay used to proxy provider URLs for external players. */
export const STREAM_RELAY_PROXY_BASE_URL =
    'https://relay.2410241.xyz/proxy';

/**
 * Builds the relay URL that forwards playback through {@link STREAM_RELAY_PROXY_BASE_URL}.
 * Returns null when the stream URL is empty or not a valid absolute URL.
 */
export function buildStreamRelayUrl(streamUrl: string): string | null {
    const trimmed = streamUrl.trim();
    if (!trimmed) {
        return null;
    }

    try {
        new URL(trimmed);
    } catch {
        return null;
    }

    return `${STREAM_RELAY_PROXY_BASE_URL}?url=${encodeURIComponent(trimmed)}`;
}
