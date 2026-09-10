import {
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsContextService } from '@iptvnator/workspace/shell/util';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    DataService,
    EpgSourceReconciliationError,
    RuntimeCapabilitiesService,
} from '@iptvnator/services';
import { VodSourceDiscoveryService } from '@iptvnator/portal/shared/data-access';
import { Language, StreamFormat } from '@iptvnator/shared/interfaces';
import { firstValueFrom, map } from 'rxjs';
import { BUILD_COMMIT } from '../../environments/build-commit';
import { SettingsAboutSectionComponent } from './settings-about-section.component';
import { SettingsDashboardSectionComponent } from './settings-dashboard-section.component';
import { SettingsEpgFacade } from './settings-epg.facade';
import { SettingsEpgSectionComponent } from './settings-epg-section.component';
import { SettingsFormFacade } from './settings-form.facade';
import { SettingsGeneralSectionComponent } from './settings-general-section.component';
import { SettingsSection } from './settings.models';
import {
    buildSettingsPlayerOptions,
    buildSettingsSectionNavItems,
    SETTINGS_COVER_SIZE_OPTIONS,
    SETTINGS_EPG_VIEW_MODE_OPTIONS,
    SETTINGS_STARTUP_BEHAVIOR_OPTIONS,
    SETTINGS_THEME_OPTIONS,
} from './settings-options';
import { SettingsPlaybackSectionComponent } from './settings-playback-section.component';
import { SettingsTmdbSectionComponent } from './settings-tmdb-section.component';
import {
    SettingsUnsavedChangesChoice,
    SettingsUnsavedChangesDialogComponent,
} from './settings-unsaved-changes-dialog.component';
import { SettingsLeaveConfirmation } from './settings-unsaved-changes.guard';
import { SettingsSnackbarService } from './settings-snackbar.service';

export const SETTINGS_DEFAULT_SECTION = 'general';

/**
 * Thin coordinator for the settings page. The behaviour of each section lives
 * in a dedicated facade the template binds to directly; what stays here is the
 * page-level wiring: environment capabilities, the `:section` route param that
 * selects which section page renders, and the save/discard flow that spans
 * several facades.
 *
 * Routed as `/workspace/settings/:section`. Navigating between sections only
 * changes the param — the component instance (and with it the form and its
 * dirty state) survives until the user leaves settings entirely.
 */
