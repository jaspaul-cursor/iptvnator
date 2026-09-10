import type { PlaybackBinding } from './playback-recovery-session';
import type {
    WebPlayerApplicationToken,
    WebPlayerSourceRevisionToken,
} from './web-player-application-state';

export interface PlaybackApplicationOwnership {
    readonly binding: PlaybackBinding;
    readonly isLive: boolean;
    readonly sourceRevision: WebPlayerSourceRevisionToken;
    readonly token: WebPlayerApplicationToken;
}

export function ownsPlaybackApplication(options: {
    readonly ownership: PlaybackApplicationOwnership;
    readonly currentToken: WebPlayerApplicationToken;
    readonly currentSourceRevision: WebPlayerSourceRevisionToken;
    readonly bindingOwned: boolean;
}): boolean {
    const { ownership } = options;
    if (
        ownership.token !== options.currentToken ||
        ownership.sourceRevision !== options.currentSourceRevision
    ) {
        return false;
    }
    return options.bindingOwned;
}
