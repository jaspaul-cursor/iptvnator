import { Injectable } from '@angular/core';
import {
    buildMpvProtocolUrl,
    canOpenViaMpvProtocol,
    createMpvProtocolLaunchSession,
    dispatchMpvProtocolUrl,
    type ResolvedPortalPlayback,
    type ExternalPlayerSession,
} from '@iptvnator/shared/interfaces';
import { RuntimeCapabilitiesService } from './runtime-capabilities.service';

@Injectable({ providedIn: 'root' })
export class MpvProtocolService {
    constructor(private readonly runtime: RuntimeCapabilitiesService) {}

    get isAvailable(): boolean {
        return this.runtime.supportsMpvProtocol;
    }

    canOpen(streamUrl: string): boolean {
        return this.isAvailable && canOpenViaMpvProtocol(streamUrl);
    }

    openPlayback(
        playback: ResolvedPortalPlayback
    ): ExternalPlayerSession | null {
        if (!this.canOpen(playback.streamUrl)) {
            return null;
        }

        dispatchMpvProtocolUrl(
            buildMpvProtocolUrl(playback.streamUrl),
            document
        );
        return createMpvProtocolLaunchSession(playback);
    }
}
