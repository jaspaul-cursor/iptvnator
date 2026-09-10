import { Injectable } from '@angular/core';

export type RuntimeEnvironment = 'pwa';

@Injectable({ providedIn: 'root' })
export class RuntimeCapabilitiesService {
    get environment(): RuntimeEnvironment {
        return 'pwa';
    }

    get isElectron(): boolean {
        return false;
    }

    get isPwa(): boolean {
        return true;
    }

    get platform(): string | undefined {
        return undefined;
    }

    get isMacOS(): boolean {
        return false;
    }

    get isWindows(): boolean {
        return false;
    }

    get isLinux(): boolean {
        return false;
    }

    get usesCustomWindowControls(): boolean {
        return false;
    }

    get supportsPortalConnectivityGuard(): boolean {
        return false;
    }

    get supportsStartupWindowMode(): boolean {
        return false;
    }

    get supportsEpg(): boolean {
        return false;
    }

    get supportsEpgImport(): boolean {
        return false;
    }

    get supportsEpgProgress(): boolean {
        return false;
    }

    get supportsEpgProgramLookup(): boolean {
        return false;
    }

    get supportsEpgCurrentProgramBatch(): boolean {
        return false;
    }

    get supportsEpgChannelMetadata(): boolean {
        return false;
    }

    get supportsEpgSourceFreshness(): boolean {
        return false;
    }

    get supportsEpgDataManagement(): boolean {
        return false;
    }

    get supportsEpgGuide(): boolean {
        return false;
    }

    get supportsEpgProgramSearch(): boolean {
        return false;
    }

    get supportsEpgMapping(): boolean {
        return false;
    }

    get supportsSqlite(): boolean {
        return false;
    }

    get supportsXtreamSqliteDataSource(): boolean {
        return false;
    }

    get supportsPlaybackPositionStorage(): boolean {
        return false;
    }

    get supportsPlaybackPositionUpdates(): boolean {
        return false;
    }

    get supportsDownloads(): boolean {
        return false;
    }

    get supportsRecordings(): boolean {
        return false;
    }

    get supportsPortalActivityStorage(): boolean {
        return false;
    }

    get supportsAppStateStorage(): boolean {
        return false;
    }

    get supportsStalkerPlaylistSqliteSync(): boolean {
        return false;
    }

    get supportsPlaylistRefresh(): boolean {
        return false;
    }

    get supportsManagedExternalPlayers(): boolean {
        return false;
    }

    get supportsMpvProtocol(): boolean {
        return true;
    }

    get supportsExternalPlayerPathSettings(): boolean {
        return false;
    }

    get supportsEmbeddedMpv(): boolean {
        return false;
    }

    get supportsDesktopFileSave(): boolean {
        return false;
    }

    get supportsRemoteControl(): boolean {
        return false;
    }

    get supportsXtreamSectionNavigation(): boolean {
        return true;
    }
}
