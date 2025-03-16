// 音の図鑑 Webアプリケーション

// グローバル変数
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let recordingTime = 0;
let audioBlob;
let soundLibrary = [];
let selectedSounds = [];
let audioPlayers = [];

// DOM要素の参照を取得
document.addEventListener('DOMContentLoaded', () => {
    // ナビゲーションボタン
    const recordBtn = document.getElementById('recordBtn');
    const libraryBtn = document.getElementById('libraryBtn');
    const mixerBtn = document.getElementById('mixerBtn');

    // セクション
    const recordSection = document.getElementById('recordSection');
    const librarySection = document.getElementById('librarySection');
    const mixerSection = document.getElementById('mixerSection');

    // 録音関連の要素
    const startRecordBtn = document.getElementById('startRecordBtn');
    const stopRecordBtn = document.getElementById('stopRecordBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTime = document.getElementById('recordingTime');
    const saveRecording = document.getElementById('saveRecording');
    const recordedAudio = document.getElementById('recordedAudio');
    const saveSoundBtn = document.getElementById('saveSoundBtn');

    // 図鑑関連の要素
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const soundLibraryElement = document.getElementById('soundLibrary');

    // ミキサー関連の要素
    const selectedSoundsElement = document.getElementById('selectedSounds');
    const availableSoundsList = document.getElementById('availableSoundsList');
    const playMixBtn = document.getElementById('playMixBtn');
    const stopMixBtn = document.getElementById('stopMixBtn');
    const clearMixBtn = document.getElementById('clearMixBtn');

    // エクスポート・インポート機能のイベントリスナー
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    if (exportBtn) exportBtn.addEventListener('click', exportSounds);
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importSounds);


    // ローカルストレージから音のライブラリを読み込み
    loadSoundLibrary();

    // ナビゲーションのイベントリスナー設定
    recordBtn.addEventListener('click', () => showSection('record'));
    libraryBtn.addEventListener('click', () => showSection('library'));
    mixerBtn.addEventListener('click', () => showSection('mixer'));

    // 録音機能のイベントリスナー
    startRecordBtn.addEventListener('click', startRecording);
    stopRecordBtn.addEventListener('click', stopRecording);
    saveSoundBtn.addEventListener('click', saveSound);

    // 図鑑の検索・フィルター機能
    searchInput.addEventListener('input', filterSounds);
    categoryFilter.addEventListener('change', filterSounds);

    // ミキサー機能のイベントリスナー
    playMixBtn.addEventListener('click', playMix);
    stopMixBtn.addEventListener('click', stopMix);
    clearMixBtn.addEventListener('click', clearMix);

    // 初期表示
    renderSoundLibrary();
    renderAvailableSounds();
    addLearningInfo();
    addWaveformVisualization()
});

// セクション切り替え関数
function showSection(section) {
    const recordSection = document.getElementById('recordSection');
    const librarySection = document.getElementById('librarySection');
    const mixerSection = document.getElementById('mixerSection');

    const recordBtn = document.getElementById('recordBtn');
    const libraryBtn = document.getElementById('libraryBtn');
    const mixerBtn = document.getElementById('mixerBtn');

    // すべてのセクションを非表示
    recordSection.classList.add('hidden');
    librarySection.classList.add('hidden');
    mixerSection.classList.add('hidden');

    // すべてのボタンからアクティブクラスを削除
    recordBtn.classList.remove('active');
    libraryBtn.classList.remove('active');
    mixerBtn.classList.remove('active');

    // 選択されたセクションを表示
    switch (section) {
        case 'record':
            recordSection.classList.remove('hidden');
            recordBtn.classList.add('active');
            break;
        case 'library':
            librarySection.classList.remove('hidden');
            libraryBtn.classList.add('active');
            break;
        case 'mixer':
            mixerSection.classList.remove('hidden');
            mixerBtn.classList.add('active');
            break;
    }
}

