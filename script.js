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
// 音楽づくり機能のための変数
let timelineTracks = [];
let currentSelectedShape = 'circle';
let currentShapeColor = '#4CAF50';
let isTimelinePlaying = false;
let timelinePlayhead = null;
let timelineSoundElements = [];
let timelineInterval = null;

// DOM要素の参照を取得
document.addEventListener('DOMContentLoaded', () => {
    // ナビゲーションボタン
    const recordBtn = document.getElementById('recordBtn');
    const libraryBtn = document.getElementById('libraryBtn');
    const mixerBtn = document.getElementById('mixerBtn');
    const composerBtn = document.getElementById('composerBtn'); // 音楽づくりボタン追加

    // セクション
    const recordSection = document.getElementById('recordSection');
    const librarySection = document.getElementById('librarySection');
    const mixerSection = document.getElementById('mixerSection');
    const composerSection = document.getElementById('composerSection'); // 音楽づくりセクション追加

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

    // 音楽づくり関連の要素
    const playTimelineBtn = document.getElementById('playTimelineBtn');
    const stopTimelineBtn = document.getElementById('stopTimelineBtn');
    const addTrackBtn = document.getElementById('addTrackBtn');
    const clearTimelineBtn = document.getElementById('clearTimelineBtn');
    const timelineTracksContainer = document.getElementById('timelineTracks');

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
    composerBtn.addEventListener('click', () => showSection('composer')); // 音楽づくりのイベントリスナー

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

    // 音楽づくり機能のイベントリスナー
    if (playTimelineBtn) playTimelineBtn.addEventListener('click', playTimeline);
    if (stopTimelineBtn) stopTimelineBtn.addEventListener('click', stopTimeline);
    if (addTrackBtn) addTrackBtn.addEventListener('click', addNewTrack);
    if (clearTimelineBtn) clearTimelineBtn.addEventListener('click', clearTimeline);

    // 図形選択の初期化
    initializeShapeSelector();

    // 学年設定のイベントリスナー追加
    addGradeSelector();

    // 初期表示
    renderSoundLibrary();
    renderAvailableSounds();
    addLearningInfo();
    addWaveformVisualization();
    addShapeSelectorToRecording();

    // 音楽づくり機能の初期化
    initializeTimeline();
    renderAvailableSoundsForTimeline();
});

// セクション切り替え関数
function showSection(section) {
    const recordSection = document.getElementById('recordSection');
    const librarySection = document.getElementById('librarySection');
    const mixerSection = document.getElementById('mixerSection');
    const composerSection = document.getElementById('composerSection'); // 音楽づくりセクション追加

    const recordBtn = document.getElementById('recordBtn');
    const libraryBtn = document.getElementById('libraryBtn');
    const mixerBtn = document.getElementById('mixerBtn');
    const composerBtn = document.getElementById('composerBtn'); // 音楽づくりボタン追加

    // すべてのセクションを非表示
    recordSection.classList.add('hidden');
    librarySection.classList.add('hidden');
    mixerSection.classList.add('hidden');
    composerSection.classList.add('hidden');

    // すべてのボタンからアクティブクラスを削除
    recordBtn.classList.remove('active');
    libraryBtn.classList.remove('active');
    mixerBtn.classList.remove('active');
    composerBtn.classList.remove('active');

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
        case 'composer':
            composerSection.classList.remove('hidden');
            composerBtn.classList.add('active');
            // タイムライン表示の更新（ウィンドウサイズ変更時に対応するため）
            setTimeout(updateTimelineView, 100);
            break;
    }
}

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

