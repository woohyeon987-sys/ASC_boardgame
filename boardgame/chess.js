
const UNIT_EXPLAIN = {
    "king": {
        icon: "👑",
        name: "왕",
        text: "패배 조건. 공격력 없음."
    },
    "전사": {
        icon: "⚔️",
        name: "전사",
        text: "HP 12 / 근접 공격 / 1칸 이동."
    },
    "기사": {
        icon: "🗡️",
        name: "기사",
        text: "HP 15 / 1칸 이동 / 앞에서 팀을 지켜줌."
    },
    "궁수": {
        icon: "🏹",
        name: "궁수",
        text: "사거리 3 / 원거리 공격 / 재빠른 이동."
    },
    "마법사": {
        icon: "🔮",
        name: "마법사",
        text: "직선·대각선 사거리 3 / 높은 공격력."
    },
    "대포": {
        icon: "💣",
        name: "대포",
        text: "좌우 직선 사거리 4 / 이동 불가 / 매우 강한 공격력."
    }
};
// 게임 상태 변수들
const CARD_LIBRARY = [
    { id: 1, name: "기사", cost: 3, hp: 15, atk: 4, range: 1, move: 1, size: 1, icon: "🗡️" },
    { id: 2, name: "전사", cost: 2, hp: 12, atk: 3, range: 1, move: 1, size: 1, icon: "⚔️" },
    { id: 3, name: "마법사", cost: 4, hp: 10, atk: 5, range: 3, move: 2, size: 1, icon: "🔮" },
    { id: 4, name: "대포", cost: 5, hp: 20, atk: 7, range: 4, move: 0, size: 1, icon: "💣" },
    { id: 5, name: "궁수", cost: 3, hp: 10, atk: 3, range: 3, move: 3, size: 1, icon: "🏹" }
];

let boardUnits = Array(64).fill(null);
let selectedCard = null;
let selectedUnit = null;
let attackMode = false;
let kingPlaced = false;
let gold = 2;
let refreshCount = 2;
let turn = 1;
let currentPlayer = "player";
let playerLevel = 1;
let maxPlaceCells = 4;

// 초기화
window.onload = () => {
    initBoard();
    renderCardList();
    updateGoldDisplay();

    document.getElementById('refreshBtn').onclick = refreshShop;
    document.getElementById('endTurnBtn').onclick = nextTurn;
    document.getElementById('levelUpBtn').onclick = levelUp;
};

function initBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.onclick = () => onCellClick(i);
        board.appendChild(cell);
    }
}

function renderBoard() {
    for (let i = 0; i < 64; i++) {
        const cell = document.querySelector(`.cell[data-index="${i}"]`);
        cell.innerHTML = '';

        if (boardUnits[i] && !boardUnits[i].ref) {
            const unit = boardUnits[i];
            const unitDiv = document.createElement('div');
            unitDiv.className = `unit ${unit.owner === 'player' ? 'player-unit' : 'ai-unit'}`;
            if (unit.type === 'king') unitDiv.classList.add('king-unit');

            unitDiv.innerHTML = unit.icon || (unit.type === 'king' ? '👑' : '⚔️');

            const hpBar = document.createElement('div');
            hpBar.className = 'hp-bar';
            const hpFill = document.createElement('div');
            hpFill.className = 'hp-fill';
            hpFill.style.width = `${(unit.hp / unit.maxHp) * 100}%`;
            hpBar.appendChild(hpFill);
            unitDiv.appendChild(hpBar);

            cell.appendChild(unitDiv);
        }
    }
}

