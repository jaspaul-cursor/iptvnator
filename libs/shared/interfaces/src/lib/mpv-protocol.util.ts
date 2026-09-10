import type { ResolvedPortalPlayback } from './portal-playback.interface';
import type { ExternalPlayerSession } from './external-player-session.interface';

/** mpv accepts only safe network protocols when opened via `mpv://`. */
export function canOpenViaMpvProtocol(streamUrl: string): boolean {
    try {
        const protocol = new URL(streamUrl.trim()).protocol;
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Build an `mpv://` handler URL for the given stream.
 *
 * The stream URL is percent-encoded so browsers do not mangle nested schemes
 * (for example `https//` instead of `https://`).
 */
export function buildMpvProtocolUrl(streamUrl: string): string {
    const trimmed = streamUrl.trim();
    if (!trimmed) {
        throw new Error('Stream URL is required');
    }
    if (!canOpenViaMpvProtocol(trimmed)) {
        throw new Error('Only http(s) stream URLs can be opened via mpv://');
    }

    return `mpv://${encodeURIComponent(trimmed)}`;
}

/** Launch session returned after handing a stream to the OS mpv handler. */
export function createMpvProtocolLaunchSession(
    playback: ResolvedPortalPlayback
): ExternalPlayerSession {
    const now = new Date().toISOString();
    return {
        id: `mpv-protocol-${now}`,
        player: 'mpv',
        status: 'opened',
        title: playback.title,
        thumbnail: playback.thumbnail ?? null,
        streamUrl: playback.streamUrl,
        contentInfo: playback.contentInfo,
        startedAt: now,
        updatedAt: now,
        canClose: false,
    };
}

export function dispatchMpvProtocolUrl(
    protocolUrl: string,
    doc: Pick<Document, 'createElement' | 'body'>
): void {
    const anchor = doc.createElement('a');
    anchor.href = protocolUrl;
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}
