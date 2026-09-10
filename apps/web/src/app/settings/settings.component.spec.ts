import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { EpgRuntimeBridgeService } from '@iptvnator/epg/data-access';
import { VideoPlayer } from '@iptvnator/shared/interfaces';
import { SettingsComponent } from './settings.component';
import {
    configureSettingsComponentTestBed,
    createElectronStub,
    createEpgBridgeStub,
    MockRouter,
    setSettingsSection,
} from './test-stubs/settings-test-harness.stub';

/**
 * Page-shell behaviour: chrome, the `:section` page routing, and the
 * runtime capabilities that decide which sections and players are offered.
 * Form editing and saving live in `settings.component.form.spec.ts`.
 */
describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let router: Router;
    let epgBridge: Partial<EpgRuntimeBridgeService>;
    const originalElectron = window.electron;

    beforeEach(waitForAsync(() => {
        epgBridge = createEpgBridgeStub();
        configureSettingsComponentTestBed(epgBridge);
    }));

    beforeEach(() => {
        window.electron = createElectronStub();

        fixture = TestBed.createComponent(SettingsComponent);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        window.electron = originalElectron;
    });

    it('should create and init component', () => {
        expect(component).toBeTruthy();
    });

    it('resets settings navigation on destroy', () => {
        fixture.destroy();

        const lifecycleFixture = TestBed.createComponent(SettingsComponent);
        lifecycleFixture.detectChanges();
        lifecycleFixture.destroy();

        expect(lifecycleFixture.componentInstance).toBeTruthy();
    });

    it('should render the hidden page header hook', () => {
        const nativeElement = fixture.nativeElement as HTMLElement;

        expect(
            nativeElement.querySelector('[data-test-id="settings-page-header"]')
        ).not.toBeNull();
        expect(nativeElement.querySelector('.settings-intro')).toBeNull();
    });

    describe('Section pages', () => {
        it('renders only the section named by the route param', () => {
            const nativeElement = fixture.nativeElement as HTMLElement;

            expect(
                nativeElement.querySelector('app-settings-general-section')
            ).not.toBeNull();
            expect(
                nativeElement.querySelector('app-settings-playback-section')
            ).toBeNull();

            setSettingsSection('playback');
            fixture.detectChanges();

            expect(
                nativeElement.querySelector('app-settings-general-section')
            ).toBeNull();
            expect(
                nativeElement.querySelector('app-settings-playback-section')
            ).not.toBeNull();
        });

        it('falls back to the general page and rewrites unknown section URLs', () => {
            const navigate = (router as unknown as MockRouter).navigate;

            setSettingsSection('nonsense');
            fixture.detectChanges();

            expect(component.activeSection()).toBe('general');
            expect(navigate).toHaveBeenCalledWith(
                ['/workspace/settings', 'general'],
                { replaceUrl: true }
            );
            expect(
                (fixture.nativeElement as HTMLElement).querySelector(
                    'app-settings-general-section'
                )
            ).not.toBeNull();
        });
    });

    describe('Leaving with unsaved changes', () => {
        const answerDialogWith = (
            choice: 'save' | 'discard' | undefined
        ): jest.Mock => {
            const open = TestBed.inject(MatDialog).open as jest.Mock;
            open.mockReturnValue({ afterClosed: () => of(choice) });
            return open;
        };

        it('lets a pristine form leave without asking', async () => {
            const open = answerDialogWith(undefined);

            await expect(
                component.confirmLeaveWithUnsavedChanges()
            ).resolves.toBe(true);
            expect(open).not.toHaveBeenCalled();
        });

        it('stays when the dialog is dismissed', async () => {
            component.settingsForm.markAsDirty();
            answerDialogWith(undefined);

            await expect(
                component.confirmLeaveWithUnsavedChanges()
            ).resolves.toBe(false);
            expect(component.settingsForm.dirty).toBe(true);
        });

        it('discard-and-leave reverts the staged edits', async () => {
            component.settingsForm.get('theme')?.setValue('DARK_THEME');
            component.settingsForm.markAsDirty();
            answerDialogWith('discard');

            await expect(
                component.confirmLeaveWithUnsavedChanges()
            ).resolves.toBe(true);
            expect(component.settingsForm.pristine).toBe(true);
        });

        it('save-and-leave persists before allowing the navigation', async () => {
            component.settingsForm.markAsDirty();
            jest.spyOn(component.epg, 'fetchConfiguredEpg').mockImplementation();
            answerDialogWith('save');

            await expect(
                component.confirmLeaveWithUnsavedChanges()
            ).resolves.toBe(true);
            expect(component.settingsForm.pristine).toBe(true);
        });

        it('offers save-and-leave only while the form is valid', async () => {
            component.settingsForm.markAsDirty();
            component.settingsForm.setErrors({ invalid: true });
            const open = answerDialogWith(undefined);

            await component.confirmLeaveWithUnsavedChanges();

            expect(open).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: { canSave: false },
                })
            );
        });
    });

    describe('Runtime capabilities', () => {
        it('never offers embedded mpv or managed external players in the PWA build', () => {
            expect(
                component
                    .players()
                    .some((player) => player.id === VideoPlayer.EmbeddedMpv)
            ).toBe(false);
            expect(component.supportsManagedExternalPlayers).toBe(false);
            expect(component.supportsExternalPlayerPathSettings).toBe(false);
            expect(
                component.players().some((player) => player.id === VideoPlayer.VLC)
            ).toBe(false);
            expect(
                component.players().some((player) => player.id === VideoPlayer.MPV)
            ).toBe(true);
        });
    });
});