// 録音した音を保存する関数を更新
function saveSound() {
    const soundName = document.getElementById('soundName').value.trim();
    const soundCategory = document.getElementById('soundCategory').value;
    const soundTags = document.getElementById('soundTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const soundInfo = document.getElementById('soundInfo').value.trim();

    // 図形情報の取得
    let selectedShape = 'circle';
    let customShapeData = null;

    // カスタム図形が使われているかチェック
    const canvas = document.getElementById('customShapeCanvas');
    if (canvas.classList.contains('active')) {
        customShapeData = canvas.toDataURL('image/png');
        selectedShape = 'custom';
    } else {
        // プリセット図形から選択されたものを取得
        const selectedShapeEl = document.querySelector('.shape-option-recording.selected');
        if (selectedShapeEl) {
            selectedShape = selectedShapeEl.dataset.shape;
        }
    }

    const shapeColor = document.getElementById('shapeColorRecording').value || '#4CAF50';

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
            info: soundInfo,
            shape: selectedShape,
            customShape: customShapeData,
            color: shapeColor,
            dateCreated: new Date().toISOString()
        };

        // ライブラリに追加
        soundLibrary.push(newSound);
        saveSoundLibrary();

        // UI更新
        renderSoundLibrary();
        renderAvailableSounds();
        renderAvailableSoundsForTimeline();

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

        // 図形表示の生成
        let shapeHTML = '';

        if (sound.shape === 'custom' && sound.customShape) {
            // カスタム図形の場合は画像として表示
            shapeHTML = `<div class="sound-shape"><img src="${sound.customShape}" alt="カスタム図形" width="40" height="40"></div>`;
        } else if (sound.shape) {
            // プリセット図形の表示
            let shapeSymbol = '●'; // デフォルト
            switch (sound.shape) {
                case 'circle': shapeSymbol = '●'; break;
                case 'square': shapeSymbol = '■'; break;
                case 'triangle': shapeSymbol = '▲'; break;
                case 'star': shapeSymbol = '★'; break;
                case 'wave': shapeSymbol = '〰'; break;
                case 'line': shapeSymbol = '―'; break;
                case 'zigzag': shapeSymbol = '∿'; break;
                case 'cross': shapeSymbol = '✕'; break;
                case 'dot': shapeSymbol = '・'; break;
                default: shapeSymbol = '●';
            }
            shapeHTML = `<div class="sound-shape" style="color: ${sound.color || '#4CAF50'}">${shapeSymbol}</div>`;
        }

        // カードのHTMLを構築（一度だけ）
        soundCard.innerHTML = `
           <div class="sound-card-header">
               <h4>${sound.name}</h4>
               <button class="delete-sound" title="削除する">✕</button>
           </div>
           ${shapeHTML}
           <span class="category">${sound.category}</span>
           <audio controls src="${audioSrc}"></audio>
           ${infoHTML}
           <div class="tags">${tagsHTML}</div>
       `;

        // HTML構築後に削除ボタンのイベントリスナーを設定
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

// 波形表示機能
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

// 学年設定機能を追加
function addGradeSelector() {
    // ヘッダーに設定ボタンを追加
    const header = document.querySelector('header');
    const gradeSettingBtn = document.createElement('button');
    gradeSettingBtn.id = 'gradeSettingBtn';
    gradeSettingBtn.className = 'grade-setting-btn';
    gradeSettingBtn.innerHTML = '学年設定';
    gradeSettingBtn.style.position = 'absolute';
    gradeSettingBtn.style.right = '20px';
    gradeSettingBtn.style.top = '20px';
    gradeSettingBtn.style.padding = '5px 10px';
    gradeSettingBtn.style.backgroundColor = '#81C784';
    gradeSettingBtn.style.color = 'white';
    gradeSettingBtn.style.border = 'none';
    gradeSettingBtn.style.borderRadius = '4px';
    gradeSettingBtn.style.cursor = 'pointer';

    // ヘッダーを相対位置に設定
    header.style.position = 'relative';

    header.appendChild(gradeSettingBtn);

    // 学年設定モーダルを作成
    const gradeModalHTML = `
    <div id="gradeSettingModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>学年設定</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>テキスト表示の学年レベルを選択してください：</p>
                <div class="grade-selector">
                    <label>
                        <input type="radio" name="grade" value="1" ${getCurrentGrade() === 1 ? 'checked' : ''}>
                        <span>1年生</span>
                    </label>
                    <label>
                        <input type="radio" name="grade" value="2" ${getCurrentGrade() === 2 ? 'checked' : ''}>
                        <span>2年生</span>
                    </label>
                    <label>
                        <input type="radio" name="grade" value="3" ${getCurrentGrade() === 3 ? 'checked' : ''}>
                        <span>3年生</span>
                    </label>
                    <label>
                        <input type="radio" name="grade" value="4" ${getCurrentGrade() === 4 ? 'checked' : ''}>
                        <span>4年生</span>
                    </label>
                    <label>
                        <input type="radio" name="grade" value="5" ${getCurrentGrade() === 5 ? 'checked' : ''}>
                        <span>5年生</span>
                    </label>
                    <label>
                        <input type="radio" name="grade" value="6" ${getCurrentGrade() === 6 ? 'checked' : ''}>
                        <span>6年生</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button id="saveGradeSetting" class="action-button">保存</button>
                <button id="cancelGradeSetting" class="action-button">キャンセル</button>
            </div>
        </div>
    </div>`;

    // モーダルをbodyに追加
    document.body.insertAdjacentHTML('beforeend', gradeModalHTML);

    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        .grade-selector {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 15px 0;
        }
        .grade-selector label {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .grade-selector label:hover {
            background-color: #E8F5E9;
        }
        .grade-selector input:checked + span {
            font-weight: bold;
            color: #2E7D32;
        }
    `;
    document.head.appendChild(style);

    // イベントリスナー
    gradeSettingBtn.addEventListener('click', () => {
        document.getElementById('gradeSettingModal').style.display = 'block';
    });

    document.querySelector('#gradeSettingModal .close-modal').addEventListener('click', () => {
        document.getElementById('gradeSettingModal').style.display = 'none';
    });

    document.getElementById('cancelGradeSetting').addEventListener('click', () => {
        document.getElementById('gradeSettingModal').style.display = 'none';
    });

    document.getElementById('saveGradeSetting').addEventListener('click', () => {
        const selectedGrade = document.querySelector('input[name="grade"]:checked').value;
        saveGradeSetting(parseInt(selectedGrade));
        document.getElementById('gradeSettingModal').style.display = 'none';

        // 図鑑を再レンダリングして表示テキストを更新
        renderSoundLibrary();
    });
}

// 現在の学年設定を取得
function getCurrentGrade() {
    const savedGrade = localStorage.getItem('selectedGrade');
    return savedGrade ? parseInt(savedGrade) : 3; // デフォルトは3年生
}

// 学年設定を保存
function saveGradeSetting(grade) {
    localStorage.setItem('selectedGrade', grade);
}

// 図形選択機能の初期化
function initializeShapeSelector() {
    const shapeOptions = document.querySelectorAll('.shape-option');
    if (!shapeOptions.length) return;

    // 図形選択のイベントリスナー
    shapeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 現在の選択を解除
            shapeOptions.forEach(opt => opt.classList.remove('selected'));

            // 新しい選択を設定
            option.classList.add('selected');
            currentSelectedShape = option.dataset.shape;
        });
    });

    // 色選択のイベントリスナー
    const colorPicker = document.getElementById('shapeColor');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            currentShapeColor = e.target.value;
        });
    }

    // 最初の図形を選択状態に
    if (shapeOptions.length > 0) {
        shapeOptions[0].classList.add('selected');
    }
}

// タイムラインの初期化
function initializeTimeline() {
    // タイムライン再生ヘッドの参照を保存
    timelinePlayhead = document.querySelector('.timeline-playhead');

    // ローカルストレージからタイムラインデータを読み込み
    const savedTracks = localStorage.getItem('timelineTracks');
    if (savedTracks) {
        try {
            timelineTracks = JSON.parse(savedTracks);
            // 既存データの更新（音の長さ情報を追加）
            updateExistingTimelineTracks();
            renderTimeline();
        } catch (error) {
            console.error('タイムラインデータの読み込みに失敗しました:', error);
            createDefaultTrack();
        }
    } else {
        createDefaultTrack();
    }
}

// デフォルトトラックの作成
function createDefaultTrack() {
    timelineTracks = [{
        id: 'track-1',
        name: 'トラック 1',
        sounds: []
    }];
    saveTimelineTracks();
    renderTimeline();
}

// タイムライントラックの描画
function renderTimeline() {
    const tracksContainer = document.getElementById('timelineTracks');
    if (!tracksContainer) return;

    tracksContainer.innerHTML = '';

    timelineTracks.forEach(track => {
        // トラック要素の作成
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.dataset.trackId = track.id;

        trackElement.innerHTML = `
            <div class="track-header">
                <span class="track-title">${track.name}</span>
                <button class="delete-track" title="削除">✕</button>
            </div>
            <div class="track-content"></div>
        `;

        // 削除ボタンのイベントリスナー
        const deleteButton = trackElement.querySelector('.delete-track');
        deleteButton.addEventListener('click', () => {
            // 少なくとも1つのトラックは残す
            if (timelineTracks.length > 1) {
                deleteTrack(track.id);
            } else {
                alert('最低1つのトラックが必要です。');
            }
        });

        // トラックをコンテナに追加
        tracksContainer.appendChild(trackElement);

        // トラック内の音要素を描画
        const trackContent = trackElement.querySelector('.track-content');

        // ドラッグ＆ドロップのイベントリスナー
        trackContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            trackContent.style.backgroundColor = '#f8f8f8';
        });

        trackContent.addEventListener('dragleave', () => {
            trackContent.style.backgroundColor = '';
        });

        trackContent.addEventListener('drop', (e) => {
            e.preventDefault();
            trackContent.style.backgroundColor = '';

            // ドロップされたデータがタイムラインの音か、ライブラリからの音かを判断
            const timelineSoundId = e.dataTransfer.getData('application/timelineSound');
            const soundId = e.dataTransfer.getData('text/plain');

            if (timelineSoundId) {
                // タイムライン内での移動
                moveTimelineSound(timelineSoundId, track.id, e.clientX, trackContent);
            } else if (soundId) {
                // ライブラリからの新規追加
                const rect = trackContent.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;

                // 100pxごとのグリッドに合わせる（1秒 = 100px）
                const gridPosition = Math.floor(offsetX / 100) * 100;

                addSoundToTimeline(track.id, soundId, gridPosition);
            }
        });

        // 既存の音要素を再描画
        if (Array.isArray(track.sounds)) {
            track.sounds.forEach(sound => {
                const soundElement = createTimelineSoundElement(sound);
                if (soundElement) {
                    trackContent.appendChild(soundElement);
                }
            });
        }
    });

    updateTimelineView();
}

// タイムラインビューの更新（ウィンドウサイズ変更時など）
function updateTimelineView() {
    // タイムラインの長さを調整
    const tracksContainer = document.getElementById('timelineTracks');
    if (!tracksContainer) return;

    // すべてのトラックの最大位置を計算
    let maxPosition = 0;
    timelineTracks.forEach(track => {
        if (Array.isArray(track.sounds)) {
            track.sounds.forEach(sound => {
                const endPosition = sound.position + (sound.width || 100); // 音の長さを考慮
                if (endPosition > maxPosition) {
                    maxPosition = endPosition;
                }
            });
        }
    });

    // 最低表示幅を設定（コンテナ幅または最大位置 + マージン）
    // 指定幅を増やしてスクロールに余裕を持たせる
    const minWidth = Math.max(1200, maxPosition + 500);

    // 各トラックの幅を設定
    const trackContents = tracksContainer.querySelectorAll('.track-content');
    trackContents.forEach(trackContent => {
        trackContent.style.width = `${minWidth}px`;
    });
}

// タイムライン内での音の移動
function moveTimelineSound(soundElementId, targetTrackId, clientX, trackContent) {
    // 移動する音要素とその所属トラックを見つける
    let sourceTrackIndex = -1;
    let soundIndex = -1;
    let soundData = null;

    for (let i = 0; i < timelineTracks.length; i++) {
        if (!Array.isArray(timelineTracks[i].sounds)) continue;

        const index = timelineTracks[i].sounds.findIndex(s => s.id === soundElementId);
        if (index !== -1) {
            sourceTrackIndex = i;
            soundIndex = index;
            soundData = timelineTracks[i].sounds[index];
            break;
        }
    }

    if (soundData) {
        // 元のトラックから削除
        timelineTracks[sourceTrackIndex].sounds.splice(soundIndex, 1);

        // 新しい位置を計算
        const rect = trackContent.getBoundingClientRect();
        const offsetX = clientX - rect.left;

        // グリッドに合わせる
        const gridPosition = Math.floor(offsetX / 100) * 100;
        soundData.position = gridPosition;

        // 対象のトラックに追加
        const targetTrackIndex = timelineTracks.findIndex(t => t.id === targetTrackId);
        if (targetTrackIndex !== -1) {
            timelineTracks[targetTrackIndex].sounds.push(soundData);
        }

        // 変更を保存して再描画
        saveTimelineTracks();
        renderTimeline();
    }
}

// タイムラインに音を追加
function addSoundToTimeline(trackId, soundId, position) {
    const sound = soundLibrary.find(s => s.id === soundId);
    if (!sound) return;

    // 対象のトラックを見つける
    const trackIndex = timelineTracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;

    // 音ライブラリに図形情報があるかチェック
    const shape = sound.shape || currentSelectedShape;
    const color = sound.color || currentShapeColor;
    const customShape = sound.customShape || null;

    // 音声の長さを取得する（px単位で、1秒=100pxとして換算）
    getAudioDuration(sound.audio).then(duration => {
        // 最低幅を確保（0.5秒分）
        const widthPx = Math.max(duration * 100, 50);

        // タイムライン用の音オブジェクトを作成
        const timelineSound = {
            id: `timeline-sound-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            soundId: soundId,
            name: sound.name,
            position: position,
            shape: shape,
            color: color,
            customShape: customShape,
            duration: duration,
            width: widthPx
        };

        // トラックに追加
        timelineTracks[trackIndex].sounds.push(timelineSound);

        // 保存して再描画
        saveTimelineTracks();
        renderTimeline();
    });
}

