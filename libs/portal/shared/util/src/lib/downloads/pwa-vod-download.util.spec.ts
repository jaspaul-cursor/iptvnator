import {
    PWA_VOD_DOWNLOAD_JOBS_URL,
    queuePwaVodDownloadJob,
    toPwaVodDownloadTitle,
    toPwaVodM3u8Url,
} from './pwa-vod-download.util';

describe('PWA VOD download helpers', () => {
    it('posts to the TLS-named downloader host', () => {
        expect(PWA_VOD_DOWNLOAD_JOBS_URL).toBe(
            'https://auto-downloader.2410241.xyz/jobs'
        );
    });

    it('rewrites the movie container extension to m3u8', () => {
        expect(
            toPwaVodM3u8Url('http://panel.example/movie/user/pass/650020.mkv')
        ).toBe('http://panel.example/movie/user/pass/650020.m3u8');
    });

    it('leaves an HLS movie URL unchanged', () => {
        expect(
            toPwaVodM3u8Url('http://panel.example/movie/user/pass/650020.m3u8')
        ).toBe('http://panel.example/movie/user/pass/650020.m3u8');
    });

    it('appends .mp4 to the movie name', () => {
        expect(toPwaVodDownloadTitle('Catalog movie')).toBe(
            'Catalog movie.mp4'
        );
        expect(toPwaVodDownloadTitle('Catalog movie.mp4')).toBe(
            'Catalog movie.mp4'
        );
    });

    it('posts url and title to the jobs endpoint', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue({ ok: true, status: 200 });
        const originalFetch = globalThis.fetch;
        globalThis.fetch = fetchMock as typeof fetch;

        try {
            await queuePwaVodDownloadJob({
                url: 'http://panel.example/movie/user/pass/650020.m3u8',
                title: 'Catalog movie.mp4',
            });
        } finally {
            globalThis.fetch = originalFetch;
        }

        expect(fetchMock).toHaveBeenCalledWith(PWA_VOD_DOWNLOAD_JOBS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'http://panel.example/movie/user/pass/650020.m3u8',
                title: 'Catalog movie.mp4',
            }),
        });
    });
});
