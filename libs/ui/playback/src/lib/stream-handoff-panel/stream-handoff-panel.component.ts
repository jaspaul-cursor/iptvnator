import { ClipboardModule } from '@angular/cdk/clipboard';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataService } from '@iptvnator/services';
import {
    OPEN_MPV_PLAYER,
    ResolvedPortalPlayback,
    buildStreamRelayUrl,
    canOpenViaMpvProtocol,
} from '@iptvnator/shared/interfaces';

@Component({
    selector: 'app-stream-handoff-panel',
    templateUrl: './stream-handoff-panel.component.html',
    styleUrl: './stream-handoff-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ClipboardModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        TranslateModule,
    ],
    host: { class: 'stream-handoff-panel' },
})
export class StreamHandoffPanelComponent {
    readonly playback = input.required<ResolvedPortalPlayback>();

    private readonly dataService = inject(DataService, { optional: true });
    private readonly snackBar = inject(MatSnackBar);
    private readonly translate = inject(TranslateService);

    private readonly copySucceeded = signal(false);

    readonly streamUrl = computed(() => this.playback().streamUrl?.trim() ?? '');
    readonly relayUrl = computed(() => buildStreamRelayUrl(this.streamUrl()));
    readonly title = computed(() => this.playback().title?.trim() ?? '');
    readonly canOpenMpv = computed(() => canOpenViaMpvProtocol(this.streamUrl()));
    readonly showRelayActions = computed(() => this.relayUrl() !== null);

    onStreamUrlCopied(success: boolean): void {
        this.notifyCopied(success);
    }

    onRelayUrlCopied(success: boolean): void {
        this.notifyCopied(success);
    }

    openStreamInMpv(): void {
        this.openInMpv(this.streamUrl());
    }

    openRelayInMpv(): void {
        const relayUrl = this.relayUrl();
        if (!relayUrl) {
            return;
        }
        this.openInMpv(relayUrl);
    }

    private openInMpv(url: string): void {
        if (!this.canOpenMpv() || !url) {
            return;
        }

        this.dataService?.sendIpcEvent(OPEN_MPV_PLAYER, {
            url,
            title: this.title(),
        });
    }

    private notifyCopied(success: boolean): void {
        this.copySucceeded.set(success);
        const key = success
            ? 'PORTALS.STREAM_URL_COPIED'
            : 'PLAYBACK_DIAGNOSTICS.COPY_FAILED';
        this.snackBar.open(this.translate.instant(key), undefined, {
            duration: 2000,
        });
    }
}
