import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
    EpgRuntimeBridgeService,
    EpgService,
} from '@iptvnator/epg/data-access';
import { EpgProgressPanelComponent } from '@iptvnator/ui/epg/progress-panel';
import { PlaylistActions } from '@iptvnator/m3u-state';
import { SettingsStore, EpgSourceSettingsService } from '@iptvnator/services';
import {
    Language,
    Settings,
    STORE_KEY,
    Theme,
    createDevLogger,
} from '@iptvnator/shared/interfaces';
import { SettingsService } from './services/settings.service';
import { PlaybackKeepAwakeService } from './services/playback-keep-awake.service';
import { AppStartupStatusComponent } from './app-startup-status.component';

const debugAppComponent = createDevLogger('AppComponent');

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [
        AppStartupStatusComponent,
        EpgProgressPanelComponent,
        RouterOutlet,
    ],
})
export class AppComponent implements OnInit {
    readonly routeReady = signal(false);
    private epgBridge = inject(EpgRuntimeBridgeService);
    private epgService = inject(EpgService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private store = inject(Store);
    private translate = inject(TranslateService);
    private settingsService = inject(SettingsService);
    private settingsStore = inject(SettingsStore);
    private readonly epgSources = inject(EpgSourceSettingsService);
    private playbackKeepAwake = inject(PlaybackKeepAwakeService);

    /** Default language as fallback */
    private readonly DEFAULT_LANG = Language.ENGLISH;

    constructor() {
        // Keep the display awake while a built-in player is playing video
        // (PWA Screen Wake Lock, issue #1095).
        this.playbackKeepAwake.start();

        effect(() => {
            const size = this.settingsStore.coverSize?.() ?? 'medium';
            document.documentElement.dataset.coverSize = size;
        });
    }

    ngOnInit() {
        this.store.dispatch(PlaylistActions.loadPlaylists());
        this.translate.setDefaultLang(this.DEFAULT_LANG);

        this.initSettings();
    }

    /**
     * Reads the settings object from local storage and initializes the
     * application based on them
     */
    initSettings(): void {
        this.settingsService
            .getValueFromLocalStorage<Settings>(STORE_KEY.Settings)
            .subscribe((settings: Settings) => {
                if (settings && Object.keys(settings).length > 0) {
                    const resolvedLang = settings.language ?? this.DEFAULT_LANG;
                    this.translate.use(resolvedLang);
                    // Mirror the active language to localStorage so the next
                    // cold start can read it synchronously in app.config.ts's
                    // getInitialLanguage() and avoid the English-then-localized
                    // flash for non-English users.
                    try {
                        localStorage.setItem(
                            'iptvnator:preferred-language',
                            resolvedLang
                        );
                    } catch {
                        // Ignore quota / privacy mode errors.
                    }

                    // Fetch EPG if URLs are configured (only fetch stale data)
                    if (
                        this.epgBridge.supportsImport &&
                        settings.epgUrl?.length > 0 &&
                        settings.epgUrl?.some((u) => u !== '')
                    ) {
                        this.fetchStaleEpgData(settings.epgUrl);
                    }

                    if (settings.theme) {
                        this.settingsService.changeTheme(settings.theme);
                    } else {
                        this.detectDarkMode();
                    }
                } else {
                    this.detectDarkMode();
                }
            });
    }

    /**
     * Applies the operating system color scheme when no explicit theme is set
     */
    detectDarkMode(): void {
        this.settingsService.changeTheme(Theme.SystemTheme);
    }

    /**
     * Navigate to the specified route
     * @param route route to navigate to
     */
    navigateToRoute(route: string) {
        this.router.navigateByUrl(route);
    }

    /**
     * Fetches EPG data only for URLs that have stale or missing data.
     * Data is considered fresh if updated within the last 12 hours.
     */
    private async fetchStaleEpgData(urls: string[]): Promise<void> {
        await this.settingsStore.loadSettings();
        const revision = this.epgSources.revision();
        const fetchCurrentSources = async (sources: string[]) => {
            await this.epgSources.waitForReconciliation();
            this.epgService.fetchEpg(
                this.epgSources.retainCurrentSources(sources, revision)
            );
        };
        if (!this.epgBridge.supportsSourceFreshness) {
            await fetchCurrentSources(urls);
            return;
        }

        try {
            const result = await this.epgBridge.checkFreshness(urls, 12);

            if (!result) {
                await fetchCurrentSources(urls);
                return;
            }

            if (result.freshUrls.length > 0) {
                debugAppComponent(
                    `EPG: ${result.freshUrls.length} source(s) already fresh, skipping fetch`
                );
                // Show snackbar if all EPG sources are fresh (no stale URLs)
                if (result.staleUrls.length === 0) {
                    this.snackBar.open(
                        this.translate.instant('EPG.UP_TO_DATE'),
                        this.translate.instant('CLOSE'),
                        { duration: 3000 }
                    );
                }
            }

            if (result.staleUrls.length > 0) {
                debugAppComponent(
                    `EPG: Fetching ${result.staleUrls.length} stale source(s)`
                );
                await fetchCurrentSources(result.staleUrls);
            }
        } catch (error) {
            console.error('Error checking EPG freshness, fetching all:', error);
            // Fallback: fetch all URLs if freshness check fails
            await fetchCurrentSources(urls);
        }
    }
}