// 録音開始
// 録音開始
async function startRecording() {
    try {
        // MediaDevices APIのサポートチェック
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('お使いのブラウザはマイク録音をサポートしていません。Chrome、Firefox、Safariの最新版をお試しください。');
        }

        // セキュアコンテキストのチェック
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            throw new Error('マイク録音機能はHTTPSで接続した場合のみ使用できます。');
        }

        // 音声ストリームを取得
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // iOS Safariでも動作する形式に調整
        const options = {
            mimeType: 'audio/mp4'  // iOS Safariでサポートされている形式
        };

        // mimeTypeがサポートされていない場合は自動的にデフォルト設定を使用
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.log('指定された形式はサポートされていません。デフォルト形式を使用します:', e);
            mediaRecorder = new MediaRecorder(stream);
        }

        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            // iOS Safariでも再生できる形式を使用
            let audioType = 'audio/mp4';
            // 録音データのタイプを確認
            if (audioChunks[0].type) {
                audioType = audioChunks[0].type;
            }

            audioBlob = new Blob(audioChunks, { type: audioType });
            const audioUrl = URL.createObjectURL(audioBlob);

            const recordedAudio = document.getElementById('recordedAudio');
            recordedAudio.src = audioUrl;

            // iOS Safariでの再生のために必要な設定
            recordedAudio.load();

            document.getElementById('saveRecording').classList.remove('hidden');
        };

        // 録音開始 - データが利用可能になる間隔を短くして多くのチャンクを取得
        mediaRecorder.start(100); // 100ms間隔でデータを取得

        // UI更新
        const startRecordBtn = document.getElementById('startRecordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');

        // ...残りのUI更新コード
    } catch (error) {
        console.error('録音を開始できませんでした:', error);
        alert('エラー: ' + error.message);
    }
}

// saveSound関数も修正
function saveSound() {
    const soundName = document.getElementById('soundName').value.trim();
    const soundCategory = document.getElementById('soundCategory').value;
    const soundTags = document.getElementById('soundTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const soundInfo = document.getElementById('soundInfo').value.trim();

    if (!soundName) {
        alert('音の名前を入力してください。');
        return;
    }

    // 音声データをBlob URLとして保存
    try {
        // Base64変換の代わりに直接Blob URLを使用
        const audioUrl = URL.createObjectURL(audioBlob);

        // 新しい音声データを作成
        const newSound = {
            id: Date.now().toString(),
            name: soundName,
            category: soundCategory,
            tags: soundTags,
            audio: audioUrl, // Blob URLとして保存
            audioBlobType: audioBlob.type, // Blobのタイプを保存
            info: soundInfo,
            dateCreated: new Date().toISOString()
        };

        // ライブラリに追加
        soundLibrary.push(newSound);
        saveSoundLibrary();

        // UI更新
        renderSoundLibrary();
        renderAvailableSounds();

        // フォームリセット
        document.getElementById('soundName').value = '';
        document.getElementById('soundTags').value = '';
        document.getElementById('saveRecording').classList.add('hidden');
        document.getElementById('recordingStatus').textContent = '録音していません';
        document.getElementById('recordingTime').textContent = '00:00';

        // 図鑑セクションに移動
        showSection('library');
    } catch (error) {
        console.error('音声の保存に失敗しました:', error);
        alert('音声の保存中にエラーが発生しました。もう一度お試しください。');
    }
}

// 録音時間の更新
function updateRecordingTime() {
    recordingTime++;
    const minutes = Math.floor(recordingTime / 60).toString().padStart(2, '0');
    const seconds = (recordingTime % 60).toString().padStart(2, '0');
    document.getElementById('recordingTime').textContent = `${minutes}:${seconds}`;
}

// 録音停止
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // タイマー停止
        clearInterval(recordingInterval);

        // UI更新
        const startRecordBtn = document.getElementById('startRecordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');

        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;

        // ボタンスタイルを元に戻す
        startRecordBtn.style.backgroundColor = '#f44336'; // 赤に戻す
        startRecordBtn.style.cursor = 'pointer';
        stopRecordBtn.style.backgroundColor = '#9e9e9e'; // グレーに戻す
        stopRecordBtn.style.opacity = '0.5';
        stopRecordBtn.style.cursor = 'not-allowed';

        document.getElementById('recordingStatus').textContent = '録音完了';
    }
}

