const MultiplayerOnline = (() => {
    let peer = null;
    let conn = null;
    let roomCode = '';
    let isHost = false;
    let playerColor = ChessEngine.COLOR_WHITE;
    let onConnected = null;
    let onDisconnected = null;
    let onMoveReceived = null;
    let onError = null;

    function generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    function createRoom() {
        return new Promise((resolve, reject) => {
            roomCode = generateRoomCode();
            isHost = true;
            playerColor = ChessEngine.COLOR_WHITE;

            peer = new Peer('regicide-' + roomCode);
            peer.on('open', () => {
                resolve(roomCode);
            });
            peer.on('connection', (connection) => {
                conn = connection;
                setupConnection();
            });
            peer.on('error', (err) => {
                if (onError) onError(err.message);
                reject(err);
            });
        });
    }

    function joinRoom(code) {
        return new Promise((resolve, reject) => {
            roomCode = code.toUpperCase();
            isHost = false;
            playerColor = ChessEngine.COLOR_BLACK;

            peer = new Peer();
            peer.on('open', () => {
                conn = peer.connect('regicide-' + roomCode);
                conn.on('open', () => {
                    setupConnection();
                    resolve();
                });
                conn.on('error', (err) => {
                    if (onError) onError(err.message);
                    reject(err);
                });
            });
            peer.on('error', (err) => {
                if (onError) onError(err.message);
                reject(err);
            });
        });
    }

    function setupConnection() {
        if (onConnected) onConnected();

        conn.on('data', (data) => {
            if (data.type === 'move' && onMoveReceived) {
                onMoveReceived(data.move);
            }
        });

        conn.on('close', () => {
            if (onDisconnected) onDisconnected();
        });
    }

    function sendMove(move) {
        if (conn && conn.open) {
            conn.send({ type: 'move', move });
        }
    }

    function disconnect() {
        if (conn) conn.close();
        if (peer) peer.destroy();
        conn = null;
        peer = null;
    }

    function getRoomCode() { return roomCode; }
    function getPlayerColor() { return playerColor; }
    function isConnected() { return conn && conn.open; }

    function setOnConnected(fn) { onConnected = fn; }
    function setOnDisconnected(fn) { onDisconnected = fn; }
    function setOnMoveReceived(fn) { onMoveReceived = fn; }
    function setOnError(fn) { onError = fn; }

    return {
        createRoom, joinRoom, sendMove, disconnect,
        getRoomCode, getPlayerColor, isConnected,
        setOnConnected, setOnDisconnected, setOnMoveReceived, setOnError
    };
})();
