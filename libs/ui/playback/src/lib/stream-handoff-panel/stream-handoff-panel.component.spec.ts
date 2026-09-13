import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '@iptvnator/services';
import {
    OPEN_MPV_PLAYER,
    STREAM_RELAY_PROXY_BASE_URL,
} from '@iptvnator/shared/interfaces';
import { StreamHandoffPanelComponent } from './stream-handoff-panel.component';

describe('StreamHandoffPanelComponent', () => {
    let fixture: ComponentFixture<StreamHandoffPanelComponent>;
    const sendIpcEvent = jest.fn();
    const snackBar = { open: jest.fn() };

    beforeEach(async () => {
        sendIpcEvent.mockReset();
        snackBar.open.mockReset();

        await TestBed.configureTestingModule({
            imports: [StreamHandoffPanelComponent, TranslateModule.forRoot()],
            providers: [
                { provide: DataService, useValue: { sendIpcEvent } },
                { provide: MatSnackBar, useValue: snackBar },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StreamHandoffPanelComponent);
        fixture.componentRef.setInput('playback', {
            streamUrl: 'https://cdn.example/live.m3u8',
            title: 'News channel',
            isLive: true,
        });
        fixture.detectChanges();
    });

    it('renders the four handoff actions', () => {
        expect(
            fixture.nativeElement.querySelector(
                '[data-test-id="stream-handoff-copy-url"]'
            )
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                '[data-test-id="stream-handoff-open-mpv"]'
            )
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                '[data-test-id="stream-handoff-copy-relay-url"]'
            )
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector(
                '[data-test-id="stream-handoff-open-relay-mpv"]'
            )
        ).not.toBeNull();
    });

    it('opens the relay URL in MPV', () => {
        fixture.nativeElement
            .querySelector('[data-test-id="stream-handoff-open-relay-mpv"]')
            .click();

        expect(sendIpcEvent).toHaveBeenCalledWith(OPEN_MPV_PLAYER, {
            url: `${STREAM_RELAY_PROXY_BASE_URL}?url=${encodeURIComponent(
                'https://cdn.example/live.m3u8'
            )}`,
            title: 'News channel',
        });
    });
});
