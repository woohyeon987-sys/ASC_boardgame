// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 🔥 LiveReload 서버 (파일 변경 시 자동 새로고침)
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname);

liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});

// 🔥 HTML에 LiveReload 스크립트 자동 삽입
app.use(connectLiveReload());

// 정적 파일 제공 (NEWONE.html, css.css, chess.js 등)
app.use(express.static(__dirname));

// 🔥 방 정보 메모리에 저장
// rooms = { roomCode: { players: [{socketId, playerId}], state: {...}} }
const rooms = {};

io.on("connection", (socket) => {
    console.log("새 클라이언트 접속:", socket.id);

    // 방 입장
    socket.on("joinRoom", (roomCode, callback) => {
        if (!roomCode || typeof roomCode !== "string") {
            callback({ ok: false, message: "유효한 방 코드를 입력하세요." });
            return;
        }

        roomCode = roomCode.trim();

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                state: null
            };
        }

        const room = rooms[roomCode];

        if (room.players.length >= 2) {
            callback({ ok: false, message: "이미 두 명이 있는 방입니다." });
            return;
        }

        const playerId = room.players.length === 0 ? "p1" : "p2";
        room.players.push({ socketId: socket.id, playerId });
        socket.join(roomCode);

        console.log(`플레이어 ${playerId}가 방 ${roomCode} 입장`);

        callback({
            ok: true,
            playerId,
            state: room.state
        });

        // 기존 상태가 있으면 새로 들어온 사람에게 전달
        if (room.state) {
            socket.emit("gameStateUpdate", room.state);
        }

        // 두 명 입장 시 게임 시작 신호
        if (room.players.length === 2) {
            io.to(roomCode).emit("startGameNow");
        }
    });

    // 게임 상태 동기화
    socket.on("syncGameState", ({ roomCode, state }) => {
        if (!rooms[roomCode]) return;
        rooms[roomCode].state = state;
        io.to(roomCode).emit("gameStateUpdate", state);
    });

    // 접속 종료
    socket.on("disconnect", () => {
        console.log("클라이언트 연결 해제:", socket.id);
        for (const [roomCode, room] of Object.entries(rooms)) {
            const idx = room.players.findIndex(p => p.socketId === socket.id);
            if (idx !== -1) {
                const pid = room.players[idx].playerId;
                room.players.splice(idx, 1);
                console.log(`방 ${roomCode}에서 ${pid} 퇴장`);
                if (room.players.length === 0) {
                    delete rooms[roomCode];
                    console.log(`방 ${roomCode} 삭제`);
                }
                break;
            }
        }
    });
});

const PORT = 3000;

// 🔥 0.0.0.0 으로 열어서 같은 와이파이 다른 노트북도 접속 가능
server.listen(PORT, "0.0.0.0", () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
