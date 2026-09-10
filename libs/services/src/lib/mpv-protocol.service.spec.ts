import { buildMpvProtocolUrl } from '@iptvnator/shared/interfaces';
import { MpvProtocolService } from './mpv-protocol.service';
import { RuntimeCapabilitiesService } from './runtime-capabilities.service';

describe('MpvProtocolService', () => {
    const playback = {
        streamUrl: 'https://example.com/live.m3u8',
        title: 'News',
        isLive: true,
    };

    it('opens transferable http(s) streams when the protocol is supported', () => {
        const runtime = {
            supportsMpvProtocol: true,
        } as RuntimeCapabilitiesService;
        const service = new MpvProtocolService(runtime);
        const click = jest.fn();
        const remove = jest.fn();
        const anchor = {
            href: '',
            rel: '',
            style: { display: '' },
            click,
            remove,
        };
        const createElementSpy = jest
            .spyOn(document, 'createElement')
            .mockReturnValue(anchor as unknown as HTMLAnchorElement);
        const appendChildSpy = jest
            .spyOn(document.body, 'appendChild')
            .mockImplementation(
                () => anchor as unknown as HTMLAnchorElement
            );

        const session = service.openPlayback(playback);

        expect(session).toMatchObject({
            player: 'mpv',
            status: 'opened',
            title: playback.title,
            streamUrl: playback.streamUrl,
            canClose: false,
        });
        expect(session?.id).toMatch(/^mpv-protocol-/);
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendChildSpy).toHaveBeenCalledWith(anchor);
        expect(click).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
        expect(anchor.href).toBe(buildMpvProtocolUrl(playback.streamUrl));

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
    });

    it('refuses unsupported runtimes and non-http(s) URLs', () => {
        const service = new MpvProtocolService({
            supportsMpvProtocol: false,
        } as RuntimeCapabilitiesService);

        expect(service.openPlayback(playback)).toBeNull();
        expect(
            service.openPlayback({
                ...playback,
                streamUrl: 'rtmp://example.com/live',
            })
        ).toBeNull();
    });
});
