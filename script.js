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
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            document.getElementById('recordedAudio').src = audioUrl;
            document.getElementById('saveRecording').classList.remove('hidden');
        };

        // 録音開始
        mediaRecorder.start();

        // UI更新
        const startRecordBtn = document.getElementById('startRecordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');

        startRecordBtn.disabled = true;
        stopRecordBtn.disabled = false;
        
        // 録音中のボタンスタイル変更
        startRecordBtn.style.backgroundColor = '#9e9e9e'; // グレーに変更
        startRecordBtn.style.cursor = 'not-allowed';
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
    } else {
        // サンプルの音データを追加
        soundLibrary = [
            {
                id: '1',
                name: '鳥のさえずり',
                category: '自然',
                tags: ['鳥', '朝', '公園'],
                audio: '', // サンプル音声のBase64データ
                dateCreated: new Date().toISOString()
            },
            {
                id: '2',
                name: '雨の音',
                category: '自然',
                tags: ['雨', '水', '静か'],
                audio: '', // サンプル音声のBase64データ
                dateCreated: new Date().toISOString()
            }
        ];
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

        soundCard.innerHTML = `
            <h4>${sound.name}</h4>
            <span class="category">${sound.category}</span>
            <audio controls src="${sound.audio}"></audio>
            ${infoHTML}
            <div class="tags">${tagsHTML}</div>
        `;

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

    soundLibrary.forEach(sound => {
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
        const audio = new Audio(sound.audio);
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
    
    // 録音開始時の元の関数を保存
    const originalStartRecording = window.startRecording;
    
    // 録音開始関数を上書き
    window.startRecording = async function() {
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
            
            // 元の録音開始関数を呼び出す
            await originalStartRecording.call(this, stream);
            
            // 録音停止時に波形表示も停止するように設定
            const originalStopRecording = window.stopRecording;
            window.stopRecording = function() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                canvas.style.display = 'none';
                originalStopRecording.call(this);
            };
            
        } catch (error) {
            console.error('録音を開始できませんでした:', error);
            alert('マイクへのアクセスを許可してください。');
        }
    };
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