@Component({
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    host: {
        class: 'settings-page-host',
    },
    encapsulation: ViewEncapsulation.None,
    imports: [
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        TranslateModule,
        SettingsAboutSectionComponent,
        SettingsDashboardSectionComponent,
        SettingsEpgSectionComponent,
        SettingsGeneralSectionComponent,
        SettingsPlaybackSectionComponent,
        SettingsTmdbSectionComponent,
    ],
    providers: [
        SettingsEpgFacade,
        SettingsFormFacade,
        SettingsSnackbarService,
    ],
})
export class SettingsComponent
    implements OnInit, OnDestroy, SettingsLeaveConfirmation
{
    readonly epg = inject(SettingsEpgFacade);
    readonly form = inject(SettingsFormFacade);

    private readonly dataService = inject(DataService);
    private readonly settingsCtx = inject(SettingsContextService);
    private readonly settingsSnackbar = inject(SettingsSnackbarService);
    private readonly runtime = inject(RuntimeCapabilitiesService);
    private readonly vodSourceDiscovery = inject(VodSourceDiscoveryService);
    private readonly matDialog = inject(MatDialog);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly translate = inject(TranslateService);
    private readonly hostElement = inject(ElementRef<HTMLElement>);

    /** List with available languages as enum */
    readonly languageEnum = Language;

    /** List with allowed formats as enum */
    readonly streamFormatEnum = StreamFormat;

    readonly supportsEpg = this.form.supportsEpg;
    readonly supportsManagedExternalPlayers =
        this.runtime.supportsManagedExternalPlayers;
    readonly supportsMpvProtocol = this.runtime.supportsMpvProtocol;
    readonly supportsExternalPlayerPathSettings =
        this.runtime.supportsExternalPlayerPathSettings;
    readonly supportsVodMultiSource = this.vodSourceDiscovery.isAvailable;

    /** Settings form object */
    readonly settingsForm = this.form.form;

    /** Player options */
    readonly players = computed(() =>
        buildSettingsPlayerOptions({
            supportsManagedExternalPlayers: this.supportsManagedExternalPlayers,
            supportsMpvProtocol: this.supportsMpvProtocol,
        })
    );

    /** Git commit the app was built from (CI builds only) */
    readonly buildCommit = BUILD_COMMIT;

    readonly appVersion = this.dataService.getAppVersion();

    readonly themeOptions = SETTINGS_THEME_OPTIONS;
    readonly coverSizeOptions = SETTINGS_COVER_SIZE_OPTIONS;
    readonly startupBehaviorOptions = SETTINGS_STARTUP_BEHAVIOR_OPTIONS;
    readonly epgViewModeOptions = SETTINGS_EPG_VIEW_MODE_OPTIONS;

    readonly sectionNavItems: SettingsSection[] = buildSettingsSectionNavItems({
        supportsEpg: this.supportsEpg,
    });

    get sectionNav(): SettingsSection[] {
        return this.sectionNavItems.filter((section) => section.visible);
    }

    private readonly sectionParam = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('section'))),
        { initialValue: null }
    );

    /**
     * Section page currently rendered. Unknown or capability-gated params
     * fall back to the default section while the redirect effect below
     * rewrites the URL to match.
     */
    readonly activeSection = computed(() => {
        const section = this.sectionParam();
        return section && this.isNavigableSection(section)
            ? section
            : SETTINGS_DEFAULT_SECTION;
    });

    constructor() {
        // A stale or hand-typed URL (`/settings/epg` in a runtime without
        // EPG support, `/settings/nonsense`) must not leave the address bar
        // lying about what is on screen.
        effect(() => {
            const section = this.sectionParam();
            if (section && !this.isNavigableSection(section)) {
                void this.router.navigate(
                    ['/workspace/settings', SETTINGS_DEFAULT_SECTION],
                    { replaceUrl: true }
                );
            }
        });

        // Section pages share one scroll container (`main.workspace-content`);
        // without this, opening a long section, scrolling, and switching to a
        // short one strands the viewport past the new page's content. Instant
        // on purpose — this is navigation, not an animated transition.
        effect(() => {
            this.activeSection();
            this.hostElement.nativeElement
                .closest('main.workspace-content')
                ?.scrollTo({ top: 0 });
        });
    }

    /**
     * Reads the config object from the browsers
     * storage (indexed db)
     */
    async ngOnInit(): Promise<void> {
        // Wait for settings to load before setting the form
        await this.form.loadSettings();
        this.form.hydrateFromStore();
        this.form.bindDashboardControlsEnabledState();

        this.settingsCtx.setSections(this.sectionNav);
    }

    ngOnDestroy(): void {
        this.settingsCtx.reset();
    }

    /**
     * Triggers on form submit and saves the config object to
     * the indexed db store
     */
    onSubmit(): void {
        void this.persistSettings();
    }

    /**
     * Exit gate for `settingsUnsavedChangesGuard`: silently allows leaving
     * while the form is pristine, otherwise lets the user save, discard, or
     * stay. A failed save keeps the user in settings — navigating away on a
     * write that did not land would silently lose the edits the dialog just
     * promised to keep.
     */
    async confirmLeaveWithUnsavedChanges(): Promise<boolean> {
        if (this.settingsForm.pristine) {
            return true;
        }

        const choice = await firstValueFrom(
            this.matDialog
                .open<
                    SettingsUnsavedChangesDialogComponent,
                    { canSave: boolean },
                    SettingsUnsavedChangesChoice
                >(SettingsUnsavedChangesDialogComponent, {
                    width: '440px',
                    data: { canSave: this.settingsForm.valid },
                })
                .afterClosed()
        );

        if (choice === 'save') {
            return this.persistSettings();
        }

        if (choice === 'discard') {
            // Also reverts the live theme preview — leaving must not keep a
            // theme the store never saved.
            this.discardChanges();
            return true;
        }

        return false;
    }

    /** @returns whether the write actually landed */
    private async persistSettings(): Promise<boolean> {
        try {
            await this.form.save(() => this.applyChangedSettings());
            return true;
        } catch (error) {
            if (error instanceof EpgSourceReconciliationError) {
                this.settingsSnackbar.open(
                    this.translate.instant('SETTINGS.EPG_DATA_CLEAR_FAILED')
                );
                return false;
            }
            // The store already applied the change in memory, so without
            // this the save looks successful until the next restart. The
            // unsaved-changes bar stays visible so it can be retried.
            this.settingsSnackbar.storageFailure('save');
            return false;
        }
    }

    /**
     * Throws away every staged form edit and returns to the persisted
     * settings. `applySavedSettings` also reverts the live theme preview
     * (`selectTheme` applies immediately) and marks the form pristine, which
     * hides the unsaved-changes bar.
     */
    discardChanges(): void {
        this.form.hydrateFromStore();
        this.form.applySavedSettings();
    }

    /**
     * Applies the changed settings to the app
     */
    applyChangedSettings(): void {
        this.form.applySavedSettings();
        this.epg.fetchConfiguredEpg();
        this.settingsSnackbar.open(
            this.translate.instant('SETTINGS.SETTINGS_SAVED')
        );
    }

    private isNavigableSection(sectionId: string): boolean {
        return this.sectionNav.some((section) => section.id === sectionId);
    }
}
