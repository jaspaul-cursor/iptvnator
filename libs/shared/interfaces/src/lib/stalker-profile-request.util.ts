import { normalizeStalkerMacAddress } from './stalker-mac-address.util';
import {
    STALKER_API_SIGNATURE,
    STALKER_STB_PROFILE_PARAMS,
} from './stalker-stb-profile.const';

export { STALKER_API_SIGNATURE };

export interface StalkerProfileMetricsInput {
    macAddress: string;
    handshakeRandom: string;
    serialNumber?: string;
}

async function sha1HexLower(value: string): Promise<string | null> {
    if (!globalThis.crypto?.subtle) {
        return null;
    }

    const digest = await crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(value)
    );

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * SHA-1 of the canonical colon MAC in lowercase hex. Used for `prehash` and
 * `hw_version_2` on `get_profile`, matching reference Stalker clients.
 */
export async function buildStalkerMacSha1Hex(
    macAddress: string
): Promise<string | null> {
    const normalizedMac = normalizeStalkerMacAddress(macAddress);
    if (!normalizedMac) {
        return null;
    }

    return sha1HexLower(normalizedMac);
}

export async function buildStalkerPrehash(
    macAddress: string
): Promise<string | null> {
    return buildStalkerMacSha1Hex(macAddress);
}

export async function buildStalkerHwVersion2(
    macAddress: string
): Promise<string | null> {
    return buildStalkerMacSha1Hex(macAddress);
}

/** Metrics JSON payload for `get_profile`. */
export function buildStalkerProfileMetrics(
    input: StalkerProfileMetricsInput
): Record<string, string> {
    return {
        mac: input.macAddress,
        model: STALKER_STB_PROFILE_PARAMS['stb_type'],
        type: 'STB',
        uid: '',
        random: input.handshakeRandom,
        ...(input.serialNumber ? { sn: input.serialNumber } : {}),
    };
}
