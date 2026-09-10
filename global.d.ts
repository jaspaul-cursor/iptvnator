import 'jest-extended';

declare module 'video.js' {
    export interface VideoJsPlayer {
        hlsQualitySelector(options?: Record<string, unknown>): void;
    }
}

declare global {
    interface Window {
        __IPTVNATOR_CONFIG__?: {
            BACKEND_URL?: string;
        };
        electron?: import('./libs/shared/interfaces/src/lib/electron-api.interface').ElectronBridgeApi;
    }
}

// SystemJS module definition
declare const nodeModule: NodeModule;
interface NodeModule {
    id: string;
}
