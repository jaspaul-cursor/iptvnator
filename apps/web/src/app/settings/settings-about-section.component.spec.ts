import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsAboutSectionComponent } from './settings-about-section.component';

describe('SettingsAboutSectionComponent version display', () => {
    let fixture: ComponentFixture<SettingsAboutSectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SettingsAboutSectionComponent,
                TranslateModule.forRoot(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SettingsAboutSectionComponent);
        fixture.componentRef.setInput('version', '0.23.0');
    });

    function getVersionBlock() {
        return fixture.nativeElement.querySelector(
            '[data-test-id="app-version"]'
        ) as HTMLElement;
    }

    function getCommitMarker() {
        return fixture.nativeElement.querySelector(
            '[data-test-id="app-build-commit"]'
        ) as HTMLElement | null;
    }

    it('shows the shortened build commit next to the version on CI builds', () => {
        fixture.componentRef.setInput(
            'buildCommit',
            '949ea520aa11bb22cc33dd44ee55ff6677889900'
        );
        fixture.detectChanges();

        expect(getVersionBlock().textContent).toContain('0.23.0');
        expect(getCommitMarker()?.textContent).toBe('(949ea52)');
        expect(getCommitMarker()?.getAttribute('title')).toBe(
            '949ea520aa11bb22cc33dd44ee55ff6677889900'
        );
    });

    it('shows the plain version when no build commit was injected', () => {
        fixture.detectChanges();

        expect(getVersionBlock().textContent).toContain('0.23.0');
        expect(getCommitMarker()).toBeNull();
    });

    it('treats a whitespace-only commit as absent', () => {
        fixture.componentRef.setInput('buildCommit', '   ');
        fixture.detectChanges();

        expect(getCommitMarker()).toBeNull();
    });
});
