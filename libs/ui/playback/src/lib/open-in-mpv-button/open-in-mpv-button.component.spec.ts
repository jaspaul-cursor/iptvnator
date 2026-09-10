import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MpvProtocolService } from '@iptvnator/services';
import { OpenInMpvButtonComponent } from './open-in-mpv-button.component';

describe('OpenInMpvButtonComponent', () => {
    let fixture: ComponentFixture<OpenInMpvButtonComponent>;
    let mpvProtocol: { canOpen: jest.Mock; openPlayback: jest.Mock };

    beforeEach(async () => {
        mpvProtocol = {
            canOpen: jest.fn().mockReturnValue(true),
            openPlayback: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [OpenInMpvButtonComponent, TranslateModule.forRoot()],
            providers: [
                { provide: MpvProtocolService, useValue: mpvProtocol },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OpenInMpvButtonComponent);
        fixture.componentRef.setInput(
            'streamUrl',
            'https://example.com/live.m3u8'
        );
        fixture.detectChanges();
    });

    it('renders only when the protocol can open the stream', () => {
        expect(
            fixture.nativeElement.querySelector('[data-test-id="open-in-mpv"]')
        ).not.toBeNull();

        mpvProtocol.canOpen.mockReturnValue(false);
        fixture.componentRef.setInput('streamUrl', 'rtmp://example.com/live');
        fixture.detectChanges();

        expect(
            fixture.nativeElement.querySelector('[data-test-id="open-in-mpv"]')
        ).toBeNull();
    });

    it('hands the stream URL to the protocol service on click', () => {
        fixture.nativeElement
            .querySelector('[data-test-id="open-in-mpv"]')
            .click();

        expect(mpvProtocol.openPlayback).toHaveBeenCalledWith({
            streamUrl: 'https://example.com/live.m3u8',
            title: '',
            isLive: true,
        });
    });
});
