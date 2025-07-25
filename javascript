document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('puzzle-board');
    const resetButton = document.getElementById('reset-button');
    const messageDisplay = document.getElementById('message');

    const PUZZLE_SIZE = 4; // 4x4のパズル
    const TOTAL_TILES = PUZZLE_SIZE * PUZZLE_SIZE; // 16タイル (15個の数字タイルと1個の空タイル)
    let tiles = []; // タイルの現在の状態 (数字の配列)
    let emptyTileIndex = 0; // 空きタイルのインデックス

    // --- ゲームの初期化 ---
    function initGame() {
        tiles = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1); // 1から15までの数字
        tiles.push(0); // 0を空きスペースとして追加 (配列の最後)
        emptyTileIndex = TOTAL_TILES - 1; // 空きスペースの初期インデックス

        shuffleTiles(); // タイルをシャッフル
        renderBoard(); // ボードを描画
        messageDisplay.textContent = ''; // メッセージをクリア
    }

    // --- タイルをシャッフルする ---
    function shuffleTiles() {
        do {
            // フィッシャー・イェーツ（Fisher-Yates）シャッフルアルゴリズム
            for (let i = tiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; // 要素をスワップ
            }
            // 空きタイルのインデックスを更新
            emptyTileIndex = tiles.indexOf(0);
        } while (!isSolvable(tiles)); // 解ける配置になるまでシャッフルを繰り返す
    }

    // --- パズルが解ける配置かどうかの判定 (反転数による判定) ---
    // 参考: https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%A9%E3%82%A4%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%E3%83%91%E3%82%Bズル
    function isSolvable(currentTiles) {
        let inversions = 0; // 反転数
        const flattenedTiles = currentTiles.filter(num => num !== 0); // 空きタイルを除外

        for (let i = 0; i < flattenedTiles.length - 1; i++) {
            for (let j = i + 1; j < flattenedTiles.length; j++) {
                if (flattenedTiles[i] > flattenedTiles[j]) {
                    inversions++;
                }
            }
        }

        // 空きタイルの行 (0から始まるインデックス)
        const emptyRow = Math.floor(emptyTileIndex / PUZZLE_SIZE); // 0, 1, 2, 3

        // 4x4の場合の解ける条件 (空きタイルの行は0-indexed):
        // (emptyRow % 2 === 0) (0, 2行目) なら inversions % 2 === 1 (奇数)
        // (emptyRow % 2 === 1) (1, 3行目) なら inversions % 2 === 0 (偶数)
        // これをまとめると、(emptyRow + inversions) % 2 === 0 となります。
        return (emptyRow + inversions) % 2 === 0;
    }


    // --- ボードを描画する ---
    function renderBoard() {
        board.innerHTML = ''; // ボードをクリア
        tiles.forEach((number, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (number === 0) {
                tile.classList.add('empty-tile'); // 空きタイルは特殊なクラス
            } else {
                tile.textContent = number;
                tile.dataset.index = index; // クリックされたタイルのインデックスを保持
                tile.addEventListener('click', handleTileClick);
            }
            board.appendChild(tile);
        });
    }

    // --- タイルがクリックされた時の処理 ---
    function handleTileClick(event) {
        const clickedIndex = parseInt(event.target.dataset.index);

        // クリックされたタイルが空きタイルの隣にあるかチェック
        const canMove = isAdjacent(clickedIndex, emptyTileIndex);

        if (canMove) {
            // タイルと空きスペースをスワップ
            [tiles[clickedIndex], tiles[emptyTileIndex]] = [tiles[emptyTileIndex], tiles[clickedIndex]];
            emptyTileIndex = clickedIndex; // 空きスペースのインデックスを更新

            renderBoard(); // ボードを再描画
            checkWin(); // クリア判定
        }
    }

    // --- 2つのインデックスが隣り合っているかチェック ---
    function isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / PUZZLE_SIZE);
        const col1 = index1 % PUZZLE_SIZE;
        const row2 = Math.floor(index2 / PUZZLE_SIZE);
        const col2 = index2 % PUZZLE_SIZE;

        // 同じ行で隣り合うか、同じ列で隣り合うか
        const isSameRowAdjacent = (row1 === row2) && (Math.abs(col1 - col2) === 1);
        const isSameColAdjacent = (col1 === col2) && (Math.abs(row1 - row2) === 1);

        return isSameRowAdjacent || isSameColAdjacent;
    }

    // --- クリア判定 ---
    function checkWin() {
        // 0を除いたタイルの配列を作成
        const currentNumbers = tiles.filter(num => num !== 0);
        
        // 正しい順序 (1, 2, 3, ..., 15) と比較
        const correctOrder = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);

        const isSolved = currentNumbers.every((num, index) => num === correctOrder[index]);

        if (isSolved) {
            messageDisplay.textContent = 'クリア！おめでとうございます！';
            messageDisplay.classList.add('success'); // クリア時のスタイル
            // タイルクリックを無効化するなど、ゲーム終了処理
            board.querySelectorAll('.tile:not(.empty-tile)').forEach(tile => {
                tile.removeEventListener('click', handleTileClick);
                tile.style.cursor = 'default';
            });
        } else {
            messageDisplay.textContent = '';
            messageDisplay.classList.remove('success');
        }
    }

    // --- リセットボタンのイベントリスナー ---
    resetButton.addEventListener('click', initGame);

    // --- ゲーム開始 ---
    initGame();
});
