// ====================== 유닛 설명 ==========================
const UNIT_EXPLAIN = {
    "king": { icon: "👑", name: "왕", text: "패배 조건. 공격력 없음." },
    "전사": { icon: "⚔️", name: "전사", text: "HP 12 / 근접 공격 / 1칸 이동." },
    "궁수": { icon: "🏹", name: "궁수", text: "사거리 3 / 원거리 공격 / 재빠른 이동." },
    "마법사": { icon: "🧙‍♂️", name: "마법사", text: "직선·대각선 사거리 3 / 높은 공격력." },
    "대포": { icon: "💣", name: "대포", text: "앞쪽 3칸 3x3 범위 공격 / 이동 불가." },
    "투석기": { icon: "🤾‍♀️", name: "투석기", text: "4칸 앞 2x2 범위 광역 공격." },
    "암살자": { icon: "🥷", name: "암살자", text: "치명적인 단일 암살." },
    "사령술사": { icon: "☠️", name: "사령술사", text: "적을 처치하면 아군으로 부활시킴." },
    "골렘": { icon: "🪨", name: "골렘", text: "매우 단단한 탱커 유닛." },
    "소드마스터": { icon: "🗡️", name: "소드마스터", text: "공격 시 앞 3x6 범위 광역 공격." },
    "드루이드": { icon: "🌿", name: "드루이드", text: "배치 시 늑대 3마리 소환, 공격 시 늑대가 함께 공격." },
    "드래곤": { icon: "🐲", name: "드래곤", text: "원뿔형 화염 브레스 + 3턴 화상 피해." },
    "늑대": { icon: "🐺", name: "늑대", text: "드루이드의 소환수." },
    "언데드": { icon: "💀", name: "언데드", text: "사령술사가 부활시킨 유닛." },
    "폭탄": { icon: "🧨", name: "폭탄", text: "강력한 폭발 공격." },
    "창": { icon: "🔱", name: "창", text: "긴 사거리의 창 공격." }
};

const CARD_LIBRARY = [
    { id: 1, name: "소드마스터", cost: 12, hp: 15, atk: 5, range: 3, move: 2, size: 4, icon: "🗡️" },
    { id: 2, name: "전사", cost: 2, hp: 12, atk: 3, range: 1, move: 1, size: 1, icon: "⚔️" },
    { id: 3, name: "마법사", cost: 4, hp: 10, atk: 5, range: 3, move: 2, size: 2, icon: "🧙‍♂️" },
    { id: 4, name: "대포", cost: 5, hp: 20, atk: 6, range: 4, move: 0, size: 4, icon: "💣" },
    { id: 5, name: "궁수", cost: 3, hp: 10, atk: 3, range: 3, move: 3, size: 2, icon: "🏹" },
    { id: 6, name: "투석기", cost: 4, hp: 4, atk: 4, range: 4, move: 1, size: 2, icon: "🤾‍♀️" },
    { id: 7, name: "암살자", cost: 3, hp: 3, atk: 4, range: 1, move: 4, size: 1, icon: "🥷" },
    { id: 8, name: "사령술사", cost: 8, hp: 8, atk: 4, range: 2, move: 2, size: 3, icon: "☠️" },
    { id: 9, name: "골렘", cost: 6, hp: 50, atk: 2, range: 1, move: 1, size: 4, icon: "🪨" },
    { id: 11, name: "폭탄", cost: 4, hp: 16, atk: 6, range: 2, move: 1, size: 1, icon: "🧨" },
    { id: 13, name: "창", cost: 6, hp: 18, atk: 4, range: 2, move: 2, size: 1, icon: "🔱" },
    { id: 14, name: "드래곤", cost: 18, hp: 15, atk: 6, range: 1, move: 3, size: 6, icon: "🐲" },
    { id: 15, name: "드루이드", cost: 6, hp: 20, atk: 3, range: 2, move: 2, size: 3, icon: "🌿" }
];

/*function autoBalanceCards() {
    CARD_LIBRARY.forEach(card => {
        const basePower = card.hp + card.atk * 3 + card.range * 2 + card.move * 2;
        const targetPower = card.cost * 8;
        if (!basePower) return;
        const ratio = targetPower / basePower;
        if (ratio < 0.7 || ratio > 1.3) {
            card.hp = Math.max(1, Math.round(card.hp * ratio));
            card.atk = Math.max(1, Math.round(card.atk * ratio));
        }
    });
}
autoBalanceCards();*/

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
let gameMode = "ai"; // 현재 안정 버전: AI 대전 중심

