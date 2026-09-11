/** mpv-android package used by Chrome `intent://` links. */
export const MPV_ANDROID_PACKAGE = 'is.xyz.mpv';

/** Play Store listing used when mpv-android is not installed. */
export const MPV_ANDROID_PLAY_STORE_URL =
    'https://play.google.com/store/apps/details?id=is.xyz.mpv';

/** mpv accepts only safe network protocols when opened via `mpv://`. */
export function canOpenViaMpvProtocol(streamUrl: string): boolean {
    try {
        const protocol = new URL(streamUrl.trim()).protocol;
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

export function isAndroidUserAgent(userAgent: string): boolean {
    return /Android/i.test(userAgent) && !/Windows Phone/i.test(userAgent);
}

export function isIosUserAgent(userAgent: string): boolean {
    return /iPhone|iPad|iPod/i.test(userAgent);
}

/**
 * Desktop `mpv://` handler URL. The stream is percent-encoded so browsers do
 * not parse the nested `https://` as a host (`mpv://https://…` becomes
 * `mpv://https//…`). mpv strips `mpv://` and opens the decoded remainder.
 */
export function buildDesktopMpvProtocolUrl(streamUrl: string): string {
    const trimmed = streamUrl.trim();
    if (!canOpenViaMpvProtocol(trimmed)) {
        throw new Error('Only http(s) stream URLs can be opened via mpv://');
    }

    return `mpv://${encodeURIComponent(trimmed)}`;
}

/**
 * Chrome Android intent that opens mpv-android with `type=video/any` so
 * extension-less and `.ts` IPTV URLs still match the app's intent filters.
 */
export function buildAndroidMpvIntentUrl(
    streamUrl: string,
    title?: string
): string {
    const parsed = new URL(streamUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http(s) stream URLs can be opened via intent');
    }

    const userinfo = parsed.username
        ? `${encodeURIComponent(parsed.username)}${
              parsed.password
                  ? `:${encodeURIComponent(parsed.password)}`
                  : ''
          }@`
        : '';
    const path = `${userinfo}${parsed.host}${parsed.pathname}${parsed.search}`;
    const extras = [
        `scheme=${parsed.protocol.replace(/:$/, '')}`,
        'type=video/any',
        `package=${MPV_ANDROID_PACKAGE}`,
    ];
    const trimmedTitle = title?.trim();
    if (trimmedTitle) {
        extras.push(`S.title=${encodeURIComponent(trimmedTitle)}`);
    }
    extras.push(
        `S.browser_fallback_url=${encodeURIComponent(MPV_ANDROID_PLAY_STORE_URL)}`
    );
    extras.push('end');

    return `intent://${path}#Intent;${extras.join(';')};`;
}

/**
 * Browser/PWA launch href for a transferable stream.
 * Android → mpv-android intent; other desktops → `mpv://`; iOS → none.
 */
export function buildExternalMpvLaunchHref(
    streamUrl: string,
    userAgent: string,
    title?: string
): string | null {
    if (!canOpenViaMpvProtocol(streamUrl) || isIosUserAgent(userAgent)) {
        return null;
    }

    if (isAndroidUserAgent(userAgent)) {
        return buildAndroidMpvIntentUrl(streamUrl, title);
    }

    return buildDesktopMpvProtocolUrl(streamUrl);
}

/**
 * Browser document subset for `dispatchMpvProtocolUrl`.
 * Structural so this util stays DOM-lib-free for Node consumers.
 */
export interface MpvProtocolDispatchDocument {
    createElement(tagName: string): MpvProtocolDispatchAnchor;
    readonly body: {
        appendChild(node: MpvProtocolDispatchAnchor): unknown;
    };
}

export interface MpvProtocolDispatchAnchor {
    href: string;
    rel: string;
    style: { display: string };
    click(): void;
    remove(): void;
}

/** Click a temporary anchor so an unregistered handler does not navigate away. */
export function dispatchMpvProtocolUrl(
    protocolUrl: string,
    doc: MpvProtocolDispatchDocument
): void {
    const anchor = doc.createElement('a');
    anchor.href = protocolUrl;
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}
