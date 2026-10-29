/**
 * Battle Spirits Eternal - Real-Time 1v1 Multiplayer Service
 * Powered by Firebase Realtime Database.
 * Synchronizes room creation, invitations by 8-Digit Duelist ID, and combat action packets.
 */

(function(window) {
  'use strict';

  let currentRoomId = null;
  let isHost = false;
  let opponentDuelist = null;
  let roomListenerRef = null;
  let actionsListenerRef = null;
  let actionCallback = null;

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BSE-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const MultiplayerService = {
    getCurrentRoomId: () => currentRoomId,
    isHost: () => isHost,
    getOpponent: () => opponentDuelist,

    /**
     * Host creates a new online duel room
     */
    async createRoom(deck, targetDuelistId = null) {
      const rtdb = window.FirebaseService ? window.FirebaseService.getDatabase() : null;
      if (!rtdb) throw new Error("Firebase Realtime Database is not connected.");

      const user = window.FirebaseService.getUser();
      const myDuelistId = window.FirebaseService.getDuelistId() || '00000000';
      const myName = user ? (user.displayName || 'Duelist') : 'Player 1';
      const roomId = generateRoomCode();

      const roomData = {
        id: roomId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        status: 'waiting', // waiting -> battling -> concluded
        host: {
          uid: user ? user.uid : 'anon-host',
          name: myName,
          duelistId: myDuelistId,
          deck: deck
        },
        guest: null,
        targetDuelistId: targetDuelistId ? String(targetDuelistId).replace(/[^0-9]/g, '') : null,
        currentTurn: 'host',
        step: 'START',
        syncState: null
      };

      await rtdb.ref(`rooms/${roomId}`).set(roomData);
      currentRoomId = roomId;
      isHost = true;

      // If invited specific 8-digit Duelist ID, post to their invites
      if (roomData.targetDuelistId) {
        await rtdb.ref(`invites/${roomData.targetDuelistId}/${roomId}`).set({
          roomId,
          hostName: myName,
          hostDuelistId: myDuelistId,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }

      this._bindRoomListeners(roomId);
      return { roomId, isHost: true };
    },

    /**
     * Challenger joins an existing room by code
     */
    async joinRoom(roomCode, deck) {
      const rtdb = window.FirebaseService ? window.FirebaseService.getDatabase() : null;
      if (!rtdb) throw new Error("Firebase Realtime Database is not connected.");

      const cleanCode = roomCode.trim().toUpperCase();
      const user = window.FirebaseService.getUser();
      const myDuelistId = window.FirebaseService.getDuelistId() || '00000000';
      const myName = user ? (user.displayName || 'Challenger') : 'Player 2';

      const snap = await rtdb.ref(`rooms/${cleanCode}`).get();
      if (!snap.exists()) {
        throw new Error(`Duel room "${cleanCode}" not found.`);
      }

      const roomData = snap.val();
      if (roomData.status !== 'waiting' && roomData.guest) {
        throw new Error(`Duel room "${cleanCode}" is already full.`);
      }

      const guestData = {
        uid: user ? user.uid : 'anon-guest',
        name: myName,
        duelistId: myDuelistId,
        deck: deck
      };

      await rtdb.ref(`rooms/${cleanCode}`).update({
        guest: guestData,
        status: 'battling'
      });

      currentRoomId = cleanCode;
      isHost = false;
      opponentDuelist = roomData.host;

      this._bindRoomListeners(cleanCode);
      return { roomId: cleanCode, isHost: false, host: roomData.host };
    },

    /**
     * Send a combat or game action to the opponent
     */
    async sendAction(actionType, payload = {}) {
      if (!currentRoomId) return;
      const rtdb = window.FirebaseService.getDatabase();
      if (!rtdb) return;

      const actionPacket = {
        sender: isHost ? 'host' : 'guest',
        type: actionType,
        payload: payload,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };

      await rtdb.ref(`rooms/${currentRoomId}/actions`).push(actionPacket);
    },

    /**
     * Listen for incoming action packets from opponent
     */
    onOpponentAction(callback) {
      actionCallback = callback;
    },

    /**
     * Clean up room listeners upon leave / match conclusion
     */
    leaveRoom() {
      if (currentRoomId && window.FirebaseService) {
        const rtdb = window.FirebaseService.getDatabase();
        if (rtdb) {
          if (roomListenerRef) rtdb.ref(`rooms/${currentRoomId}`).off('value', roomListenerRef);
          if (actionsListenerRef) rtdb.ref(`rooms/${currentRoomId}/actions`).off('child_added', actionsListenerRef);
        }
      }
      currentRoomId = null;
      opponentDuelist = null;
      isHost = false;
    },

    _bindRoomListeners(roomId) {
      const rtdb = window.FirebaseService.getDatabase();
      if (!rtdb) return;

      // Listen to room status changes (e.g. guest joining)
      roomListenerRef = rtdb.ref(`rooms/${roomId}`).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (isHost && data.guest && !opponentDuelist) {
          opponentDuelist = data.guest;
          window.dispatchEvent(new CustomEvent('bse_opponent_joined', { detail: data.guest }));
        }

        if (data.status === 'concluded') {
          window.dispatchEvent(new CustomEvent('bse_duel_concluded', { detail: data }));
        }
      });

      // Listen for action packets
      let isFirstSync = true;
      actionsListenerRef = rtdb.ref(`rooms/${roomId}/actions`).limitToLast(20).on('child_added', (snapshot) => {
        const action = snapshot.val();
        if (!action) return;

        // Skip our own actions
        const myRole = isHost ? 'host' : 'guest';
        if (action.sender !== myRole && actionCallback) {
          actionCallback(action);
        }
      });
    }
  };

  window.MultiplayerService = MultiplayerService;

})(window);