function createVisualEffect(index, effectType) {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell) return;
    const effect = document.createElement('div');
    effect.className = `effect ${effectType}`;
    cell.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

function createUnitFromCard(card, owner, index) {
    return {
        hp: card.hp, maxHp: card.hp, atk: card.atk, range: card.range,
        move: card.move || 0, owner, type: card.name, moved: false, acted: false,
        anchor: index, icon: card.icon, burnTurns: 0
    };
}

/* ================== UI 초기화 ================== */

window.onload = () => {
    const startScreen = document.getElementById("startScreen");
    const gameScreen = document.getElementById("gameScreen");
    const startAIButton = document.getElementById("startAI");
    const startPVPButton = document.getElementById("startPVP");

    if (startAIButton) {
        startAIButton.onclick = () => {
            gameMode = "ai";
            currentPlayer = "player";
            startScreen.style.display = "none";
            gameScreen.style.display = "block";
            startGame();
        };
    }

    if (startPVPButton) {
        // 나중에 PVP 구현 예정 – 현재는 안내만
        startPVPButton.onclick = () => {
            alert("현재 버전에서는 AI 대전만 지원합니다. 🤖");
        };
    }
};

function startGame() {
    initBoard();
    renderBoard();
    renderCardList();
    updateGoldDisplay();
    updateTurnDisplay();

    document.getElementById('refreshBtn').onclick = refreshShop;
    document.getElementById('endTurnBtn').onclick = nextTurn;
    document.getElementById('levelUpBtn').onclick = levelUp;

    const infoBox = document.getElementById('infoBox');
    if (infoBox) infoBox.innerText = "왕을 먼저 배치하세요.";
}

function updateTurnDisplay() {
    const el = document.getElementById('turnDisplay');
    if (!el) return;

    if (currentPlayer === "player") {
        el.textContent = `플레이어 턴 (${turn}턴)`;
        el.className = "turn-display p1-turn turn-flash";
    } else {
        el.textContent = "AI 턴";
        el.className = "turn-display ai-turn turn-flash";
    }
}

