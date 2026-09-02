import { useEffect, useRef } from 'react';
import { getPusherClient } from '../services/pusher';

/**
 * Custom hook untuk subscribe ke realtime channel Pusher per board
 * @param {string} boardId - ID board yang sedang aktif
 * @param {object} handlers - Objek event handler realtime
 * @param {function} [handlers.onCardCreated] - Callback saat card baru dibuat
 * @param {function} [handlers.onCardUpdated] - Callback saat isi card diperbarui
 * @param {function} [handlers.onCardDeleted] - Callback saat card dihapus
 * @param {function} [handlers.onVoteUpdated] - Callback saat vote card diperbarui
 * @param {function} [handlers.onCommentCreated] - Callback saat komentar baru dibuat
 * @param {function} [handlers.onTimerUpdated] - Callback saat timer board diperbarui
 */
export function useBoardPusher(boardId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!boardId) return;

    const pusher = getPusherClient();
    const channelName = `private-board-${boardId}`;
    const fallbackChannelName = `board-${boardId}`;

    // 1. Subscribe ke private channel (utama)
    let channel;
    try {
      channel = pusher.subscribe(channelName);
    } catch (err) {
      console.warn('[Pusher Subscribe Warn]', err);
    }

    // 2. Event handler wrapper yang selalu memanggil ref handler terbaru
    const handleCardCreated = (data) => {
      if (handlersRef.current.onCardCreated) {
        handlersRef.current.onCardCreated(data);
      }
    };

    const handleCardUpdated = (data) => {
      if (handlersRef.current.onCardUpdated) {
        handlersRef.current.onCardUpdated(data);
      }
    };

    const handleCardDeleted = (data) => {
      if (handlersRef.current.onCardDeleted) {
        handlersRef.current.onCardDeleted(data);
      }
    };

    const handleVoteUpdated = (data) => {
      if (handlersRef.current.onVoteUpdated) {
        handlersRef.current.onVoteUpdated(data);
      }
    };

    const handleCommentCreated = (data) => {
      if (handlersRef.current.onCommentCreated) {
        handlersRef.current.onCommentCreated(data);
      }
    };

    const handleTimerUpdated = (data) => {
      if (handlersRef.current.onTimerUpdated) {
        handlersRef.current.onTimerUpdated(data);
      }
    };

    // 3. Bind events ke channel
    if (channel) {
      channel.bind('card.created', handleCardCreated);
      channel.bind('card.updated', handleCardUpdated);
      channel.bind('card.deleted', handleCardDeleted);
      channel.bind('vote.updated', handleVoteUpdated);
      channel.bind('comment.created', handleCommentCreated);
      channel.bind('timer.updated', handleTimerUpdated);

      // Fallback jika auth private gagal, coba subscribe ke public channel
      channel.bind('pusher:subscription_error', (status) => {
        console.warn(`[Pusher Private Auth Error ${status}], mencoba subscribe ke public channel...`);
        const fallbackChannel = pusher.subscribe(fallbackChannelName);
        fallbackChannel.bind('card.created', handleCardCreated);
        fallbackChannel.bind('card.updated', handleCardUpdated);
        fallbackChannel.bind('card.deleted', handleCardDeleted);
        fallbackChannel.bind('vote.updated', handleVoteUpdated);
        fallbackChannel.bind('comment.created', handleCommentCreated);
        fallbackChannel.bind('timer.updated', handleTimerUpdated);
      });
    }

    // 4. Cleanup saat unmount atau boardId berubah
    return () => {
      if (channel) {
        channel.unbind('card.created', handleCardCreated);
        channel.unbind('card.updated', handleCardUpdated);
        channel.unbind('card.deleted', handleCardDeleted);
        channel.unbind('vote.updated', handleVoteUpdated);
        channel.unbind('comment.created', handleCommentCreated);
        channel.unbind('timer.updated', handleTimerUpdated);
        pusher.unsubscribe(channelName);
        pusher.unsubscribe(fallbackChannelName);
      }
    };
  }, [boardId]);
}
