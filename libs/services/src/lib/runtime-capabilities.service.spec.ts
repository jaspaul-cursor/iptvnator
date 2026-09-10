import { RuntimeCapabilitiesService } from './runtime-capabilities.service';

describe('RuntimeCapabilitiesService', () => {
    it('reports PWA-only capabilities', () => {
        const service = new RuntimeCapabilitiesService();

        expect(service.environment).toBe('pwa');
        expect(service.isPwa).toBe(true);
        expect(service.isElectron).toBe(false);
        expect(service.platform).toBeUndefined();
        expect(service.isMacOS).toBe(false);
        expect(service.isWindows).toBe(false);
        expect(service.isLinux).toBe(false);
        expect(service.usesCustomWindowControls).toBe(false);
        expect(service.supportsPortalConnectivityGuard).toBe(false);
        expect(service.supportsStartupWindowMode).toBe(false);
        expect(service.supportsEpg).toBe(false);
        expect(service.supportsSqlite).toBe(false);
        expect(service.supportsXtreamSqliteDataSource).toBe(false);
        expect(service.supportsDownloads).toBe(false);
        expect(service.supportsRecordings).toBe(false);
        expect(service.supportsPortalActivityStorage).toBe(false);
        expect(service.supportsPlaybackPositionStorage).toBe(false);
        expect(service.supportsPlaybackPositionUpdates).toBe(false);
        expect(service.supportsAppStateStorage).toBe(false);
        expect(service.supportsStalkerPlaylistSqliteSync).toBe(false);
        expect(service.supportsPlaylistRefresh).toBe(false);
        expect(service.supportsManagedExternalPlayers).toBe(false);
        expect(service.supportsMpvProtocol).toBe(true);
        expect(service.supportsExternalPlayerPathSettings).toBe(false);
        expect(service.supportsEmbeddedMpv).toBe(false);
        expect(service.supportsDesktopFileSave).toBe(false);
        expect(service.supportsRemoteControl).toBe(false);
        expect(service.supportsXtreamSectionNavigation).toBe(true);
    });
});