// 音声の長さを取得する関数
function getAudioDuration(audioSrc) {
    return new Promise((resolve) => {
        // Base64データの場合やURL形式の場合に対応
        const audio = new Audio(audioSrc);

        // ロード完了または十分なデータが取得できたときに長さを解決
        audio.addEventListener('loadedmetadata', () => {
            // 無限ループや不正な値を防ぐ
            const duration = isNaN(audio.duration) || !isFinite(audio.duration) ? 1 : audio.duration;
            resolve(duration);
        });

        // ロードエラーの場合はデフォルト値を使用
        audio.addEventListener('error', () => {
            resolve(1); // デフォルトは1秒
        });

        // すでにロード済みの場合
        if (audio.readyState >= 2) {
            const duration = isNaN(audio.duration) || !isFinite(audio.duration) ? 1 : audio.duration;
            resolve(duration);
        }
    });
}

// タイムラインの音要素を作成
function createTimelineSoundElement(timelineSound) {
    const sound = soundLibrary.find(s => s.id === timelineSound.soundId);
    if (!sound) return null;

    const soundElement = document.createElement('div');
    soundElement.className = 'timeline-sound';
    soundElement.id = timelineSound.id;
    soundElement.style.left = `${timelineSound.position}px`;

    // 音声の長さに応じた幅を設定
    if (timelineSound.width && timelineSound.width > 0) {
        soundElement.style.width = `${timelineSound.width}px`;
    } else {
        // widthプロパティがない古いデータの場合は、音声の長さを取得して設定
        getAudioDuration(sound.audio).then(duration => {
            const widthPx = Math.max(duration * 100, 50);
            soundElement.style.width = `${widthPx}px`;
            // データを更新
            timelineSound.duration = duration;
            timelineSound.width = widthPx;
            saveTimelineTracks();
        });
        // 一時的に最小幅を設定
        soundElement.style.width = '90px';
    }

    soundElement.style.backgroundColor = `${timelineSound.color || sound.color || '#4CAF50'}20`; // 20%の透明度
    soundElement.style.borderColor = timelineSound.color || sound.color || '#4CAF50';
    soundElement.draggable = true;

    // 図形要素の生成
    let shapeHTML = '';

    // カスタム図形の場合
    if ((timelineSound.shape === 'custom' && timelineSound.customShape) ||
        (sound.shape === 'custom' && sound.customShape)) {
        const customShapeData = timelineSound.customShape || sound.customShape;
        shapeHTML = `<img src="${customShapeData}" alt="カスタム図形" width="30" height="30">`;
    } else {
        // プリセット図形の場合
        const shape = timelineSound.shape || sound.shape || 'circle';
        let shapeSymbol = '●'; // デフォルト
        switch (shape) {
            case 'circle': shapeSymbol = '●'; break;
            case 'square': shapeSymbol = '■'; break;
            case 'triangle': shapeSymbol = '▲'; break;
            case 'star': shapeSymbol = '★'; break;
            case 'wave': shapeSymbol = '〰'; break;
            case 'line': shapeSymbol = '―'; break;
            case 'zigzag': shapeSymbol = '∿'; break;
            case 'cross': shapeSymbol = '✕'; break;
            case 'dot': shapeSymbol = '・'; break;
            default: shapeSymbol = '●';
        }
        shapeHTML = shapeSymbol;
    }

    // 音声の長さ表示を追加
    const durationText = timelineSound.duration ? `${timelineSound.duration.toFixed(1)}秒` : '';

    // 削除ボタンを追加
    soundElement.innerHTML = `
        <div class="delete-timeline-sound" title="削除">✕</div>
        <div class="timeline-sound-shape" style="color: ${timelineSound.color || sound.color || '#4CAF50'}">${shapeHTML}</div>
        <div class="timeline-sound-name">${sound.name}</div>
        <div class="timeline-sound-duration">${durationText}</div>
    `;

    // ダブルクリックで試聴
    soundElement.addEventListener('dblclick', () => {
        const audio = new Audio(sound.audio);
        audio.play();
    });

    // ドラッグ＆ドロップ
    soundElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/timelineSound', timelineSound.id);
        soundElement.style.opacity = '0.4';
    });

    soundElement.addEventListener('dragend', () => {
        soundElement.style.opacity = '1';
    });

    // 削除ボタンのイベントリスナーを設定
    const deleteButton = soundElement.querySelector('.delete-timeline-sound');
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの伝播を停止
        if (confirm(`「${sound.name}」をタイムラインから削除しますか？`)) {
            removeTimelineSound(timelineSound.id);
        }
    });

    // 右クリックメニュー（音の削除）も残しておく
    soundElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm(`「${sound.name}」をタイムラインから削除しますか？`)) {
            removeTimelineSound(timelineSound.id);
        }
    });

    return soundElement;
}

