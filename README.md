# my-pwa-app-
パズルゲームです
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>スライディングパズル</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#007bff"> </head>
<body>
    <div class="game-container">
        <h1>スライディングパズル</h1>
        <div id="puzzle-board">
        </div>
        <button id="reset-button">リセット</button>
        <div id="message"></div>
    </div>
    <script src="script.js"></script>
    <script>
        // サービスワーカーの登録
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    </script>
</body>
</html>
body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background-color: #f0f0f0;
    font-family: Arial, sans-serif;
    color: #333;
}

.game-container {
    text-align: center;
    background-color: #fff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #007bff;
    margin-bottom: 25px;
}

#puzzle-board {
    display: grid;
    grid-template-columns: repeat(4, 80px); /* 4x4のグリッド */
    grid-template-rows: repeat(4, 80px);
    gap: 5px; /* タイル間の隙間 */
    width: 340px; /* (80px * 4) + (5px * 3) = 320 + 15 = 335px + α */
    height: 340px;
    margin: 0 auto 20px;
    border: 3px solid #007bff;
    border-radius: 5px;
    background-color: #eee;
}

.tile {
    width: 80px;
    height: 80px;
    background-color: #007bff;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2em;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    user-select: none; /* テキスト選択を無効化 */
}

.tile:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
}

.empty-tile {
    background-color: transparent; /* 空きスペースは透明 */
    box-shadow: none;
    cursor: default;
}

.empty-tile:hover {
    background-color: transparent;
    transform: none;
}

#reset-button {
    padding: 10px 20px;
    font-size: 1.1em;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
}

#reset-button:hover {
    background-color: #218838;
}

#message {
    margin-top: 15px;
    font-size: 1.2em;
    color: #dc3545; /* デフォルトはエラーっぽい赤 */
    font-weight: bold;
}

#message.success {
    color: #28a745; /* クリア時の緑 */
}
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
        // 4x4の場合、下から2行目 (インデックス1) は偶数行、一番下 (インデックス3) は奇数行
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
