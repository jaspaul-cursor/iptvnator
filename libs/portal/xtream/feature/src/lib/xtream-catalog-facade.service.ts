import { Provider, Injectable, computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    PortalCatalogFacade,
    PortalCatalogItemProgress,
    PortalCatalogPlaylistMeta,
    PortalCatalogSortMode,
    PORTAL_CATALOG_FACADE,
    queuePwaVodDownloadJob,
    toPwaVodDownloadTitle,
    toPwaVodM3u8Url,
} from '@iptvnator/portal/shared/util';
import {
    XtreamStore,
    XtreamUrlService,
} from '@iptvnator/portal/xtream/data-access';
import { XtreamVodDetails } from '@iptvnator/shared/interfaces';
import { RuntimeCapabilitiesService } from '@iptvnator/services';
import { TranslateService } from '@ngx-translate/core';

const SORT_STORAGE_KEY = 'xtream-category-sort-mode';

const isValidSortMode = (
    mode: string | null
): mode is PortalCatalogSortMode =>
    mode === 'date-desc' ||
    mode === 'date-asc' ||
    mode === 'name-asc' ||
    mode === 'name-desc' ||
    mode === 'rating-desc' ||
    mode === 'rating-asc';

const isRatingSortMode = (mode: PortalCatalogSortMode): boolean =>
    mode === 'rating-desc' || mode === 'rating-asc';