// 録音した音を保存
function saveSound() {
    const soundName = document.getElementById('soundName').value.trim();
    const soundCategory = document.getElementById('soundCategory').value;
    const soundTags = document.getElementById('soundTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const soundInfo = document.getElementById('soundInfo').value.trim();

    if (!soundName) {
        alert('音の名前を入力してください。');
        return;
    }

    // 音声データをBase64形式に変換
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function () {
        const base64data = reader.result;

        // 新しい音声データを作成
        const newSound = {
            id: Date.now().toString(),
            name: soundName,
            category: soundCategory,
            tags: soundTags,
            audio: base64data,
            info: soundInfo, // 学習情報を追加
            dateCreated: new Date().toISOString()
        };

        // ライブラリに追加
        soundLibrary.push(newSound);
        saveSoundLibrary();

        // UI更新
        renderSoundLibrary();
        renderAvailableSounds();

        // フォームリセット
        document.getElementById('soundName').value = '';
        document.getElementById('soundTags').value = '';
        document.getElementById('saveRecording').classList.add('hidden');
        document.getElementById('recordingStatus').textContent = '録音していません';
        document.getElementById('recordingTime').textContent = '00:00';

        // 図鑑セクションに移動
        showSection('library');
    };
}

// 音のライブラリをローカルストレージに保存
function saveSoundLibrary() {
    localStorage.setItem('soundLibrary', JSON.stringify(soundLibrary));
}

// 音のライブラリをローカルストレージから読み込み
function loadSoundLibrary() {
    const saved = localStorage.getItem('soundLibrary');
    if (saved) {
        soundLibrary = JSON.parse(saved);

        // 相対パスのオーディオデータを修正（初期データの場合）
        soundLibrary = soundLibrary.map(sound => {
            // オーディオが空または相対パスで始まる場合は修正
            if (!sound.audio || sound.audio.startsWith('./')) {
                // idが"1"の場合はbird.mp3、"2"の場合はrain.mp3に設定
                if (sound.id === '1') {
                    sound.audio = './bird.mp3';
                } else if (sound.id === '2') {
                    sound.audio = './rain.mp3';
                }
            }
            return sound;
        });
    } else {
        // サンプルの音データを追加
        soundLibrary = [
            {
                id: '1',
                name: '鳥のさえずり',
                category: '自然',
                tags: ['鳥', '朝', '公園'],
                audio: './bird.mp3', // 相対パスで指定
                info: '朝の公園で聞こえる小鳥のさえずりです。',
                dateCreated: new Date().toISOString()
            },
            {
                id: '2',
                name: '雨の音',
                category: '自然',
                tags: ['雨', '水', '静か'],
                audio: './rain.mp3', // 相対パスで指定
                info: '静かな雨の日に聞こえる雨音です。',
                dateCreated: new Date().toISOString()
            }
        ];
        // 初期データを保存
        saveSoundLibrary();
    }
}

// 音の図鑑を表示する
function renderSoundLibrary() {
    const soundLibraryElement = document.getElementById('soundLibrary');
    soundLibraryElement.innerHTML = '';

    if (soundLibrary.length === 0) {
        soundLibraryElement.innerHTML = `<p>まだ音が登録されていません。「音を録音する」から音を追加してみましょう。</p>`;
        return;
    }

    soundLibrary.forEach(sound => {
        const soundCard = document.createElement('div');
        soundCard.className = 'sound-card';
        soundCard.dataset.id = sound.id;

        // タグのHTML生成
        const tagsHTML = sound.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        // 学習情報があれば表示
        const infoHTML = sound.info ?
            `<div class="sound-info"><p>${convertTextForGrade(sound.info)}</p></div>` : '';

        // audioのsrc属性を正しく設定
        const audioSrc = sound.audio || '';

        // 削除ボタンを追加
        soundCard.innerHTML = `
            <div class="sound-card-header">
                <h4>${sound.name}</h4>
                <button class="delete-sound" title="削除する">✕</button>
            </div>
            <span class="category">${sound.category}</span>
            <audio controls src="${audioSrc}"></audio>
            ${infoHTML}
            <div class="tags">${tagsHTML}</div>
        `;

        // 削除ボタンのイベントリスナー
        const deleteBtn = soundCard.querySelector('.delete-sound');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // カードのクリックイベントが発火しないようにする
            confirmDeleteSound(sound.id);
        });

        // ミキサーに追加するためのドラッグ機能
        soundCard.draggable = true;
        soundCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', sound.id);
        });

        soundLibraryElement.appendChild(soundCard);
    });
}