// タイムラインから音を削除
function removeTimelineSound(soundElementId) {
    for (let i = 0; i < timelineTracks.length; i++) {
        if (!Array.isArray(timelineTracks[i].sounds)) continue;

        const soundIndex = timelineTracks[i].sounds.findIndex(s => s.id === soundElementId);
        if (soundIndex !== -1) {
            timelineTracks[i].sounds.splice(soundIndex, 1);
            saveTimelineTracks();
            renderTimeline();
            break;
        }
    }
}

// 新しいトラックを追加
function addNewTrack() {
    const newTrackId = `track-${Date.now()}`;
    const trackNumber = timelineTracks.length + 1;

    const newTrack = {
        id: newTrackId,
        name: `トラック ${trackNumber}`,
        sounds: []
    };

    timelineTracks.push(newTrack);
    saveTimelineTracks();
    renderTimeline();
}

// トラックを削除
function deleteTrack(trackId) {
    timelineTracks = timelineTracks.filter(track => track.id !== trackId);

    // トラック名を整理（削除後に番号を振り直す）
    timelineTracks.forEach((track, index) => {
        track.name = `トラック ${index + 1}`;
    });

    saveTimelineTracks();
    renderTimeline();
}

// タイムラインをクリア
function clearTimeline() {
    const confirmClear = confirm('タイムライン上のすべての音を削除しますか？');
    if (!confirmClear) return;

    // 各トラックの音をクリア
    timelineTracks.forEach(track => {
        track.sounds = [];
    });

    saveTimelineTracks();
    renderTimeline();
}