@Injectable()
export class XtreamCatalogFacadeService implements PortalCatalogFacade<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
> {
    private readonly xtreamStore = inject(XtreamStore);
    private readonly xtreamUrlService = inject(XtreamUrlService);
    private readonly runtime = inject(RuntimeCapabilitiesService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly translateService = inject(TranslateService);
    private readonly pwaJobInFlight = new Set<number>();
    private loadedPositionsPlaylistId: string | null = null;

    readonly provider = 'xtream' as const;
    readonly contentType = this.xtreamStore.selectedContentType;
    readonly selectedCategory = this.xtreamStore.getSelectedCategory;
    readonly paginatedContent = this.xtreamStore.getPaginatedContent;
    readonly selectedItem = this.xtreamStore.selectedItem;
    readonly hasMore = this.xtreamStore.hasMoreContent;
    /** Appends are synchronous in-memory slices — never pending, never failing. */
    readonly isAppending = computed(() => false);
    readonly appendError = computed(() => false);
    readonly isPaginatedContentLoading =
        this.xtreamStore.isPaginatedContentLoading;
    readonly selectedCategoryTitle = computed(() => {
        const category = this.selectedCategory();
        return String(category?.['name'] ?? category?.['title'] ?? '');
    });
    readonly categoryItemCount = computed(
        () => this.xtreamStore.selectItemsFromSelectedCategory().length
    );
    readonly contentSortMode = computed<PortalCatalogSortMode>(() => {
        const mode = this.xtreamStore.contentSortMode();

        return !this.supportsRatingSort && isRatingSortMode(mode)
            ? 'date-desc'
            : mode;
    });
    get supportsRatingSort(): boolean {
        const type = this.contentType();
        return type === 'vod' || type === 'series';
    }
    readonly minRating = computed(() =>
        this.supportsRatingSort ? this.xtreamStore.minRating() : null
    );
    readonly playlist = computed<PortalCatalogPlaylistMeta | null>(() => {
        const playlist = this.xtreamStore.currentPlaylist();
        if (!playlist) {
            return null;
        }

        return {
            id: String(playlist.id),
            title: playlist.name ?? playlist.title ?? 'Xtream',
        };
    });

    initialize(categoryId?: string | null): void {
        const savedSortMode = localStorage.getItem(SORT_STORAGE_KEY);
        if (isValidSortMode(savedSortMode)) {
            this.setContentSortMode(savedSortMode);
        }

        const playlistId = this.xtreamStore.currentPlaylist()?.id;
        if (playlistId && this.loadedPositionsPlaylistId !== playlistId) {
            this.loadedPositionsPlaylistId = playlistId;
            // A failed initial load leaves the maps empty (same as before);
            // the read now rejects instead of masquerading as empty.
            void this.xtreamStore.loadAllPositions(playlistId).catch(() => {
                this.loadedPositionsPlaylistId = null;
            });
        }

        this.clearSelectedItem();

        if (categoryId) {
            this.xtreamStore.setSelectedCategory(Number(categoryId));
        } else {
            this.xtreamStore.setSelectedCategory(null);
        }
    }

    clearSelectedItem(): void {
        this.xtreamStore.setSelectedItem(null);
    }

    setSearchQuery(query: string): void {
        this.xtreamStore.setCategorySearchTerm(query);
    }

    loadMore(): void {
        this.xtreamStore.loadMoreContent();
    }

    retryAppend(): void {
        // In-memory appends cannot fail; nothing to retry.
    }

    saveScrollPosition(scrollTop: number): void {
        this.xtreamStore.saveCatalogScrollState(scrollTop);
    }

    consumeSavedScrollPosition(): number | null {
        return this.xtreamStore.consumeCatalogScrollState();
    }

    setContentSortMode(mode: PortalCatalogSortMode): void {
        if (!this.supportsRatingSort && isRatingSortMode(mode)) {
            return;
        }

        this.xtreamStore.setContentSortMode(mode);
        localStorage.setItem(SORT_STORAGE_KEY, mode);
    }

    setMinRating(value: number | null): void {
        if (!this.supportsRatingSort) {
            return;
        }

        this.xtreamStore.setMinRating(value);
    }

    selectItem(item: Record<string, unknown>): string[] | null {
        const xtreamId = item['xtream_id'];
        if (xtreamId === undefined || xtreamId === null) {
            return null;
        }

        const selectedCategoryId = this.xtreamStore.selectedCategoryId();
        if (selectedCategoryId !== null && selectedCategoryId !== undefined) {
            return [String(xtreamId)];
        }

        const categoryId = item['category_id'];
        if (categoryId === undefined || categoryId === null) {
            return null;
        }

        return [String(categoryId), String(xtreamId)];
    }

    getItemProgress(item: Record<string, unknown>): PortalCatalogItemProgress {
        const isSeries = this.contentType() === 'series';
        const itemId = Number(
            item['xtream_id'] ?? item['series_id'] ?? item['stream_id']
        );
        if (Number.isNaN(itemId)) {
            return {};
        }

        if (isSeries) {
            return {
                hasSeriesProgress: this.xtreamStore.hasSeriesProgress(itemId),
            };
        }

        return {
            progress: this.xtreamStore.getProgressPercent(itemId, 'vod'),
            isWatched: this.xtreamStore.isWatched(itemId, 'vod'),
        };
    }

    async queuePwaVodDownload(item: Record<string, unknown>): Promise<void> {
        const playlist = this.xtreamStore.currentPlaylist();
        if (
            !this.runtime.isPwa ||
            this.contentType() !== 'vod' ||
            !playlist
        ) {
            return;
        }

        const streamId = Number(item['xtream_id'] ?? item['stream_id']);
        if (
            !Number.isSafeInteger(streamId) ||
            streamId <= 0 ||
            this.pwaJobInFlight.has(streamId)
        ) {
            return;
        }

        const name = String(item['name'] ?? item['title'] ?? '');
        const vodItem = {
            stream_id: streamId,
            container_extension: 'm3u8',
        } as XtreamVodDetails;
        const url = toPwaVodM3u8Url(
            this.xtreamUrlService.constructVodUrl(playlist, vodItem)
        );
        const title = toPwaVodDownloadTitle(name);
        if (!url || !title) {
            return;
        }

        this.pwaJobInFlight.add(streamId);
        try {
            await queuePwaVodDownloadJob({ url, title });
            this.snackBar.open(
                this.translateService.instant('DOWNLOADS.STATUS.QUEUED'),
                undefined,
                { duration: 2000 }
            );
        } catch {
            this.snackBar.open(
                this.translateService.instant('DOWNLOADS.ACTION_FAILED'),
                undefined,
                { duration: 2000 }
            );
        } finally {
            this.pwaJobInFlight.delete(streamId);
        }
    }
}

export function provideXtreamCatalogFacade(): Provider[] {
    return [
        XtreamCatalogFacadeService,
        {
            provide: PORTAL_CATALOG_FACADE,
            useExisting: XtreamCatalogFacadeService,
        },
    ];
}