function renderCardList() {
    const cardList = document.getElementById('cardList');
    cardList.innerHTML = '';

    let affordable = CARD_LIBRARY.filter(c => c.cost <= gold);
    if (affordable.length === 0) {
        const minCost = Math.min(...CARD_LIBRARY.map(c => c.cost));
        affordable = CARD_LIBRARY.filter(c => c.cost === minCost);
    }

    const pool = [];
    while (pool.length < 3) {
        pool.push(affordable[Math.floor(Math.random() * affordable.length)]);
    }

    pool.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
                    <div style="font-size: 2em; text-align: center;">${card.icon}</div>
                    <div><b>${card.name}</b></div>
                    <div>비용: ${card.cost} 💎</div>
                    <div>HP: ${card.hp} | 공격: ${card.atk}</div>
                    <div>사거리: ${card.range} | 이동: ${card.move}</div>
                `;
        div.onclick = () => selectCard(card, div);
        cardList.appendChild(div);
    });
}

function selectCard(card, element) {
    if (currentPlayer !== "player") return;
    selectedCard = card;
    attackMode = false;
    selectedUnit = null;

    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('infoBox').innerText = `${card.name} 선택됨`;
}

function onCellClick(index) {
    const clicked = boardUnits[index];

    /** 1) 유닛 설명은 가장 먼저 실행 **/
    if (clicked && !clicked.ref) {
        const info = document.getElementById("unitInfo");
        const explain = UNIT_EXPLAIN[clicked.type] || UNIT_EXPLAIN["king"];

        info.innerHTML = `
            <b style="font-size:22px;">${explain.icon} ${explain.name}</b><br><br>
            <b>HP:</b> ${clicked.hp} / ${clicked.maxHp}<br>
            <b>ATK:</b> ${clicked.atk}<br>
            <b>Range:</b> ${clicked.range}<br>
            <b>Move:</b> ${clicked.move}<br><br>
            <span style="font-size:14px;color:#444;">${explain.text}</span>
        `;
    }

    /** 2) 왕 배치 **/
    if (!kingPlaced && !selectedCard) {
        placeKing(index);
        return;
    }

    /** 3) 카드 배치 **/
    if (selectedCard) {
        tryPlaceCard(index, selectedCard);
        selectedCard = null;
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        return;
    }

    let realIndex = index;
    let realUnit = clicked;
    if (clicked && clicked.ref !== undefined) {
        realIndex = clicked.ref;
        realUnit = boardUnits[realIndex];
    }

    /** 4) 플레이어 유닛 선택 **/
    if (realUnit && realUnit.owner === "player") {
        if (realUnit.acted) {
            document.getElementById('infoBox').innerText = "이미 행동한 유닛입니다.";
            return;
        }

        selectedUnit = realIndex;
        attackMode = true;
        highlightRanges(realIndex);
        document.getElementById('infoBox').innerText =
            "공격할 적 유닛을 선택하거나 빈 칸을 눌러 이동하세요.";
        return;
    }

    /** 5) 공격 **/
    if (attackMode && selectedUnit !== null) {
        if (clicked && clicked.owner === "ai") {
            const attacker = boardUnits[selectedUnit];
            if (canUnitAttack(attacker, selectedUnit, index)) {
                performAttack(selectedUnit, index);
                attackMode = false;
                selectedUnit = null;
                clearHighlights();
                return;
            }
        }
    }

    /** 6) 이동 **/
    if (!clicked && attackMode && selectedUnit !== null) {
        const u = boardUnits[selectedUnit];
        const dist = Math.abs((selectedUnit % 8) - (index % 8)) +
            Math.abs(Math.floor(selectedUnit / 8) - Math.floor(index / 8));

        if (!u.moved && dist <= (u.move || 0)) {
            u.moved = true;
            boardUnits[index] = u;
            boardUnits[selectedUnit] = null;
            renderBoard();
            document.getElementById('infoBox').innerText = "이동 완료!";
        }

        selectedUnit = null;
        attackMode = false;
        clearHighlights();
        return;
    }

    selectedUnit = null;
    attackMode = false;
    clearHighlights();
}


function placeKing(index) {
    if (boardUnits[index]) return;

    boardUnits[index] = {
        hp: 50, maxHp: 50, atk: 0, range: 1, move: 0,
        owner: "player", type: "king", moved: false, acted: false,
        size: 1, anchor: index, icon: "👑"
    };

    kingPlaced = true;
    spawnAIKing();
    renderBoard();
    document.getElementById('infoBox').innerText = "카드를 구매하고 배치하세요!";
}

function spawnAIKing() {
    let playerKingIndex = -1;
    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (u && u.type === "king" && u.owner === "player") {
            playerKingIndex = i;
            break;
        }
    }

    let aiIndex;
    if (playerKingIndex !== -1) {
        const pr = Math.floor(playerKingIndex / 8);
        const pc = playerKingIndex % 8;
        const ar = 7 - pr;
        const ac = pc;
        aiIndex = ar * 8 + ac;
    } else {
        aiIndex = 7 * 8 + 3;
    }

    if (boardUnits[aiIndex]) {
        for (let i = 56; i < 64; i++) {
            if (!boardUnits[i]) {
                aiIndex = i;
                break;
            }
        }
    }

    boardUnits[aiIndex] = {
        hp: 50, maxHp: 50, atk: 0, range: 1, move: 0,
        owner: "ai", type: "king", moved: true, acted: true,
        size: 1, anchor: aiIndex, icon: "👑"
    };
}

function tryPlaceCard(index, card) {
    if (!kingPlaced) {
        alert("먼저 왕을 배치해야 합니다.");
        return;
    }
    if (gold < card.cost) {
        alert("보석이 부족합니다!");
        return;
    }

    const row = Math.floor(index / 8);
    if (row < 4) {
        alert("초기 유닛은 맵 아래쪽(절반)에만 배치할 수 있습니다.");
        return;
    }

    if (boardUnits[index]) {
        alert("이미 유닛이 있어 배치할 수 없습니다.");
        return;
    }

    boardUnits[index] = {
        hp: card.hp, maxHp: card.hp, atk: card.atk, range: card.range,
        move: card.move || 0, owner: "player", type: card.name,
        moved: false, acted: false, size: card.size, anchor: index,
        icon: card.icon
    };

    gold -= card.cost;
    updateGoldDisplay();
    renderBoard();
    renderCardList();
}

function highlightRanges(index) {
    clearHighlights();
    const u = boardUnits[index];
    if (!u || u.ref) return;

    const x = index % 8;
    const y = Math.floor(index / 8);

    // === 공격 범위 ===
    if (u.type === "대포") {
        // 대포 전용: 앞 방향 3칸, 3x3 영역
        const dir = u.owner === "player" ? -1 : 1;

        for (let step = 1; step <= 3; step++) {
            const ty = y + dir * step;
            if (ty < 0 || ty > 7) continue;

            for (let dx = -1; dx <= 1; dx++) {
                const tx = x + dx;
                if (tx < 0 || tx > 7) continue;

                const i = ty * 8 + tx;
                const cell = document.querySelector(`.cell[data-index="${i}"]`);
                if (!cell) continue;

                cell.classList.add('range-highlight');
                if (boardUnits[i] && boardUnits[i].owner !== u.owner) {
                    cell.classList.add('attack-target');
                }
            }
        }
    } else {
        // 일반 유닛: 맨해튼 거리 기반
        for (let i = 0; i < 64; i++) {
            const tx = i % 8;
            const ty = Math.floor(i / 8);
            const dist = Math.abs(x - tx) + Math.abs(y - ty);

            if (dist <= u.range) {
                const cell = document.querySelector(`.cell[data-index="${i}"]`);
                cell.classList.add('range-highlight');

                if (boardUnits[i] && boardUnits[i].owner !== u.owner) {
                    cell.classList.add('attack-target');
                }
            }
        }
    }

    // === 이동 범위 ===
    if (u.move > 0) {
        for (let i = 0; i < 64; i++) {
            const tx = i % 8;
            const ty = Math.floor(i / 8);
            const dist = Math.abs(x - tx) + Math.abs(y - ty);

            if (dist <= u.move && !boardUnits[i]) {
                const cell = document.querySelector(`.cell[data-index="${i}"]`);
                cell.classList.add('move-highlight');
            }
        }
    }
}


function clearHighlights() {
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('range-highlight', 'attack-target', 'move-highlight');
    });
}
function isCannonAttackable(attacker, from, to) {
    if (!attacker || attacker.type !== "대포") return false;

    const fx = from % 8;
    const fy = Math.floor(from / 8);
    const tx = to % 8;
    const ty = Math.floor(to / 8);

    const dx = tx - fx;
    const dy = ty - fy;

    // 플레이어는 위로(행 감소), AI는 아래로(행 증가)라고 가정
    const dir = attacker.owner === "player" ? -1 : 1;

    // 앞쪽이 아니면(같은 줄, 뒤쪽) 공격 불가
    if (dy * dir <= 0) return false;

    // 앞 방향으로 1~3칸, 좌우로 1칸(가로 3칸) = 3x3 영역
    if (dy * dir >= 1 && dy * dir <= 3 && Math.abs(dx) <= 1) {
        return true;
    }
    return false;
}

function canUnitAttack(attacker, from, to) {
    if (!attacker) return false;

    // 대포는 앞 3칸 3x3 전용 판정
    if (attacker.type === "대포") {
        return isCannonAttackable(attacker, from, to);
    }

    // 나머지는 기존 맨해튼 거리
    const fx = from % 8, fy = Math.floor(from / 8);
    const tx = to % 8, ty = Math.floor(to / 8);
    const dist = Math.abs(fx - tx) + Math.abs(fy - ty);
    return dist <= attacker.range;
}


function performAttack(attIdx, defIdx) {
    const atkObj = boardUnits[attIdx];
    const defObj = boardUnits[defIdx];

    if (!atkObj || !defObj || atkObj.acted) return;

    defObj.hp -= atkObj.atk;
    atkObj.acted = true;

    if (defObj.hp <= 0) {
        boardUnits[defIdx] = null;
        if (defObj.type === 'king') {
            showResult(defObj.owner === "player" ? "패배" : "승리");
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "공격 완료";
}

function nextTurn() {
    if (currentPlayer !== "player") return;

    gold += 5;
    updateGoldDisplay();
    refreshCount = 2;

    currentPlayer = "ai";
    document.getElementById('infoBox').innerText = "AI 턴...";

    setTimeout(() => {
        aiTurn();
        setTimeout(() => {
            currentPlayer = "player";
            turn++;
            resetUnitsForNewTurn("player");
            document.getElementById('infoBox').innerText = `${turn}턴 시작 (플레이어)`;
            renderCardList();
        }, 500);
    }, 500);
}

function aiTurn() {
    resetUnitsForNewTurn("ai");

    // AI 유닛 배치
    const aiUnits = boardUnits.filter((u, i) => u && !u.ref && u.owner === "ai" && u.type !== "king").length;
    if (aiUnits < 5) {
        for (let i = 0; i < 24; i++) {
            if (!boardUnits[i]) {
                const card = CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)];
                boardUnits[i] = {
                    hp: card.hp, maxHp: card.hp, atk: card.atk, range: card.range,
                    move: card.move || 0, owner: "ai", type: card.name,
                    moved: false, acted: false, size: 1, anchor: i, icon: card.icon
                };
                break;
            }
        }
    }

    // AI 행동
    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (!u || u.ref || u.owner !== "ai" || u.type === "king") continue;

        // 공격
        for (let j = 0; j < 64; j++) {
            const target = boardUnits[j];
            if (target && target.owner === "player" && canUnitAttack(u, i, j)) {
                target.hp -= u.atk;
                u.acted = true;
                if (target.hp <= 0) {
                    boardUnits[j] = null;
                    if (target.type === 'king') {
                        showResult("패배");
                    }
                }
                break;
            }
        }

        // 이동
        if (!u.moved && u.move > 0) {
            const down = i + 8;
            if (down < 64 && !boardUnits[down]) {
                boardUnits[down] = u;
                boardUnits[i] = null;
                u.moved = true;
            }
        }
    }

    renderBoard();
}

function resetUnitsForNewTurn(owner) {
    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (u && !u.ref && u.owner === owner) {
            u.moved = false;
            u.acted = false;
        }
    }
}

function refreshShop() {
    if (currentPlayer !== "player" || refreshCount <= 0 || gold < 3) {
        alert("새로고침 불가");
        return;
    }
    gold -= 3;
    refreshCount--;
    updateGoldDisplay();
    renderCardList();
}

function levelUp() {
    if (gold < 10) {
        alert("보석이 부족합니다!");
        return;
    }
    gold -= 10;
    playerLevel++;
    maxPlaceCells += 4;
    updateGoldDisplay();
    alert(`레벨 ${playerLevel} 달성!`);
}

function updateGoldDisplay() {
    document.getElementById('goldDisplay').innerText =
        `💎 보석: ${gold} (Lv.${playerLevel})`;
}

function showResult(text) {
    const resultDiv = document.getElementById('gameResult');
    const resultText = document.getElementById('resultText');
    resultText.innerText = text === "승리" ? "🎉 승리!" : "💀 패배...";
    resultDiv.classList.add('show');

    setTimeout(() => {
        location.reload();
    }, 3000);
}