// タイムラインを再生
function playTimeline() {
    if (isTimelinePlaying) return;

    // タイムラインに音があるかチェック
    let hasSounds = false;
    for (const track of timelineTracks) {
        if (Array.isArray(track.sounds) && track.sounds.length > 0) {
            hasSounds = true;
            break;
        }
    }

    if (!hasSounds) {
        alert('再生する音がありません。タイムラインに音を追加してください。');
        return;
    }

    // 再生状態に設定
    isTimelinePlaying = true;

    // 再生ヘッドを表示
    if (timelinePlayhead) {
        timelinePlayhead.style.display = 'block';
        timelinePlayhead.style.left = '120px'; // トラックヘッダーの幅
    }

    // 最も遠い音の位置を計算
    let maxEndPosition = 0;
    timelineTracks.forEach(track => {
        if (Array.isArray(track.sounds)) {
            track.sounds.forEach(sound => {
                // 音の終了位置を計算（位置 + 幅）
                const endPosition = sound.position + (sound.width || 100);
                if (endPosition > maxEndPosition) {
                    maxEndPosition = endPosition;
                }
            });
        }
    });

    // 再生時間の設定（100px = 1秒）
    const duration = (maxEndPosition / 100) * 1000; // ミリ秒単位

    // トラックコンテナの参照を取得
    const tracksContainer = document.querySelector('.timeline-tracks');

    // 音の再生をスケジュール
    const startTime = Date.now();
    const scheduledSounds = [];

    timelineTracks.forEach(track => {
        if (!Array.isArray(track.sounds)) return;

        track.sounds.forEach(timelineSound => {
            const sound = soundLibrary.find(s => s.id === timelineSound.soundId);
            if (sound) {
                // 再生開始時間を計算
                const playTime = (timelineSound.position / 100) * 1000; // ミリ秒単位

                // 音の要素を取得
                const element = document.getElementById(timelineSound.id);

                // スケジューリング情報を保存
                scheduledSounds.push({
                    sound: sound,
                    element: element,
                    playTime: playTime,
                    duration: timelineSound.duration || 1
                });

                // タイマーで再生
                setTimeout(() => {
                    if (!isTimelinePlaying) return; // 再生停止されていたら何もしない

                    // 音を再生
                    const audio = new Audio(sound.audio);
                    audio.play();

                    // 再生中の視覚効果
                    if (element) {
                        element.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.8)';

                        // 音の長さに合わせて効果を消す
                        const effectDuration = timelineSound.duration ? timelineSound.duration * 1000 : 1000;
                        setTimeout(() => {
                            if (element) element.style.boxShadow = 'none';
                        }, effectDuration);
                    }
                }, playTime);
            }
        });
    });

    // 再生ヘッドのアニメーション
    const startPosition = 120; // ヘッダー幅
    const endPosition = startPosition + maxEndPosition + 100;
    const animationStartTime = Date.now();

    // 再生ヘッドを動かすインターバル
    timelineInterval = setInterval(() => {
        const elapsed = Date.now() - animationStartTime;
        const position = startPosition + (elapsed / 1000) * 100; // 1秒=100px

        if (timelinePlayhead) {
            timelinePlayhead.style.left = `${position}px`;

            // 再生ヘッドがビューポートの右端付近に達したらスクロール処理
            if (tracksContainer) {
                const viewportRight = tracksContainer.scrollLeft + tracksContainer.clientWidth - 200; // 余裕を持たせる

                // 再生ヘッドがビューポートの右端付近に来たらスクロール
                if (position > viewportRight) {
                    // スムーズスクロールではなく、即座にスクロール位置を設定
                    tracksContainer.scrollLeft = position - (tracksContainer.clientWidth / 2);
                }
            }
        }

        // 終端に到達したら停止
        if (position >= endPosition || !isTimelinePlaying) {
            stopTimeline();
        }
    }, 16); // 約60fps
}