// 利用可能な音リストを表示
function renderAvailableSounds() {
    const availableSoundsList = document.getElementById('availableSoundsList');
    availableSoundsList.innerHTML = '';

    console.log("soundLibrary:", soundLibrary);
    soundLibrary.forEach(sound => {

        console.log("sound:", sound);
        const soundItem = document.createElement('div');
        soundItem.className = 'sound-item';
        soundItem.dataset.id = sound.id;

        soundItem.innerHTML = `
            <h4>${sound.name}</h4>
            <span class="category">${sound.category}</span>
            <button class="add-to-mix">追加</button>
        `;

        soundItem.draggable = true;
        soundItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', sound.id);
            soundItem.classList.add('dragging');
        });

        soundItem.addEventListener('dragend', () => {
            soundItem.classList.remove('dragging');
        });

        // クリックで追加ボタン
        const addButton = soundItem.querySelector('.add-to-mix');
        addButton.addEventListener('click', () => {
            addSoundToMix(sound.id);
        });

        availableSoundsList.appendChild(soundItem);
    });

    // ドロップエリアの設定
    const selectedSoundsElement = document.getElementById('selectedSounds');
    selectedSoundsElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        selectedSoundsElement.style.backgroundColor = '#C8E6C9';
    });

    selectedSoundsElement.addEventListener('dragleave', () => {
        selectedSoundsElement.style.backgroundColor = '';
    });

    selectedSoundsElement.addEventListener('drop', (e) => {
        e.preventDefault();
        selectedSoundsElement.style.backgroundColor = '';
        const soundId = e.dataTransfer.getData('text/plain');
        addSoundToMix(soundId);
    });
}

// 音をミキサーに追加
function addSoundToMix(soundId) {
    const sound = soundLibrary.find(s => s.id === soundId);
    if (!sound) return;

    // すでに選択されていたら何もしない
    if (selectedSounds.some(s => s.id === soundId)) return;

    selectedSounds.push(sound);
    updateSelectedSoundsUI();
}

// 選択された音の表示を更新
function updateSelectedSoundsUI() {
    const selectedSoundsElement = document.getElementById('selectedSounds');
    selectedSoundsElement.innerHTML = '';

    if (selectedSounds.length === 0) {
        selectedSoundsElement.innerHTML = '<p>ここに音をドラッグして組み合わせよう！</p>';
        return;
    }

    selectedSounds.forEach(sound => {
        const soundItem = document.createElement('div');
        soundItem.className = 'sound-item';
        soundItem.dataset.id = sound.id;

        soundItem.innerHTML = `
            <h4>${sound.name}</h4>
            <button class="remove-from-mix">削除</button>
        `;

        // 削除ボタン
        const removeButton = soundItem.querySelector('.remove-from-mix');
        removeButton.addEventListener('click', () => {
            selectedSounds = selectedSounds.filter(s => s.id !== sound.id);
            updateSelectedSoundsUI();
        });

        selectedSoundsElement.appendChild(soundItem);
    });
}

// 組み合わせた音を再生
function playMix() {
    // すでに再生中の音を停止
    stopMix();

    if (selectedSounds.length === 0) {
        alert('再生する音が選択されていません。音を追加してください。');
        return;
    }

    // 各音声を再生
    audioPlayers = selectedSounds.map(sound => {
        const audioSrc = sound.audio || '';
        const audio = new Audio(audioSrc);
        audio.play();
        return audio;
    });
}

// 組み合わせた音の再生を停止
function stopMix() {
    if (audioPlayers.length > 0) {
        audioPlayers.forEach(player => {
            player.pause();
            player.currentTime = 0;
        });
        audioPlayers = [];
    }
}

// 選択した音をクリア
function clearMix() {
    stopMix();
    selectedSounds = [];
    updateSelectedSoundsUI();
}

