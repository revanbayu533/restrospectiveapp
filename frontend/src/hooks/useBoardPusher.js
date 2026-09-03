import { useEffect, useRef, useState } from 'react';
import { getPusherClient } from '../services/pusher';

/**
 * Custom hook untuk subscribe ke realtime channel Pusher per board & presence tracking
 * @param {string} boardId - ID board yang sedang aktif
 * @param {object} handlers - Objek event handler realtime
 */
export function useBoardPusher(boardId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'

  useEffect(() => {
    if (!boardId) return;

    const pusher = getPusherClient();
    const channelName = `private-board-${boardId}`;
    const fallbackChannelName = `board-${boardId}`;

    // Update connection state
    if (pusher.connection) {
      setConnectionStatus(pusher.connection.state === 'connected' ? 'connected' : 'connecting');
      pusher.connection.bind('state_change', (states) => {
        setConnectionStatus(states.current === 'connected' ? 'connected' : (states.current === 'connecting' ? 'connecting' : 'disconnected'));
      });
    }

    let channel;
    try {
      channel = pusher.subscribe(channelName);
    } catch (err) {
      console.warn('[Pusher Subscribe Warn]', err);
    }

    // Event handler wrappers
    const handleCardCreated = (data) => {
      if (handlersRef.current.onCardCreated) handlersRef.current.onCardCreated(data);
    };

    const handleCardUpdated = (data) => {
      if (handlersRef.current.onCardUpdated) handlersRef.current.onCardUpdated(data);
    };

    const handleCardDeleted = (data) => {
      if (handlersRef.current.onCardDeleted) handlersRef.current.onCardDeleted(data);
    };

    const handleCardMoved = (data) => {
      if (handlersRef.current.onCardMoved) handlersRef.current.onCardMoved(data);
    };

    const handleCardGrouped = (data) => {
      if (handlersRef.current.onCardGrouped) handlersRef.current.onCardGrouped(data);
    };

    const handleGroupMoved = (data) => {
      if (handlersRef.current.onGroupMoved) handlersRef.current.onGroupMoved(data);
    };

    const handleGroupTitleUpdated = (data) => {
      if (handlersRef.current.onGroupTitleUpdated) handlersRef.current.onGroupTitleUpdated(data);
    };

    const handleVoteUpdated = (data) => {
      if (handlersRef.current.onVoteUpdated) handlersRef.current.onVoteUpdated(data);
    };

    const handleCommentCreated = (data) => {
      if (handlersRef.current.onCommentCreated) handlersRef.current.onCommentCreated(data);
    };

    const handleCommentDeleted = (data) => {
      if (handlersRef.current.onCommentDeleted) handlersRef.current.onCommentDeleted(data);
    };

    const handleTimerUpdated = (data) => {
      if (handlersRef.current.onTimerUpdated) handlersRef.current.onTimerUpdated(data);
    };

    const bindAllEvents = (ch) => {
      ch.bind('card.created', handleCardCreated);
      ch.bind('card.updated', handleCardUpdated);
      ch.bind('card.deleted', handleCardDeleted);
      ch.bind('card.moved', handleCardMoved);
      ch.bind('card.grouped', handleCardGrouped);
      ch.bind('group.moved', handleGroupMoved);
      ch.bind('group.title_updated', handleGroupTitleUpdated);
      ch.bind('vote.updated', handleVoteUpdated);
      ch.bind('comment.created', handleCommentCreated);
      ch.bind('comment.deleted', handleCommentDeleted);
      ch.bind('timer.updated', handleTimerUpdated);
    };

    const unbindAllEvents = (ch) => {
      ch.unbind('card.created', handleCardCreated);
      ch.unbind('card.updated', handleCardUpdated);
      ch.unbind('card.deleted', handleCardDeleted);
      ch.unbind('card.moved', handleCardMoved);
      ch.unbind('card.grouped', handleCardGrouped);
      ch.unbind('group.moved', handleGroupMoved);
      ch.unbind('group.title_updated', handleGroupTitleUpdated);
      ch.unbind('vote.updated', handleVoteUpdated);
      ch.unbind('comment.created', handleCommentCreated);
      ch.unbind('comment.deleted', handleCommentDeleted);
      ch.unbind('timer.updated', handleTimerUpdated);
    };

    if (channel) {
      bindAllEvents(channel);

      // Fallback jika auth private gagal, subscribe ke public channel
      channel.bind('pusher:subscription_error', (status) => {
        console.warn(`[Pusher Private Auth Error ${status}], subscribe fallback ke public channel...`);
        const fallbackChannel = pusher.subscribe(fallbackChannelName);
        bindAllEvents(fallbackChannel);
      });
    }

    return () => {
      if (channel) {
        unbindAllEvents(channel);
        pusher.unsubscribe(channelName);
        pusher.unsubscribe(fallbackChannelName);
      }
    };
  }, [boardId]);

  return { connectionStatus };
}
