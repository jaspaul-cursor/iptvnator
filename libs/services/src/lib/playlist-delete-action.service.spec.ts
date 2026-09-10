import {
    EnvironmentInjector,
    Injector,
    createEnvironmentInjector,
    runInInjectionContext,
} from '@angular/core';
import { of } from 'rxjs';
import { PlaylistMeta } from '@iptvnator/shared/interfaces';
import { PlaylistDeleteActionService } from './playlist-delete-action.service';
import { PlaylistsService } from './playlists.service';

describe('PlaylistDeleteActionService', () => {
    const playlist = {
        _id: 'playlist-1',
        title: 'Demo Playlist',
        serverUrl: 'http://demo.example',
    } as PlaylistMeta;

    let playlistsService: {
        deletePlaylist: jest.Mock;
    };
    let injector: EnvironmentInjector;

    beforeEach(() => {
        playlistsService = {
            deletePlaylist: jest.fn(() => of({ success: true })),
        };

        injector = createEnvironmentInjector(
            [{ provide: PlaylistsService, useValue: playlistsService }],
            Injector.NULL as unknown as EnvironmentInjector
        );
    });

    afterEach(() => {
        injector.destroy();
    });

    function createService(): PlaylistDeleteActionService {
        return runInInjectionContext(
            injector,
            () => new PlaylistDeleteActionService()
        );
    }

    it('deletes playlists through PlaylistsService', async () => {
        const service = createService();

        await expect(service.deletePlaylist(playlist)).resolves.toBe(true);

        expect(playlistsService.deletePlaylist).toHaveBeenCalledWith(
            'playlist-1'
        );
    });
});
