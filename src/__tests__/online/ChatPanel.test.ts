import { beforeEach, describe, expect, it } from 'vitest';
import { ChatPanel } from '../../online/ui/ChatPanel';
import type { ChatEntry, OnlineMessage } from '../../online/shared/protocol';

// Minimal stand-in for OnlineClient: records outbound messages and lets a test
// drive inbound ones via emit().
class FakeClient {
    readonly sessionToken = 'me-token';
    isConnected = true;
    readonly sent: OnlineMessage[] = [];
    private handlers = new Map<string, Array<(msg: OnlineMessage) => void>>();

    on(type: string, handler: (msg: OnlineMessage) => void): () => void {
        const arr = this.handlers.get(type) ?? [];
        arr.push(handler);
        this.handlers.set(type, arr);
        return () => {};
    }

    send(msg: OnlineMessage): void {
        this.sent.push(msg);
    }

    emit(type: string, msg: OnlineMessage): void {
        (this.handlers.get(type) ?? []).forEach((h) => h(msg));
    }
}

const echo = (overrides: Partial<ChatEntry>): ChatEntry => ({
    id: 'srv-1',
    playerId: 'me-token',
    playerName: 'Me',
    text: 'hello',
    sentAt: 1_000,
    ...overrides,
});

const setup = () => {
    document.body.innerHTML = '<div id="game-container"></div>';
    const client = new FakeClient();
    const panel = new ChatPanel(client as never);
    panel.mountNearControls();
    panel.bind();
    const form = document.querySelector<HTMLFormElement>('.online-chat__form');
    const input = document.querySelector<HTMLInputElement>('.online-chat__input');
    if (!form || !input) throw new Error('chat DOM not mounted');
    const sendText = (value: string) => {
        input.value = value;
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    };
    const receive = (entry: ChatEntry) => {
        client.emit('chat-message', { type: 'chat-message', message: entry } as OnlineMessage);
    };
    const messageCount = () => document.querySelectorAll('.online-chat__message').length;
    return { client, panel, form, input, sendText, receive, messageCount };
};

describe('ChatPanel', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('shows the message optimistically and sends it once', () => {
        const { client, sendText, messageCount } = setup();
        sendText('hello there');
        expect(messageCount()).toBe(1);
        expect(client.sent).toHaveLength(1);
        expect(client.sent[0]).toMatchObject({ type: 'chat-message' });
    });

    it('clears and refocuses the input after sending', () => {
        const { input, sendText } = setup();
        sendText('hi');
        expect(input.value).toBe('');
        expect(document.activeElement).toBe(input);
    });

    it('replaces the optimistic entry with the server echo even with clock skew', () => {
        const { sendText, receive, messageCount } = setup();
        sendText('hello');
        // Server clock is 100 s ahead of the client — the old time-window dedup
        // (< 5 s) would have failed and shown the message twice.
        receive(echo({ text: 'hello', sentAt: Date.now() + 100_000 }));
        expect(messageCount()).toBe(1);
    });

    it('dedupes when the server collapses internal whitespace', () => {
        const { sendText, receive, messageCount } = setup();
        // The optimistic entry normalizes "hello   world" to "hello world", which
        // matches the whitespace-collapsed text the server echoes back.
        sendText('hello   world');
        receive(echo({ text: 'hello world' }));
        expect(messageCount()).toBe(1);
    });

    it('appends messages from other players', () => {
        const { sendText, receive, messageCount } = setup();
        sendText('hello');
        receive(echo({ id: 'srv-2', playerId: 'other-token', playerName: 'Other', text: 'hi' }));
        expect(messageCount()).toBe(2);
    });
});