// 音の検索とフィルタリング
function filterSounds() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const soundCards = document.querySelectorAll('#soundLibrary .sound-card');

    soundCards.forEach(card => {
        const soundId = card.dataset.id;
        const sound = soundLibrary.find(s => s.id === soundId);

        if (!sound) return;

        const nameMatch = sound.name.toLowerCase().includes(searchText);
        const tagsMatch = sound.tags.some(tag => tag.toLowerCase().includes(searchText));
        const categoryMatch = category === 'all' || sound.category === category;

        const shouldShow = (nameMatch || tagsMatch) && categoryMatch;

        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// 学年に応じたテキスト変換関数（現在はそのまま返すだけ）
function convertTextForGrade(text) {
    if (!text) return '';
    return text;
}

// 波形表示機能を修正
function addWaveformVisualization() {
    // 録音セクションに波形表示用のキャンバスを追加
    const recordContainer = document.querySelector('.record-container');
    const waveformCanvas = document.createElement('canvas');
    waveformCanvas.id = 'waveformCanvas';
    waveformCanvas.width = 300;
    waveformCanvas.height = 80;
    waveformCanvas.style.backgroundColor = '#f0f0f0';
    waveformCanvas.style.marginTop = '10px';
    waveformCanvas.style.display = 'none';

    recordContainer.appendChild(waveformCanvas);

    // 録音開始ボタンのイベントリスナーを置き換え
    const startRecordBtn = document.getElementById('startRecordBtn');

    // 元のイベントリスナーを削除
    const newStartRecordBtn = startRecordBtn.cloneNode(true);
    startRecordBtn.parentNode.replaceChild(newStartRecordBtn, startRecordBtn);

    // 新しいイベントリスナーを追加
    newStartRecordBtn.addEventListener('click', async function () {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 波形分析用のAudioContextを作成
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // 波形の描画
            const canvas = document.getElementById('waveformCanvas');
            canvas.style.display = 'block';
            const canvasCtx = canvas.getContext('2d');

            // 波形描画のアニメーション
            let animationId;
            function drawWaveform() {
                animationId = requestAnimationFrame(drawWaveform);

                analyser.getByteTimeDomainData(dataArray);

                canvasCtx.fillStyle = '#f0f0f0';
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = '#4CAF50';
                canvasCtx.beginPath();

                const sliceWidth = canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * canvas.height / 2;

                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                canvasCtx.lineTo(canvas.width, canvas.height / 2);
                canvasCtx.stroke();
            }

            drawWaveform();

            // 通常の録音開始処理
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                // 波形表示を停止
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                canvas.style.display = 'none';

                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                document.getElementById('recordedAudio').src = audioUrl;
                document.getElementById('saveRecording').classList.remove('hidden');
            };

            // 録音開始
            mediaRecorder.start();

            // UI更新
            const stopRecordBtn = document.getElementById('stopRecordBtn');

            newStartRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;

            // 録音中のボタンスタイル変更
            newStartRecordBtn.style.backgroundColor = '#9e9e9e'; // グレーに変更
            newStartRecordBtn.style.cursor = 'not-allowed';
            stopRecordBtn.style.backgroundColor = '#f44336'; // 赤色に変更
            stopRecordBtn.style.cursor = 'pointer';
            stopRecordBtn.style.opacity = '1';

            document.getElementById('recordingStatus').textContent = '録音中...';

            // 録音時間のカウント開始
            recordingTime = 0;
            updateRecordingTime();
            recordingInterval = setInterval(updateRecordingTime, 1000);
        } catch (error) {
            console.error('録音を開始できませんでした:', error);
            alert('マイクへのアクセスを許可してください。');
        }
    });
}

// 音に学習情報を追加する機能
function addLearningInfo() {
    // 新規保存時に学習情報を追加できるフォーム要素を追加
    const saveRecordingDiv = document.getElementById('saveRecording');

    const learningInfoDiv = document.createElement('div');
    learningInfoDiv.className = 'form-group';
    learningInfoDiv.innerHTML = `
        <label for="soundInfo">音の説明：</label>
        <textarea id="soundInfo" 
                  placeholder="この音の特徴や面白いポイントを書きましょう" 
                  rows="4" 
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
    `;

    // 保存ボタンの前に挿入
    const saveSoundBtn = document.getElementById('saveSoundBtn');
    saveRecordingDiv.insertBefore(learningInfoDiv, saveSoundBtn);
}

