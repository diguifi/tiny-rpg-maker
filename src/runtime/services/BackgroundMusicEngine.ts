import {
    buildBackgroundMusicEmbedUrl,
    normalizeBackgroundMusicVideoId,
} from '../infra/share/BackgroundMusicVideoId';

class BackgroundMusicEngine {
    private videoId: string | null = null;
    private iframe: HTMLIFrameElement | null = null;

    setVideoId(videoId?: string | null): void {
        this.videoId = normalizeBackgroundMusicVideoId(videoId) ?? null;
        if (!this.videoId) {
            this.stop();
        } else if (this.iframe) {
            this.mountIframe();
        }
    }

    play(): void {
        if (!this.videoId || typeof document === 'undefined') {
            return;
        }

        this.mountIframe();
    }

    stop(): void {
        this.iframe?.remove();
        this.iframe = null;
    }

    syncFromGame(game: { backgroundMusicVideoId?: string }): void {
        this.setVideoId(game?.backgroundMusicVideoId);
    }

    destroy(): void {
        this.stop();
        this.videoId = null;
    }

    private mountIframe(): void {
        if (!this.videoId || typeof document === 'undefined') {
            return;
        }

        const src = buildBackgroundMusicEmbedUrl(this.videoId);
        if (!src) {
            this.stop();
            return;
        }

        if (!this.iframe) {
            this.iframe = document.createElement('iframe');
            this.iframe.width = '0';
            this.iframe.height = '0';
            this.iframe.setAttribute('aria-hidden', 'true');
            this.iframe.setAttribute('allow', 'autoplay; encrypted-media');
            this.iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            this.iframe.tabIndex = -1;
            Object.assign(this.iframe.style, {
                position: 'fixed',
                width: '0',
                height: '0',
                border: '0',
                opacity: '0',
                pointerEvents: 'none',
            });
            document.body.appendChild(this.iframe);
        } else if (!this.iframe.isConnected) {
            document.body.appendChild(this.iframe);
        }

        if (this.iframe.src !== src) {
            this.iframe.src = src;
        }
    }
}

export { BackgroundMusicEngine };