// タイムラインの再生を停止
function stopTimeline() {
    isTimelinePlaying = false;

    // 再生ヘッドを非表示
    if (timelinePlayhead) {
        timelinePlayhead.style.display = 'none';
    }

    // インターバルを停止
    if (timelineInterval) {
        clearInterval(timelineInterval);
        timelineInterval = null;
    }

    // 音の再生を全て停止
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });

    // 視覚効果をリセット
    const timelineSounds = document.querySelectorAll('.timeline-sound');
    timelineSounds.forEach(element => {
        element.style.boxShadow = 'none';
    });
}

// タイムライントラックをローカルストレージに保存
function saveTimelineTracks() {
    try {
        localStorage.setItem('timelineTracks', JSON.stringify(timelineTracks));
    } catch (error) {
        console.error('タイムラインの保存に失敗しました:', error);
    }
}

// 既存のタイムライントラックデータを更新
function updateExistingTimelineTracks() {
    let needsUpdate = false;

    // 既存のトラックをループして、音の長さ情報が欠けているものを更新
    for (const track of timelineTracks) {
        if (Array.isArray(track.sounds)) {
            for (const sound of track.sounds) {
                if (!sound.width || !sound.duration) {
                    needsUpdate = true;
                    const librarySound = soundLibrary.find(s => s.id === sound.soundId);
                    if (librarySound) {
                        // 非同期処理を使って音声の長さを取得
                        getAudioDuration(librarySound.audio).then(duration => {
                            sound.duration = duration;
                            sound.width = Math.max(duration * 100, 50);
                        });
                    }
                }
            }
        }
    }

    // 更新が必要な場合は保存
    if (needsUpdate) {
        setTimeout(() => {
            saveTimelineTracks();
            renderTimeline();
        }, 500); // 非同期処理の完了を待つ
    }
}

