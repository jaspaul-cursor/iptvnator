/** External PWA-only movie download jobs. Series and live are excluded. */
export const PWA_VOD_DOWNLOAD_JOBS_URL =
    'https://auto-downloader.2410241.xyz/jobs';

/** Movie HLS URL: swap the container extension for `m3u8`. */
export function toPwaVodM3u8Url(streamUrl: string): string {
    const trimmed = streamUrl.trim();
    if (!trimmed) {
        return '';
    }
    if (/\.m3u8(?=[?#]|$)/i.test(trimmed)) {
        return trimmed;
    }
    if (/\.[^./?#]+(?=[?#]|$)/.test(trimmed)) {
        return trimmed.replace(/\.[^./?#]+(?=[?#]|$)/, '.m3u8');
    }
    return `${trimmed}.m3u8`;
}

/** Job title is the movie name with an `.mp4` extension. */
export function toPwaVodDownloadTitle(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
        return '';
    }
    return /\.mp4$/i.test(trimmed) ? trimmed : `${trimmed}.mp4`;
}

export async function queuePwaVodDownloadJob(job: {
    url: string;
    title: string;
}): Promise<void> {
    const response = await fetch(PWA_VOD_DOWNLOAD_JOBS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: job.url, title: job.title }),
    });
    if (!response.ok) {
        throw new Error(`PWA VOD download job failed: ${response.status}`);
    }
}
