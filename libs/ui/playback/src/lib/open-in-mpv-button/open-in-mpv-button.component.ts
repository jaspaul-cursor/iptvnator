import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MpvProtocolService } from '@iptvnator/services';

@Component({
    selector: 'app-open-in-mpv-button',
    templateUrl: './open-in-mpv-button.component.html',
    styleUrl: './open-in-mpv-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
})
export class OpenInMpvButtonComponent {
    readonly streamUrl = input.required<string>();
    readonly compact = input(false);

    private readonly mpvProtocol = inject(MpvProtocolService);

    readonly visible = computed(() => this.mpvProtocol.canOpen(this.streamUrl()));

    openInMpv(): void {
        this.mpvProtocol.openPlayback({
            streamUrl: this.streamUrl(),
            title: '',
            isLive: true,
        });
    }
}