// タイムライン用の利用可能な音を表示
function renderAvailableSoundsForTimeline() {
    const container = document.getElementById('availableSoundsForTimeline');
    if (!container) return;

    container.innerHTML = '';

    soundLibrary.forEach(sound => {
        const soundItem = document.createElement('div');
        soundItem.className = 'sound-item';
        soundItem.dataset.id = sound.id;

        soundItem.innerHTML = `
            <h4>${sound.name}</h4>
            <span class="category">${sound.category}</span>
        `;

        // ドラッグ機能
        soundItem.draggable = true;
        soundItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', sound.id);
            soundItem.classList.add('dragging');
        });

        soundItem.addEventListener('dragend', () => {
            soundItem.classList.remove('dragging');
        });

        // クリックで試聴
        soundItem.addEventListener('click', () => {
            const audio = new Audio(sound.audio);
            audio.play();
        });

        container.appendChild(soundItem);
    });
}

// 録音時に図形を選択する機能を追加
function addShapeSelectorToRecording() {
    // 保存画面内に図形選択セクションを挿入
    const saveRecordingDiv = document.getElementById('saveRecording');
    const saveSoundBtn = document.getElementById('saveSoundBtn');

    // 図形選択セクションの作成
    const shapeSelectorDiv = document.createElement('div');
    shapeSelectorDiv.className = 'form-group shape-selector-recording';
    shapeSelectorDiv.innerHTML = `
        <label>音を表す図形を選ぶ：</label>
        <div class="shape-options-recording">
            <div class="shape-option-recording selected" data-shape="circle">●</div>
            <div class="shape-option-recording" data-shape="square">■</div>
            <div class="shape-option-recording" data-shape="triangle">▲</div>
            <div class="shape-option-recording" data-shape="star">★</div>
            <div class="shape-option-recording" data-shape="wave">〰</div>
            <div class="shape-option-recording" data-shape="line">―</div>
            <div class="shape-option-recording" data-shape="zigzag">∿</div>
            <div class="shape-option-recording" data-shape="cross">✕</div>
            <div class="shape-option-recording" data-shape="dot">・</div>
        </div>
        <div class="shape-color-picker-recording">
            <label for="shapeColorRecording">図形の色：</label>
            <input type="color" id="shapeColorRecording" value="#4CAF50">
        </div>
        <div class="custom-shape-container">
            <label for="customShapeCanvas">自分で図形を描く：</label>
            <canvas id="customShapeCanvas" width="200" height="100"></canvas>
            <button type="button" class="small-button" id="clearCustomShape">消去</button>
        </div>
    `;

    // 保存ボタンの前に挿入
    saveRecordingDiv.insertBefore(shapeSelectorDiv, saveSoundBtn);

    // 図形選択のイベントリスナー設定
    const shapeOptions = shapeSelectorDiv.querySelectorAll('.shape-option-recording');
    shapeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 現在の選択を解除
            shapeOptions.forEach(opt => opt.classList.remove('selected'));

            // 新しい選択を設定
            option.classList.add('selected');

            // カスタム図形モードを無効化
            document.getElementById('customShapeCanvas').classList.remove('active');
        });
    });

    // カスタム図形描画キャンバスの設定
    initializeCustomShapeCanvas();
}