// 音声データをエクスポート
function exportSounds() {
    if (soundLibrary.length === 0) {
        alert('エクスポートする音声データがありません。');
        return;
    }

    // エクスポートデータの作成
    const exportData = {
        version: '1.0',
        date: new Date().toISOString(),
        sounds: soundLibrary
    };

    // JSONデータの作成
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // ダウンロード用のリンク作成
    const a = document.createElement('a');
    a.href = url;
    a.download = `音の図鑑_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();

    // クリーンアップ
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 音声データをインポート
function importSounds(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importData = JSON.parse(e.target.result);

            // バージョンチェック（必要に応じて）
            if (!importData.version || !importData.sounds || !Array.isArray(importData.sounds)) {
                throw new Error('インポートファイルの形式が正しくありません。');
            }

            // インポート確認モーダルを表示
            showImportConfirmDialog(importData.sounds);
        } catch (error) {
            alert(`エラー: ${error.message}`);
        }

        // ファイル選択をリセット
        event.target.value = '';
    };

    reader.readAsText(file);
}

// インポート確認ダイアログを表示
function showImportConfirmDialog(importedSounds) {
    // モーダルを作成
    const modal = document.createElement('div');
    modal.className = 'modal';

    const newSoundsCount = importedSounds.length;
    const duplicatesCount = countDuplicates(importedSounds);

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>音声データのインポート</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>${newSoundsCount}個の音声データが見つかりました。</p>
                <p>${duplicatesCount}個の音声データは既に登録されているかもしれません。</p>
                <p>インポート方法を選択してください：</p>
            </div>
            <div class="modal-footer">
                <button id="importAppend" class="action-button">追加</button>
                <button id="importReplace" class="action-button">すべて置換</button>
                <button id="importCancel" class="action-button">キャンセル</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // イベントリスナーを設定
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#importAppend').addEventListener('click', () => {
        processImportedSounds(importedSounds, false);
        document.body.removeChild(modal);
    });

    modal.querySelector('#importReplace').addEventListener('click', () => {
        processImportedSounds(importedSounds, true);
        document.body.removeChild(modal);
    });

    modal.querySelector('#importCancel').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// インポートデータの重複をカウント
function countDuplicates(importedSounds) {
    let count = 0;
    importedSounds.forEach(imported => {
        if (soundLibrary.some(existing =>
            existing.name === imported.name &&
            existing.category === imported.category)) {
            count++;
        }
    });
    return count;
}

// インポートした音声データを処理
function processImportedSounds(importedSounds, replace) {
    if (replace) {
        // 置き換えモード
        soundLibrary = [...importedSounds];
    } else {
        // 追加モード（既存IDとの競合を回避）
        const existingIds = new Set(soundLibrary.map(sound => sound.id));

        importedSounds.forEach(sound => {
            // IDが重複する場合は新しいIDを割り当て
            if (existingIds.has(sound.id)) {
                sound.id = Date.now().toString() + Math.floor(Math.random() * 1000);
            }
            soundLibrary.push(sound);
        });
    }

    // ライブラリを保存して更新
    saveSoundLibrary();
    renderSoundLibrary();
    renderAvailableSounds();

    alert(`${importedSounds.length}個の音声データをインポートしました。`);
}

// 日付をフォーマット（YYYY-MM-DD）
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 音の削除確認ダイアログを表示
function confirmDeleteSound(soundId) {
    const sound = soundLibrary.find(s => s.id === soundId);
    if (!sound) return;

    // モーダル作成
    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>音の削除</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>"${sound.name}"を図鑑から削除しますか？</p>
                <p class="warning">この操作は取り消せません。</p>
            </div>
            <div class="modal-footer">
                <button id="confirmDelete" class="action-button" style="background-color: #F44336;">削除する</button>
                <button id="cancelDelete" class="action-button">キャンセル</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // イベントリスナー設定
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancelDelete').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#confirmDelete').addEventListener('click', () => {
        deleteSound(soundId);
        document.body.removeChild(modal);
    });
}

// 音をライブラリから削除
function deleteSound(soundId) {
    // ミキサーからも削除
    selectedSounds = selectedSounds.filter(s => s.id !== soundId);

    // ライブラリから削除
    soundLibrary = soundLibrary.filter(s => s.id !== soundId);

    // 保存して更新
    saveSoundLibrary();
    renderSoundLibrary();
    renderAvailableSounds();
    updateSelectedSoundsUI();
}