import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { DataService, SettingsStore } from '@iptvnator/services';
import { Channel, VideoPlayer } from '@iptvnator/shared/interfaces';
import { ChannelDetailsDialogComponent } from './channel-details-dialog.component';

describe('ChannelDetailsDialogComponent', () => {
    let fixture: ComponentFixture<ChannelDetailsDialogComponent>;
    let component: ChannelDetailsDialogComponent;
    let sendIpcEvent: jest.Mock;
    let player: ReturnType<typeof signal<VideoPlayer>>;

    const channel: Channel = {
        epgParams: 'src=test-playlist',
        group: {
            title: 'News',
        },
        http: {
            origin: 'https://provider.example.com',
            referrer: 'https://provider.example.com/list',
            'user-agent': 'IPTVnator Test',
        },
        id: 'channel-1',
        name: 'News One',
        radio: 'false',
        tvg: {
            id: 'news-one',
            logo: 'https://provider.example.com/logo.png',
            name: 'News One HD',
            rec: '5',
            url: 'https://provider.example.com/guide.xml',
        },
        url: 'https://provider.example.com/stream.m3u8',
        catchup: {
            days: '5',
            source: 'https://provider.example.com/catchup.m3u8',
            type: 'append',
        },
        timeshift: '5',
    };

    beforeEach(async () => {
        sendIpcEvent = jest.fn();
        player = signal(VideoPlayer.VideoJs);
        await TestBed.configureTestingModule({
            imports: [
                ChannelDetailsDialogComponent,
                NoopAnimationsModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: channel,
                },
                {
                    provide: SettingsStore,
                    useValue: { player },
                },
                {
                    provide: DataService,
                    useValue: { sendIpcEvent },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChannelDetailsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('derives archive window and playback support from parsed catchup metadata', () => {
        expect(component.archiveDays).toBe(5);
        expect(component.catchupAvailable).toBe(true);
        expect(component.catchupPlaybackSupported).toBe(true);
        expect(component.heroStats).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    labelKey: 'CHANNELS.DETAILS_DIALOG.WINDOW',
                    translateParams: { count: 5 },
                    valueKey: 'CHANNELS.DETAILS_DIALOG.DAYS_OTHER',
                }),
            ])
        );
    });

    it('opens the stream in MPV beside the copy button when another player is selected', () => {
        const button = fixture.nativeElement.querySelector(
            '[data-test-id="channel-open-in-mpv"]'
        ) as HTMLButtonElement;
        expect(button).not.toBeNull();
        button.click();
        expect(sendIpcEvent).toHaveBeenCalledWith('OPEN_MPV_PLAYER', {
            url: channel.url,
            title: channel.name,
        });
    });

    it('hides Open in MPV when MPV is already the saved player', () => {
        player.set(VideoPlayer.MPV);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector(
                '[data-test-id="channel-open-in-mpv"]'
            )
        ).toBeNull();
    });
});
