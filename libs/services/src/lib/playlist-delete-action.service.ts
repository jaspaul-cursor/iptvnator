import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlaylistMeta } from '@iptvnator/shared/interfaces';
import { PlaylistsService } from './playlists.service';

@Injectable({ providedIn: 'root' })
export class PlaylistDeleteActionService {
    private readonly playlistsService = inject(PlaylistsService);

    async deletePlaylist(playlist: PlaylistMeta): Promise<boolean> {
        const result = await firstValueFrom(
            this.playlistsService.deletePlaylist(playlist._id)
        );
        return result.success;
    }
}