/* ================== 보드 렌더링 ================== */

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
        if (!cell) continue;
        const existingUnit = cell.querySelector('.unit');
        if (existingUnit) existingUnit.remove();

        if (boardUnits[i]) {
            const unit = boardUnits[i];
            const unitDiv = document.createElement('div');
            let classes = ['unit'];

            if (unit.owner === 'player') {
                classes.push('player-unit', 'p1-unit');
            } else if (unit.owner === 'ai') {
                classes.push('ai-unit');
            }

            unitDiv.className = classes.join(' ');
            if (unit.type === 'king') unitDiv.classList.add('king-unit');
            unitDiv.innerHTML = unit.icon || '⚔️';

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

/* ================== 카드 상점 ================== */

function renderCardList() {
    const cardList = document.getElementById('cardList');
    if (!cardList) return;
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

/* ================== 클릭 처리 ================== */

function onCellClick(index) {
    const clicked = boardUnits[index];

    if (clicked) {
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

    if (!kingPlaced && !selectedCard) {
        placeKing(index);
        return;
    }

    if (selectedCard) {
        tryPlaceCard(index, selectedCard);
        selectedCard = null;
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        return;
    }

    if (clicked && clicked.owner === "player") {
        if (clicked.acted) {
            document.getElementById('infoBox').innerText = "이미 행동한 유닛입니다.";
            return;
        }
        selectedUnit = index;
        attackMode = true;
        highlightRanges(index);
        document.getElementById('infoBox').innerText = "공격할 적 유닛을 선택하거나 빈 칸을 눌러 이동하세요.";
        return;
    }

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

    if (!clicked && attackMode && selectedUnit !== null) {
        const u = boardUnits[selectedUnit];
        const dist = Math.abs((selectedUnit % 8) - (index % 8)) +
            Math.abs(Math.floor(selectedUnit / 8) - Math.floor(index / 8));
        if (!u.moved && dist <= (u.move || 0)) {
            u.moved = true;
            boardUnits[index] = u;
            boardUnits[selectedUnit] = null;
            u.anchor = index;
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

/* ================== 왕 배치 & AI 왕 ================== */

function placeKing(index) {
    if (boardUnits[index]) return;
    boardUnits[index] = {
        hp: 50, maxHp: 50, atk: 0, range: 1, move: 0, owner: "player",
        type: "king", moved: false, acted: false, anchor: index, icon: "👑", burnTurns: 0
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
    let aiIndex = playerKingIndex !== -1
        ? (7 - Math.floor(playerKingIndex / 8)) * 8 + (playerKingIndex % 8)
        : 7 * 8 + 3;

    if (boardUnits[aiIndex]) {
        for (let i = 56; i < 64; i++) {
            if (!boardUnits[i]) {
                aiIndex = i;
                break;
            }
        }
    }

    boardUnits[aiIndex] = {
        hp: 50, maxHp: 50, atk: 0, range: 1, move: 0, owner: "ai",
        type: "king", moved: true, acted: true, anchor: aiIndex, icon: "👑", burnTurns: 0
    };
}

/* ================== 유닛 배치 ================== */

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
    const placedUnits = boardUnits.filter(u => u && u.owner === "player" && u.type !== "king").length;
    const maxUnits = playerLevel * 2 + 1; // 레벨 1 = 3개, 레벨 2 = 5개...

    if (placedUnits >= maxUnits) {
        alert(`현재 레벨에서는 최대 ${maxUnits}개의 유닛만 배치할 수 있습니다.\n레벨업을 하세요!`);
        return;
    }
    const unit = createUnitFromCard(card, "player", index);
    boardUnits[index] = unit;

    if (unit.type === "드루이드") {
        spawnDruidWolves(index, "player");
    }

    gold -= card.cost;
    updateGoldDisplay();
    renderBoard();
    renderCardList();
}

/* ================== 범위 하이라이트 ================== */

function highlightRanges(index) {
    clearHighlights();
    const u = boardUnits[index];
    if (!u) return;

    const x = index % 8;
    const y = Math.floor(index / 8);

    if (u.type === "대포") {
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
    } else if (u.type === "투석기") {
        const dir = u.owner === "player" ? -1 : 1;
        const targetY = y + dir * 4;
        for (let dy = 0; dy <= 1; dy++) {
            for (let dx = 0; dx <= 1; dx++) {
                const ty = targetY + dy;
                const tx = x + dx;
                if (tx < 0 || tx > 7 || ty < 0 || ty > 7) continue;
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

/* ================== 공격 가능 판정 ================== */

function canUnitAttack(attacker, from, to) {
    if (!attacker) return false;

    if (attacker.type === "대포") {
        const fx = from % 8, fy = Math.floor(from / 8);
        const tx = to % 8, ty = Math.floor(to / 8);
        const dy = ty - fy;
        const dir = attacker.owner === "player" ? -1 : 1;
        if (dy * dir <= 0) return false;
        if (dy * dir >= 1 && dy * dir <= 3 && Math.abs(tx - fx) <= 1) return true;
        return false;
    }

    if (attacker.type === "투석기") {
        const fx = from % 8, fy = Math.floor(from / 8);
        const tx = to % 8, ty = Math.floor(to / 8);
        const dir = attacker.owner === "player" ? -1 : 1;
        const targetY = fy + dir * 4;
        if (ty >= targetY && ty <= targetY + 1 && tx >= fx && tx <= fx + 1) return true;
        return false;
    }

    const fx = from % 8, fy = Math.floor(from / 8);
    const tx = to % 8, ty = Math.floor(to / 8);
    const dist = Math.abs(fx - tx) + Math.abs(fy - ty);
    return dist <= attacker.range;
}

/* ================== 특수 능력들 ================== */

function spawnDruidWolves(druidIndex, owner) {
    let summoned = 0;
    for (let i = 0; i < 64 && summoned < 3; i++) {
        if (boardUnits[i]) continue;
        const dist = Math.abs((druidIndex % 8) - (i % 8)) +
            Math.abs(Math.floor(druidIndex / 8) - Math.floor(i / 8));
        if (dist <= 2) {
            boardUnits[i] = {
                hp: 4, maxHp: 4, atk: 2, range: 1, move: 2, owner,
                type: "늑대", moved: true, acted: true, anchor: i, icon: "🐺", burnTurns: 0
            };
            summoned++;
        }
    }
    if (summoned > 0) {
        renderBoard();
        document.getElementById("infoBox").innerText = "🌿 드루이드 – 늑대 소환!";
    }
}

function wolvesAssistAttack(owner, targetIndex) {
    let target = boardUnits[targetIndex];
    if (!target) return;

    for (let i = 0; i < 64; i++) {
        const wolf = boardUnits[i];
        if (!wolf || wolf.owner !== owner || wolf.type !== "늑대") continue;

        target = boardUnits[targetIndex];
        if (!target) break;

        let bestCell = null;
        let bestDist = 999;
        for (let j = 0; j < 64; j++) {
            if (boardUnits[j]) continue;
            const dist = Math.abs((j % 8) - (targetIndex % 8)) +
                Math.abs(Math.floor(j / 8) - Math.floor(targetIndex / 8));
            if (dist < bestDist && dist <= 1) {
                bestDist = dist;
                bestCell = j;
            }
        }

        if (bestCell !== null) {
            boardUnits[bestCell] = wolf;
            boardUnits[i] = null;
            wolf.anchor = bestCell;
        }

        createVisualEffect(targetIndex, 'wolf-bite-effect');
        target.hp -= wolf.atk;

        if (target.hp <= 0) {
            boardUnits[targetIndex] = null;
            if (target.type === 'king') {
                showResult(target.owner === 'player' ? '패배' : '승리');
            }
            break;
        }
    }
    renderBoard();
}

function dragonConeAttack(attIdx) {
    const dragon = boardUnits[attIdx];
    if (!dragon) return;

    const x = attIdx % 8;
    const y = Math.floor(attIdx / 8);
    const dir = dragon.owner === "player" ? -1 : 1;

    for (let dy = 1; dy <= 3; dy++) {
        const ty = y + dir * dy;
        if (ty < 0 || ty > 7) continue;

        const width = dy;
        for (let dx = -width; dx <= width; dx++) {
            const tx = x + dx;
            if (tx < 0 || tx > 7) continue;

            const idx = ty * 8 + tx;
            createVisualEffect(idx, 'fire-breath-effect');

            const target = boardUnits[idx];
            if (target && target.owner !== dragon.owner) {
                target.hp -= dragon.atk;
                target.burnTurns = 3;

                if (target.hp <= 0) {
                    boardUnits[idx] = null;
                    if (target.type === 'king') {
                        showResult(target.owner === 'player' ? '패배' : '승리');
                    }
                }
            }
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "🔥 드래곤 화염 브레스!";
}

function applyBurnDamage() {
    let burning = false;
    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (!u || !u.burnTurns || u.burnTurns <= 0) continue;
        burning = true;
        u.hp -= 1;
        u.burnTurns -= 1;
        createVisualEffect(i, 'burning-effect');

        if (u.hp <= 0) {
            const dead = u;
            boardUnits[i] = null;
            if (dead.type === 'king') {
                showResult(dead.owner === 'player' ? '패배' : '승리');
            }
        }
    }
    if (burning) renderBoard();
}

function necromancerOnKill(attIdx, defIdx, necro, killedUnit) {
    let reviveCell = null;
    for (let i = 0; i < 64; i++) {
        const dist = Math.abs((attIdx % 8) - (i % 8)) +
            Math.abs(Math.floor(attIdx / 8) - Math.floor(i / 8));
        if (dist <= 2 && !boardUnits[i]) {
            reviveCell = i;
            break;
        }
    }

    if (reviveCell === null) return;

    createVisualEffect(reviveCell, 'necromancy-effect');

    const revived = {
        ...killedUnit,
        owner: necro.owner,
        moved: true,
        acted: true,
        anchor: reviveCell,
        hp: Math.max(1, Math.floor(killedUnit.maxHp * 0.7))
    };

    setTimeout(() => {
        boardUnits[reviveCell] = revived;
        renderBoard();
        document.getElementById("infoBox").innerText = `☠ ${killedUnit.type} 부활!`;
    }, 500);
}

function catapultAreaAttack(attIdx) {
    const catapult = boardUnits[attIdx];
    if (!catapult) return;

    const x = attIdx % 8;
    const y = Math.floor(attIdx / 8);
    const dir = catapult.owner === "player" ? -1 : 1;
    const targetY = y + dir * 4;

    for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
            const ty = targetY + dy;
            const tx = x + dx;
            if (tx < 0 || tx > 7 || ty < 0 || ty > 7) continue;

            const idx = ty * 8 + tx;
            createVisualEffect(idx, 'catapult-impact-effect');

            const target = boardUnits[idx];
            if (target && target.owner !== catapult.owner) {
                target.hp -= catapult.atk;

                if (target.hp <= 0) {
                    boardUnits[idx] = null;
                    if (target.type === 'king') {
                        showResult(target.owner === 'player' ? '패배' : '승리');
                    }
                }
            }
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "💥 투석기 광역 공격!";
}

function swordmasterWideSlash(attIdx) {
    const sword = boardUnits[attIdx];
    if (!sword) return;

    const x = attIdx % 8;
    const y = Math.floor(attIdx / 8);
    const dir = sword.owner === "player" ? -1 : 1;

    for (let dy = 1; dy <= 3; dy++) {
        const ty = y + dir * dy;
        if (ty < 0 || ty > 7) continue;

        for (let dx = -3; dx <= 2; dx++) {
            const tx = x + dx;
            if (tx < 0 || tx > 7) continue;

            const idx = ty * 8 + tx;
            createVisualEffect(idx, 'sword-slash-effect');

            const target = boardUnits[idx];
            if (target && target.owner !== sword.owner) {
                target.hp -= sword.atk;

                if (target.hp <= 0) {
                    boardUnits[idx] = null;
                    if (target.type === 'king') {
                        showResult(target.owner === 'player' ? '패배' : '승리');
                    }
                }
            }
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "⚔ 소드마스터 광역 공격!";
}

function cannonAreaAttack(attIdx) {
    const cannon = boardUnits[attIdx];
    if (!cannon) return;

    const x = attIdx % 8;
    const y = Math.floor(attIdx / 8);
    const dir = cannon.owner === "player" ? -1 : 1;

    for (let step = 1; step <= 3; step++) {
        const ty = y + dir * step;
        if (ty < 0 || ty > 7) continue;

        for (let dx = -1; dx <= 1; dx++) {
            const tx = x + dx;
            if (tx < 0 || tx > 7) continue;

            const idx = ty * 8 + tx;
            createVisualEffect(idx, 'cannon-explosion-effect');

            const target = boardUnits[idx];
            if (target && target.owner !== cannon.owner) {
                target.hp -= cannon.atk;

                if (target.hp <= 0) {
                    boardUnits[idx] = null;
                    if (target.type === 'king') {
                        showResult(target.owner === 'player' ? '패배' : '승리');
                    }
                }
            }
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "💣 대포 광역 공격!";
}

/* ================== 공격 처리 ================== */

function performAttack(attIdx, defIdx) {
    const atkObj = boardUnits[attIdx];
    const defObj = boardUnits[defIdx];

    if (!atkObj || !defObj || atkObj.acted) return;

    // 특수 광역 공격들
    if (atkObj.type === "투석기") {
        catapultAreaAttack(attIdx);
        atkObj.acted = true;
        renderBoard();
        return;
    }

    if (atkObj.type === "대포") {
        cannonAreaAttack(attIdx);
        atkObj.acted = true;
        renderBoard();
        return;
    }

    if (atkObj.type === "소드마스터") {
        swordmasterWideSlash(attIdx);
        atkObj.acted = true;
        renderBoard();
        return;
    }

    if (atkObj.type === "드래곤") {
        dragonConeAttack(attIdx);
        atkObj.acted = true;
        renderBoard();
        return;
    }

    // 기본 단일 공격
    createVisualEffect(defIdx, 'normal-attack-effect');
    defObj.hp -= atkObj.atk;

    // 드루이드: 늑대 연계 공격
    if (atkObj.type === "드루이드") {
        wolvesAssistAttack(atkObj.owner, defIdx);
    }

    // 암살자: 치명타 이펙트
    if (atkObj.type === "암살자") {
        createVisualEffect(defIdx, 'assassin-strike-effect');
    }

    // 마법사: 마법 이펙트
    if (atkObj.type === "마법사") {
        createVisualEffect(defIdx, 'magic-blast-effect');
    }

    // 궁수: 화살 이펙트
    if (atkObj.type === "궁수") {
        createVisualEffect(defIdx, 'arrow-hit-effect');
    }

    // 전사: 검격 이펙트
    if (atkObj.type === "전사") {
        createVisualEffect(defIdx, 'warrior-strike-effect');
    }

    // 폭탄: 폭발 이펙트
    if (atkObj.type === "폭탄") {
        createVisualEffect(defIdx, 'bomb-explosion-effect');
    }

    // 창: 관통 이펙트
    if (atkObj.type === "창") {
        createVisualEffect(defIdx, 'spear-pierce-effect');
    }

    // 매혹: 하트 이펙트 (현재 카드에는 없음, 확장용)
    if (atkObj.type === "매혹") {
        createVisualEffect(defIdx, 'charm-effect');
    }

    atkObj.acted = true;

    // 사망 처리
    if (defObj.hp <= 0) {
        // 사령술사: 킬 시 언데드 부활
        if (atkObj.type === "사령술사") {
            necromancerOnKill(attIdx, defIdx, atkObj, defObj);
        }

        boardUnits[defIdx] = null;
        if (defObj.type === 'king') {
            showResult(defObj.owner === "player" ? "패배" : "승리");
        }
    }

    renderBoard();
    document.getElementById('infoBox').innerText = "공격 완료";
}

/* ================== 턴 진행 / AI ================== */

function nextTurn() {
    if (currentPlayer !== "player") return;

    gold += 5;
    updateGoldDisplay();
    refreshCount = 2;

    currentPlayer = "ai";
    updateTurnDisplay();
    document.getElementById('infoBox').innerText = "AI 턴...";

    applyBurnDamage();

    setTimeout(() => {
        aiTurn();
        applyBurnDamage();

        setTimeout(() => {
            currentPlayer = "player";
            turn++;
            resetUnitsForNewTurn("player");
            updateTurnDisplay();
            document.getElementById('infoBox').innerText = `${turn}턴 시작 (플레이어)`;
            renderCardList();
        }, 500);
    }, 500);
}

function aiTurn() {
    resetUnitsForNewTurn("ai");

    const aiUnits = boardUnits.filter(u => u && u.owner === "ai" && u.type !== "king").length;
    const aiMaxUnits = playerLevel * 2 + 1; // 플레이어와 동일한 제한

    if (aiUnits < aiMaxUnits) {
        for (let i = 0; i < 24; i++) {
            if (!boardUnits[i]) {
                const card = CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)];
                const unit = createUnitFromCard(card, "ai", i);
                boardUnits[i] = unit;
                if (unit.type === "드루이드") {
                    spawnDruidWolves(i, "ai");
                }
                break;
            }
        }
    }


    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (!u || u.owner !== "ai" || u.type === "king") continue;

        if (!u.acted) {
            let attacked = false;
            for (let j = 0; j < 64; j++) {
                const target = boardUnits[j];
                if (target && target.owner === "player" && canUnitAttack(u, i, j)) {
                    performAttack(i, j);
                    attacked = true;
                    break;
                }
            }

            if (!attacked && !u.moved && u.move > 0) {
                const down = i + 8;
                if (down < 64 && !boardUnits[down]) {
                    boardUnits[down] = u;
                    boardUnits[i] = null;
                    u.moved = true;
                    u.anchor = down;
                }
            }
        }
    }

    renderBoard();
}

function resetUnitsForNewTurn(owner) {
    for (let i = 0; i < 64; i++) {
        const u = boardUnits[i];
        if (u && u.owner === owner) {
            u.moved = false;
            u.acted = false;
        }
    }
}

/* ================== 상점/레벨/Gold ================== */

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
        updateGoldDisplay();
        const maxUnits = playerLevel * 2 + 1;
        alert(`레벨 ${playerLevel} 달성! 🔥\n이제 최대 ${maxUnits}개의 유닛을 배치할 수 있습니다.`);
    }


function updateGoldDisplay() {
    const el = document.getElementById('goldDisplay');
    if (!el) return;
    el.innerText = `💎 보석: ${gold} (Lv.${playerLevel})`;
}

/* ================== 게임 결과 ================== */

function showResult(text) {
    const resultDiv = document.getElementById('gameResult');
    const resultText = document.getElementById('resultText');
    resultText.innerText = text === "승리" ? "🎉 승리!" : "💀 패배...";
    resultDiv.classList.add('show');

    setTimeout(() => {
        location.reload();
    }, 3000);
}