// カスタム図形描画キャンバスの初期化
function initializeCustomShapeCanvas() {
    const canvas = document.getElementById('customShapeCanvas');
    const clearBtn = document.getElementById('clearCustomShape');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // 描画領域の初期化
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // マウスイベントリスナー
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // タッチイベントリスナー（モバイル対応）
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);

    // クリアボタン
    clearBtn.addEventListener('click', () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // 描画開始
    function startDrawing(e) {
        isDrawing = true;
        draw(e);

        // カスタム図形が選択されたことを示す
        canvas.classList.add('active');

        // 他の図形選択を解除
        const shapeOptions = document.querySelectorAll('.shape-option-recording');
        shapeOptions.forEach(opt => opt.classList.remove('selected'));
    }

    // 描画
    function draw(e) {
        if (!isDrawing) return;

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = document.getElementById('shapeColorRecording').value;

        ctx.lineTo(getX(e), getY(e));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(getX(e), getY(e));
    }

    // 描画停止
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }

    // タッチイベント処理
    function handleTouch(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 'mousemove',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        canvas.dispatchEvent(mouseEvent);
        e.preventDefault();
    }

    // イベントからX座標を取得
    function getX(e) {
        const rect = canvas.getBoundingClientRect();
        return e.clientX - rect.left;
    }

    // イベントからY座標を取得
    function getY(e) {
        const rect = canvas.getBoundingClientRect();
        return e.clientY - rect.top;
    }
}