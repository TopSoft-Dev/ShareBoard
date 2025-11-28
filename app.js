import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, remove, onValue } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Konfiguracja Firebase (Twoje dane)
const firebaseConfig = {
    apiKey: "AIzaSyARZHexAy2n7FK7RYqPdWgY3rAqzWCrXKQ",
    authDomain: "shareboard-5603a.firebaseapp.com",
    databaseURL: "https://shareboard-5603a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "shareboard-5603a",
    storageBucket: "shareboard-5603a.firebasestorage.app",
    messagingSenderId: "853931218624",
    appId: "1:853931218624:web:8946c2a857d243776fbf25"
};

// Inicjalizacja
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referencje DOM
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
// Toolbar buttons
const btnSelect = document.getElementById('btnSelect');
const btnPan = document.getElementById('btnPan');
const btnDraw = document.getElementById('btnDraw');
const btnObjects = document.getElementById('btnObjects');
const btnClear = document.getElementById('btnClear');

// Context Panel (Properties)
const propertiesPanel = document.getElementById('propertiesPanel'); // Główny kontener
const drawContext = document.getElementById('drawContext');
const blockContext = document.getElementById('blockContext');
const connectionContext = document.getElementById('connectionContext');
const textContext = document.getElementById('textContext'); 
const sineContext = document.getElementById('sineContext'); 
const timerContext = document.getElementById('timerContext'); // NOWE
const sliderContext = document.getElementById('sliderContext'); 
const diceContext = document.getElementById('diceContext'); // NOWE
const checklistContext = document.getElementById('checklistContext'); // NOWE
const vennContext = document.getElementById('vennContext'); // NOWE
const matrixContext = document.getElementById('matrixContext'); // NOWE

const btnDeleteObject = document.getElementById('btnDeleteObject');
const btnDeleteConnections = document.getElementById('btnDeleteConnections');
const btnDeleteConn = document.getElementById('btnDeleteConn');
const btnDeleteSine = document.getElementById('btnDeleteSine');
const btnDeleteTriangle = document.getElementById('btnDeleteTriangle');
const btnDeleteTriangleConnections = document.getElementById('btnDeleteTriangleConnections');
const btnDeleteTimer = document.getElementById('btnDeleteTimer'); // NOWE
const btnDeleteDice = document.getElementById('btnDeleteDice'); // NOWE
const btnDeleteChecklist = document.getElementById('btnDeleteChecklist'); // NOWE
const btnDeleteVenn = document.getElementById('btnDeleteVenn'); // NOWE
const btnDeleteMatrix = document.getElementById('btnDeleteMatrix'); // NOWE

const btnEditText = document.getElementById('btnEditText'); 
const fontSizeInput = document.getElementById('fontSizeInput'); 

const sineLabelX = document.getElementById('sineLabelX');
const sineLabelY = document.getElementById('sineLabelY');

const triLabel1 = document.getElementById('triLabel1');
const triLabel2 = document.getElementById('triLabel2');
const triLabel3 = document.getElementById('triLabel3');

const timerDuration = document.getElementById('timerDuration'); // NOWE
const btnTimerStart = document.getElementById('btnTimerStart'); // NOWE
const btnTimerReset = document.getElementById('btnTimerReset'); // NOWE

// Kostka
const diceMin = document.getElementById('diceMin'); // NOWE
const diceMax = document.getElementById('diceMax'); // NOWE

// Checklista
const checklistNewItem = document.getElementById('checklistNewItem'); // NOWE
const btnAddChecklistItem = document.getElementById('btnAddChecklistItem'); // NOWE

// Venn
const vennLabel1 = document.getElementById('vennLabel1'); // NOWE
const vennLabel2 = document.getElementById('vennLabel2'); // NOWE
const vennLabel3 = document.getElementById('vennLabel3'); // NOWE

// Macierz
const matrixLabel1 = document.getElementById('matrixLabel1'); // NOWE
const matrixLabel2 = document.getElementById('matrixLabel2'); // NOWE
const matrixLabel3 = document.getElementById('matrixLabel3'); // NOWE
const matrixLabel4 = document.getElementById('matrixLabel4'); // NOWE

const btnEraser = document.getElementById('btnEraser');
const btnLine = document.getElementById('btnLine');

// Floating Editor Elements
const textEditorOverlay = document.getElementById('textEditorOverlay');
const editTextInput = document.getElementById('editTextInput');
const editSizeInput = document.getElementById('editSize');
const btnBold = document.getElementById('btnBold');
const btnItalic = document.getElementById('btnItalic');

// Others
const objectsPanel = document.getElementById('objectsPanel');
const brushCursor = document.getElementById('brushCursor');
const btnAddBlock = document.getElementById('btnAddBlock');
const btnAddSine = document.getElementById('btnAddSine');
const btnAddTriangle = document.getElementById('btnAddTriangle');
const btnAddDice = document.getElementById('btnAddDice'); // NOWE
const btnAddTimer = document.getElementById('btnAddTimer'); // NOWE
const btnAddChecklist = document.getElementById('btnAddChecklist'); // NOWE
const btnAddVenn = document.getElementById('btnAddVenn'); // NOWE
const btnAddMatrix = document.getElementById('btnAddMatrix'); // NOWE
const btnAddText = document.getElementById('btnAddText');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
// Stare modale usunięte z HTML, ale zmienne zostawiam by nie psuć reszty, choć nieużywane
const btnConfirmText = document.getElementById('btnConfirmText');
const btnCancelText = document.getElementById('btnCancelText');

// Stan aplikacji
let currentTool = 'select'; // 'pan', 'select', 'draw'
let isEraser = false; // NOWE
let isLineMode = false; // NOWE
let isDrawing = false;
let isPanning = false;
let currentStrokeId = null;
let pendingPoints = [];
let lastPoint = null;
let strokeOrigin = null; // NOWE - punkt startowy dla linii
let textPosition = null;
let editingBlockId = null; // ID bloku aktualnie edytowanego w overlayu

// Stan Obiektów (Select Mode)
let interactionMode = 'idle'; // 'moving', 'resizing', 'connecting', 'idle'
let selectedElement = null; // { type: 'block'|'conn', id: string }
let dragStart = { x: 0, y: 0 }; // World coords
let initialBlockState = null; // { x, y, w, h }
let activeAnchor = null; // { blockId, side }
let tempConnection = null; // { start: {x,y}, end: {x,y} }

// Konfiguracja Kartki (Proporcje monitora 16:9)
const PAPER_W = 1600;
const PAPER_H = 900;
const BLOCK_MIN_SIZE = 50;
const HANDLE_SIZE = 8;
const ANCHOR_SIZE = 6;

// Kamera (widok)
let camera = { x: 0, y: 0 };
let scale = 1; 
const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;

let startPanPoint = { x: 0, y: 0 };

// --- NOWOŚĆ: Lokalna historia do przerysowywania po resize ---
const localData = {
    strokes: {}, 
    notes: {},
    blocks: {}, // { id: { x, y, w, h, text, color } }
    connections: {} // { id: { fromBlock, fromSide, toBlock, toSide } }
};

// Bufor dla rysunków (Warstwa kresek - pozwala na prawdziwe wymazywanie)
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = PAPER_W;
offscreenCanvas.height = PAPER_H;
const offCtx = offscreenCanvas.getContext('2d');

function redrawBoard() {
    // 1. Tło aplikacji (szare biurko)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Ustawienie kamery i skali
    ctx.translate(camera.x, camera.y);
    ctx.scale(scale, scale);

    // 3. Rysowanie Kartki (Biała z cieniem)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20 / scale;
    ctx.shadowOffsetX = 5 / scale;
    ctx.shadowOffsetY = 5 / scale;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAPER_W, PAPER_H);

    // Reset cienia
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 4. Przycinanie (Clip)
    ctx.save(); 
    ctx.beginPath();
    ctx.rect(0, 0, PAPER_W, PAPER_H);
    ctx.clip();

    // 5. Rysowanie zawartości
    
    // 5a. Połączenia (Pod spodem)
    ctx.lineWidth = 2;
    Object.entries(localData.connections).forEach(([connId, conn]) => {
        const b1 = localData.blocks[conn.fromBlock];
        const b2 = localData.blocks[conn.toBlock];
        if (!b1 || !b2) return;

        const start = getAnchorPos(b1, conn.fromSide);
        const end = getAnchorPos(b2, conn.toSide);

        const isSelected = selectedElement && selectedElement.type === 'connection' && selectedElement.id === connId;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = isSelected ? '#dc3545' : '#555';
        ctx.lineWidth = isSelected ? 4 : 2;
        // Linia przerywana dla wszystkich połączeń
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Kropki na końcach
        ctx.fillStyle = isSelected ? '#dc3545' : '#555';
        ctx.beginPath(); ctx.arc(start.x, start.y, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(end.x, end.y, 3, 0, Math.PI*2); ctx.fill();
    });

    // Tymczasowe połączenie
    if (interactionMode === 'connecting' && tempConnection) {
        ctx.beginPath();
        ctx.moveTo(tempConnection.start.x, tempConnection.start.y);
        ctx.lineTo(tempConnection.end.x, tempConnection.end.y);
        ctx.strokeStyle = '#007bff';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 5b. Bloki (Sortowanie: Macierz najpierw)
    const sortedBlocks = Object.entries(localData.blocks).sort(([,a], [,b]) => {
        if (a.isMatrix && !b.isMatrix) return -1;
        if (!a.isMatrix && b.isMatrix) return 1;
        return 0;
    });

    sortedBlocks.forEach(([id, block]) => {
        drawBlock(ctx, block, id === selectedElement?.id);
    });

    // 5c. Kreski (Renderowanie na offscreen)
    offCtx.clearRect(0, 0, PAPER_W, PAPER_H);
    
    Object.values(localData.strokes).forEach(stroke => {
        if (stroke.points.length === 0) return;
        
        offCtx.beginPath();
        
        if (stroke.color === '#ffffff') {
             // Gumka: usuwa piksele z warstwy rysunkowej
             offCtx.globalCompositeOperation = 'destination-out';
             offCtx.lineWidth = stroke.width;
             offCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
             // Pędzel: dodaje piksele
             offCtx.globalCompositeOperation = 'source-over';
             offCtx.strokeStyle = stroke.color;
             offCtx.lineWidth = stroke.width;
        }
        
        offCtx.lineCap = 'round';
        offCtx.lineJoin = 'round';
        offCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            offCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        offCtx.stroke();
    });
    
    // Narysuj warstwę kresek na głównym canvasie
    ctx.drawImage(offscreenCanvas, 0, 0);

    // 5d. Notatki
    Object.values(localData.notes).forEach(note => {
        ctx.font = `${note.size}px Arial`;
        ctx.fillStyle = note.color;
        ctx.fillText(note.text, note.x, note.y);
    });

    ctx.restore(); 
}

// Helpery Rysowania
function drawBlock(ctx, block, isSelected) {
    if (block.isDice) {
        // --- RYSOWANIE KOSTKI ---
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // Zaokrąglony kwadrat
        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.w, block.h, 10);
        ctx.fill();
        ctx.stroke();
        
        // Liczba zamiast kropek
        ctx.fillStyle = '#000';
        const val = block.value || (block.minVal || 1);
        
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, block.x + block.w/2, block.y + block.h/2);

        if (isSelected) {
             drawHandle(ctx, block.x, block.y); 
             drawHandle(ctx, block.x + block.w, block.y + block.h);
        }
        return;
    }

    if (block.isTimer) {
        // --- RYSOWANIE TIMERA ---
        const now = Date.now();
        let remaining = block.duration * 60; // Default (seconds)
        let isAlarm = false;

        if (block.isRunning && block.endTime) {
            const diff = Math.ceil((block.endTime - now) / 1000);
            remaining = diff;
            if (remaining <= 0) {
                remaining = 0;
                isAlarm = true;
            }
        }

        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        // Tło
        ctx.fillStyle = isAlarm ? '#ffcccc' : '#333';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.w, block.h, 5);
        ctx.fill();
        ctx.stroke();

        // Wyświetlacz
        ctx.fillStyle = isAlarm ? '#ff0000' : '#0f0';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeStr, block.x + block.w/2, block.y + block.h/2);

        if (isSelected) {
             drawHandle(ctx, block.x + block.w, block.y + block.h);
        }
        return;
    }

    if (block.isChecklist) {
        // --- RYSOWANIE CHECKLISTY ---
        ctx.fillStyle = '#fffdf0'; // Żółta kartka
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(block.x, block.y, block.w, block.h);
        ctx.fill();
        ctx.stroke();

        // Tytuł
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(block.title || "Lista", block.x + block.w/2, block.y + 10);

        // Linie
        ctx.beginPath();
        ctx.moveTo(block.x + 10, block.y + 30);
        ctx.lineTo(block.x + block.w - 10, block.y + 30);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();

        // Elementy
        const items = block.items || [];
        const itemH = 30;
        let currY = block.y + 40;

        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        items.forEach((item, idx) => {
            // Checkbox
            const boxX = block.x + 15;
            const boxY = currY;
            ctx.strokeStyle = '#000';
            ctx.strokeRect(boxX, boxY, 14, 14);

            if (item.checked) {
                // Krzyżyk / Ptaszek
                ctx.beginPath();
                ctx.moveTo(boxX + 2, boxY + 2);
                ctx.lineTo(boxX + 12, boxY + 12);
                ctx.moveTo(boxX + 12, boxY + 2);
                ctx.lineTo(boxX + 2, boxY + 12);
                ctx.stroke();
            }

            // Tekst
            ctx.fillStyle = item.checked ? '#888' : '#000';
            if (item.checked) {
                 // Przekreślenie ręczne (proste)
                 const tw = ctx.measureText(item.text).width;
                 ctx.beginPath();
                 ctx.moveTo(boxX + 25, boxY + 7);
                 ctx.lineTo(boxX + 25 + tw, boxY + 7);
                 ctx.strokeStyle = '#888';
                 ctx.stroke();
            }
            ctx.fillText(item.text, boxX + 25, boxY);

            // Ikona usuwania (X) - Tylko gdy wybrany
            if (isSelected) {
                ctx.fillStyle = '#dc3545';
                ctx.font = 'bold 14px Arial';
                ctx.fillText("×", block.x + block.w - 20, boxY); // Po prawej
            }

            // Kropka łączenia (tylko wizualnie, logika później)
            if (isSelected || interactionMode === 'connecting') {
                drawAnchor(ctx, { x: block.x + block.w, y: currY + 7 });
            }

            currY += itemH;
        });

        if (isSelected) {
             // Standardowe uchwyty
             drawHandle(ctx, block.x, block.y); 
             drawHandle(ctx, block.x + block.w, block.y + block.h);
        }
        return;
    }

    if (block.isVenn) {
        // --- RYSOWANIE VENNA ---
        const circles = block.circles || [];
        const radius = Math.min(block.w, block.h) / 2;
        
        ctx.save();
        // Używamy multiply dla efektu mieszania kolorów
        ctx.globalCompositeOperation = 'multiply';
        
        circles.forEach((c, i) => {
            ctx.fillStyle = c.color;
            ctx.beginPath();
            // Pozycje kół: Układ trójkątny
            let cx, cy;
            if (i === 0) { cx = block.x + radius * 0.7; cy = block.y + radius * 0.7; } // Lewo Góra
            else if (i === 1) { cx = block.x + block.w - radius * 0.7; cy = block.y + radius * 0.7; } // Prawo Góra
            else { cx = block.x + block.w/2; cy = block.y + block.h - radius * 0.7; } // Dół Środek
            
            ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Etykieta (rysowana "nad" multiply - wymaga resetu, ale dla prostoty tutaj ok)
        });
        ctx.restore();
        
        // Etykiety (osobna pętla, normalny tryb)
        circles.forEach((c, i) => {
            let cx, cy;
            if (i === 0) { cx = block.x + radius * 0.7; cy = block.y + radius * 0.7; }
            else if (i === 1) { cx = block.x + block.w - radius * 0.7; cy = block.y + radius * 0.7; }
            else { cx = block.x + block.w/2; cy = block.y + block.h - radius * 0.7; }
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(c.label, cx, cy);
        });

        if (isSelected) {
             drawHandle(ctx, block.x, block.y); 
             drawHandle(ctx, block.x + block.w, block.y + block.h);
        }
        return;
    }

    if (block.isMatrix) {
        // --- RYSOWANIE MACIERZY ---
        ctx.fillStyle = '#fff';
        ctx.fillRect(block.x, block.y, block.w, block.h);
        
        // Osie
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Pionowa
        ctx.moveTo(block.x + block.w/2, block.y);
        ctx.lineTo(block.x + block.w/2, block.y + block.h);
        // Pozioma
        ctx.moveTo(block.x, block.y + block.h/2);
        ctx.lineTo(block.x + block.w, block.y + block.h/2);
        ctx.stroke();

        // Etykiety ćwiartek (Labels)
        const labels = block.labels || ["Q1", "Q2", "Q3", "Q4"];
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Q1 (Góra-Lewo)
        ctx.fillText(labels[0], block.x + block.w/4, block.y + block.h/4);
        // Q2 (Góra-Prawo)
        ctx.fillText(labels[1], block.x + 3*block.w/4, block.y + block.h/4);
        // Q3 (Dół-Lewo)
        ctx.fillText(labels[2], block.x + block.w/4, block.y + 3*block.h/4);
        // Q4 (Dół-Prawo)
        ctx.fillText(labels[3], block.x + 3*block.w/4, block.y + 3*block.h/4);

        // Ramka
        ctx.strokeRect(block.x, block.y, block.w, block.h);

        if (isSelected) {
             drawHandle(ctx, block.x + block.w, block.y + block.h);
        }
        return;
    }

    if (block.isTriangle) {
        // --- RYSOWANIE TRÓJKĄTA ZALEŻNOŚCI ---
        const x = block.x;
        const y = block.y;
        const w = block.w; // Dodano brakującą definicję
        const h = block.h; // Dodano brakującą definicję
        
        // Domyślne wartości (zabezpieczenie)
        const v1 = block.v1 || { x: 100, y: 0 };
        const v2 = block.v2 || { x: 0, y: 173 };
        const v3 = block.v3 || { x: 200, y: 173 };
        const pt = block.point || { x: 100, y: 115 };
        const labels = block.labels || ["Szybko", "Tanio", "Jakość"];

        // 1. Główny kształt
        ctx.beginPath();
        ctx.moveTo(x + v1.x, y + v1.y);
        ctx.lineTo(x + v2.x, y + v2.y);
        ctx.lineTo(x + v3.x, y + v3.y);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        
        // 2. Linie napięcia (od punktu do wierzchołków)
        ctx.beginPath();
        ctx.moveTo(x + v1.x, y + v1.y); ctx.lineTo(x + pt.x, y + pt.y);
        ctx.moveTo(x + v2.x, y + v2.y); ctx.lineTo(x + pt.x, y + pt.y);
        ctx.moveTo(x + v3.x, y + v3.y); ctx.lineTo(x + pt.x, y + pt.y);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Obliczanie wartości (Skala 1-10)
        // Referencja: długość podstawy (v2-v3) jako maksymalny zasięg "wpływu"
        const maxDist = dist(v2.x, v2.y, v3.x, v3.y) || 1;
        
        const d1 = dist(pt.x, pt.y, v1.x, v1.y);
        const d2 = dist(pt.x, pt.y, v2.x, v2.y);
        const d3 = dist(pt.x, pt.y, v3.x, v3.y);

        // Funkcja mapująca odległość na wartość 1-10
        const calcVal = (d) => {
            // Im bliżej (d=0), tym 10. Im dalej (d=maxDist), tym 1.
            let v = 10 - (d / maxDist) * 9;
            v = Math.max(1, Math.min(10, v)); // Clamp 1-10
            return Math.round(v * 10) / 10; // Zaokrąglenie do 1 miejsca po przecinku (opcjonalnie do całkowitych: Math.round(v))
        };

        const val1 = Math.round(calcVal(d1)); // Całkowite liczby wyglądają czyściej
        const val2 = Math.round(calcVal(d2));
        const val3 = Math.round(calcVal(d3));

        // 3. Etykiety
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#000';
        
        // Label 1 (Góra)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${labels[0]} (${val1})`, x + v1.x, y + v1.y - 10);
        
        // Label 2 (Lewy)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(`${labels[1]} (${val2})`, x + v2.x - 10, y + v2.y + 10);
        
        // Label 3 (Prawy)
        ctx.textAlign = 'left';
        ctx.fillText(`${labels[2]} (${val3})`, x + v3.x + 10, y + v3.y + 10);

        // 4. Punkt równowagi
        ctx.beginPath();
        ctx.arc(x + pt.x, y + pt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff5722'; // Distinct orange
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (isSelected) {
             // Uchwyt punktu (kwadracik w środku kółka dla jasności, że to edytowalne)
             ctx.fillStyle = '#fff';
             ctx.fillRect(x + pt.x - 3, y + pt.y - 3, 6, 6);

             // Uchwyty skalowania całego obiektu (BBox)
             // Oddalenie uchwytów od trójkąta
             const pad = 20;
             drawHandle(ctx, x - pad, y - pad); 
             drawHandle(ctx, x + w + pad, y - pad); 
             drawHandle(ctx, x + w + pad, y + h + pad); 
             drawHandle(ctx, x - pad, y + h + pad); 
        }

        // Kotwice dla trójkąta (Na wierzchołkach)
        if (isSelected || interactionMode === 'connecting') {
            drawAnchor(ctx, getAnchorPos(block, 'top'));
            drawAnchor(ctx, getAnchorPos(block, 'right'));
            drawAnchor(ctx, getAnchorPos(block, 'left'));
        }

        return;
    }

    if (block.isSine) {
        // --- RYSOWANIE SINUSOIDY ---
        
        // 1. Osie
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Oś Y (pionowa z lewej)
        ctx.moveTo(block.x, block.y);
        ctx.lineTo(block.x, block.y + block.h);
        // Oś X (pozioma na środku wysokości)
        const midY = block.y + block.h / 2;
        ctx.moveTo(block.x, midY);
        ctx.lineTo(block.x + block.w, midY);
        ctx.stroke();

        // 2. Etykiety
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(block.axisLabelY || 'Y', block.x + 5, block.y); // Label Y
        
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(block.axisLabelX || 'X', block.x + block.w, midY - 5); // Label X

        // 3. Wykres Sinusa
        ctx.beginPath();
        ctx.strokeStyle = '#007bff'; // Niebieski wykres
        ctx.lineWidth = 2;
        
        const amplitude = (block.h / 2) * 0.8; // 80% połowy wysokości
        // Rysujemy 2 pełne okresy (4 PI)
        for (let i = 0; i <= block.w; i++) {
            const angle = (i / block.w) * (Math.PI * 4);
            const val = Math.sin(angle);
            const py = midY - (val * amplitude);
            
            if (i === 0) ctx.moveTo(block.x + i, py);
            else ctx.lineTo(block.x + i, py);
        }
        ctx.stroke();

        if (isSelected) {
            // Ramka edycyjna (tylko przerywana, bez wypełnienia)
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(block.x, block.y, block.w, block.h);
            ctx.setLineDash([]);
            
            // Uchwyty
            drawHandle(ctx, block.x, block.y); // NW
            drawHandle(ctx, block.x + block.w, block.y); // NE
            drawHandle(ctx, block.x + block.w, block.y + block.h); // SE
            drawHandle(ctx, block.x, block.y + block.h); // SW
        }
        return; // Koniec rysowania sinusoidy
    }

    if (block.isText) {
        // Rysuj tekst jako obiekt
        ctx.fillStyle = '#000';
        const fontSize = block.fontSize || 16;
        const fontWeight = block.fontWeight || 'normal';
        const fontStyle = block.fontStyle || 'normal';
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(block.text || '', block.x + block.w/2, block.y + block.h/2);
        
        if (isSelected) {
            // Ramka edycyjna
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(block.x, block.y, block.w, block.h);
            ctx.setLineDash([]);
            
            // Uchwyty
            drawHandle(ctx, block.x, block.y); // NW
            drawHandle(ctx, block.x + block.w, block.y); // NE
            drawHandle(ctx, block.x + block.w, block.y + block.h); // SE
            drawHandle(ctx, block.x, block.y + block.h); // SW
        }
        
        // Tekst NIE ma kotwic (nie łączymy go)
        return;
    }

    ctx.fillStyle = block.color || '#ffffff';
    ctx.strokeStyle = isSelected ? '#007bff' : '#000';
    ctx.lineWidth = isSelected ? 2 : 1;
    
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.strokeRect(block.x, block.y, block.w, block.h);
    
    // Tekst
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Proste łamanie tekstu lub ucięcie
    ctx.fillText(block.text || '', block.x + block.w/2, block.y + block.h/2, block.w - 10);

    if (isSelected) {
        // Uchwyty zmiany rozmiaru (4 rogi) - Tylko gdy wybrany
        drawHandle(ctx, block.x, block.y); // NW
        drawHandle(ctx, block.x + block.w, block.y); // NE
        drawHandle(ctx, block.x + block.w, block.y + block.h); // SE
        drawHandle(ctx, block.x, block.y + block.h); // SW
    }

    // Kotwice - Gdy wybrany LUB gdy trwa łączenie (aby widzieć cele)
    if (isSelected || interactionMode === 'connecting') {
        drawAnchor(ctx, getAnchorPos(block, 'top'));
        drawAnchor(ctx, getAnchorPos(block, 'right'));
        drawAnchor(ctx, getAnchorPos(block, 'bottom'));
        drawAnchor(ctx, getAnchorPos(block, 'left'));
    }
}

function drawHandle(ctx, x, y) {
    ctx.fillStyle = '#007bff';
    ctx.fillRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
}

function drawAnchor(ctx, pos) {
    ctx.fillStyle = '#28a745'; // Zielony dla połączeń
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ANCHOR_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function getAnchorPos(block, side) {
    if (block.isTriangle) {
        // Dla trójkąta mapujemy strony na wierzchołki
        // top -> v1 (Góra)
        // left -> v2 (Lewy Dół)
        // right -> v3 (Prawy Dół)
        const v1 = block.v1 || { x: 100, y: 0 };
        const v2 = block.v2 || { x: 0, y: 173 };
        const v3 = block.v3 || { x: 200, y: 173 };

        switch(side) {
            case 'top': return { x: block.x + v1.x, y: block.y + v1.y };
            case 'left': return { x: block.x + v2.x, y: block.y + v2.y };
            case 'right': return { x: block.x + v3.x, y: block.y + v3.y };
            default: return { x: block.x + v1.x, y: block.y + v1.y };
        }
    }

    switch(side) {
        case 'top': return { x: block.x + block.w/2, y: block.y };
        case 'right': return { x: block.x + block.w, y: block.y + block.h/2 };
        case 'bottom': return { x: block.x + block.w/2, y: block.y + block.h };
        case 'left': return { x: block.x, y: block.y + block.h/2 };
        default: return { x: block.x, y: block.y };
    }
}

// Ustawienia Canvas
function resizeCanvas() {
    const firstLoad = canvas.width === 0 || canvas.height === 0;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (camera.x === 0 && camera.y === 0) {
        // Centrowanie z uwzględnieniem domyślnej skali (na start 1.0)
        // Jeśli ekran jest mały (mobile), dopasuj skalę "fit to width"
        if (canvas.width < PAPER_W) {
            scale = (canvas.width - 40) / PAPER_W; // Margines 20px
        }

        camera.x = (canvas.width - PAPER_W * scale) / 2;
        camera.y = (canvas.height - PAPER_H * scale) / 2;
        
        if (camera.y < 20) camera.y = 20;
    }

    redrawBoard();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- ZOOM (ROLKA MYSZY) ---
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Ukryj kursor pędzla podczas zoomowania
    brushCursor.classList.add('hidden');

    const zoomIntensity = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction * zoomIntensity;
    
    let newScale = scale + factor;
    newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    const mouseWorldX = (e.clientX - camera.x) / scale;
    const mouseWorldY = (e.clientY - camera.y) / scale;

    scale = newScale;

    camera.x = e.clientX - mouseWorldX * scale;
    camera.y = e.clientY - mouseWorldY * scale;

    redrawBoard();
}, { passive: false });


// --- NARZĘDZIA I UI ---

function updatePropertiesPanel() {
    // Reset (ukryj wszystko)
    drawContext.classList.add('hidden');
    blockContext.classList.add('hidden');
    connectionContext.classList.add('hidden');
    textContext.classList.add('hidden'); 
    sineContext.classList.add('hidden'); 
    timerContext.classList.add('hidden'); 
    triangleContext.classList.add('hidden'); 
    diceContext.classList.add('hidden'); // NOWE
    checklistContext.classList.add('hidden'); // NOWE
    vennContext.classList.add('hidden'); // NOWE
    matrixContext.classList.add('hidden'); // NOWE

    let anyVisible = false;

    if (currentTool === 'draw') {
        drawContext.classList.remove('hidden');
        anyVisible = true;
    } 
    else if (currentTool === 'select') {
        if (selectedElement) {
            if (selectedElement.type === 'block') {
                const block = localData.blocks[selectedElement.id];
                
                if (block && block.isTriangle) {
                    // --- KONTEKST TRÓJKĄTA ---
                    triangleContext.classList.remove('hidden');
                    anyVisible = true;
                    
                    triLabel1.value = block.labels[0] || "Szybko";
                    triLabel2.value = block.labels[1] || "Tanio";
                    triLabel3.value = block.labels[2] || "Jakość";

                } else if (block && block.isTimer) {
                    // --- KONTEKST TIMERA ---
                    timerContext.classList.remove('hidden');
                    anyVisible = true;
                    timerDuration.value = block.duration || 5;
                    
                    // Zmiana przycisku Start/Stop
                    btnTimerStart.textContent = block.isRunning ? '⏹ Stop' : '▶ Start';
                    btnTimerStart.className = block.isRunning ? 'danger-btn' : 'active-btn';

                } else if (block && block.isDice) {
                    // --- KONTEKST KOSTKI ---
                    diceContext.classList.remove('hidden');
                    anyVisible = true;
                    diceMin.value = block.minVal || 1;
                    diceMax.value = block.maxVal || 6;

                } else if (block && block.isChecklist) {
                    // --- KONTEKST CHECKLISTY ---
                    checklistContext.classList.remove('hidden');
                    anyVisible = true;

                } else if (block && block.isVenn) {
                    // --- KONTEKST VENNA ---
                    vennContext.classList.remove('hidden');
                    anyVisible = true;
                    vennLabel1.value = block.circles && block.circles[0] ? block.circles[0].label : "";
                    vennLabel2.value = block.circles && block.circles[1] ? block.circles[1].label : "";
                    vennLabel3.value = block.circles && block.circles[2] ? block.circles[2].label : "";

                } else if (block && block.isMatrix) {
                    // --- KONTEKST MACIERZY ---
                    matrixContext.classList.remove('hidden');
                    anyVisible = true;
                    matrixLabel1.value = block.labels[0] || "";
                    matrixLabel2.value = block.labels[1] || "";
                    matrixLabel3.value = block.labels[2] || "";
                    matrixLabel4.value = block.labels[3] || "";

                } else if (block && block.isSine) {
                    // --- KONTEKST SINUSOIDY ---
                    sineContext.classList.remove('hidden');
                    anyVisible = true;
                    
                    // Wypełnij inputy
                    sineLabelX.value = block.axisLabelX || "X";
                    sineLabelY.value = block.axisLabelY || "Y";
                    
                } else if (block && block.isText) {
                    // --- KONTEKST TEKSTU ---
                    blockContext.classList.remove('hidden');
                    anyVisible = true;
                    // DLA TEKSTU: Tylko Usuń Obiekt
                    btnDeleteConnections.classList.add('hidden');
                } else {
                    // --- ZWYKŁY BLOK ---
                    blockContext.classList.remove('hidden');
                    anyVisible = true;
                    btnDeleteConnections.classList.remove('hidden');
                }
            } else if (selectedElement.type === 'connection') {
                connectionContext.classList.remove('hidden');
                anyVisible = true;
            }
        }
    }

    // Ukryj główny panel jeśli nic nie pokazujemy
    if (anyVisible) {
        propertiesPanel.classList.remove('hidden');
    } else {
        propertiesPanel.classList.add('hidden');
    }
}

// Zamykanie panelu obiektów przy kliknięciu poza niego
document.addEventListener('click', (e) => {
    if (!objectsPanel.classList.contains('hidden')) {
        // Jeśli kliknięcie nie było wewnątrz panelu ani na przycisku otwierającym
        if (!objectsPanel.contains(e.target) && e.target !== btnObjects) {
            objectsPanel.classList.add('hidden');
        }
    }
});

btnObjects.addEventListener('click', (e) => {
    e.stopPropagation(); 
    objectsPanel.classList.toggle('hidden');
    if (!objectsPanel.classList.contains('hidden')) {
        currentTool = 'select';
        canvas.style.cursor = 'default';
        updateActiveButton(btnSelect);
    }
});

// ... (rest of the code remains the same)

btnAddSine.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 100,
        y: centerY - 50,
        w: 200,
        h: 100,
        text: "", 
        color: "transparent",
        isSine: true,
        axisLabelX: "X",
        axisLabelY: "Y"
    });
    objectsPanel.classList.add('hidden');
});

btnAddTriangle.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    // Trójkąt równoboczny (bok ~200)
    const h = 200 * (Math.sqrt(3)/2); 
    
    push(ref(db, 'blocks'), {
        x: centerX - 100,
        y: centerY - 100,
        w: 200, // Bounding box (orientacyjny)
        h: h,
        text: "", 
        color: "transparent",
        isTriangle: true,
        // Wierzchołki relatywne do (x, y)
        v1: { x: 100, y: 0 },        // Góra (Czas)
        v2: { x: 0, y: h },          // Lewy Dół (Cena)
        v3: { x: 200, y: h },        // Prawy Dół (Jakość)
        // Punkt równowagi (Centroid)
        point: { x: 100, y: h * 0.66 }, 
        labels: ["Czas", "Cena", "Jakość"]
    });
    objectsPanel.classList.add('hidden');
});

btnAddDice.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 40,
        y: centerY - 40,
        w: 80,
        h: 80,
        isDice: true,
        value: 6,
        minVal: 1,
        maxVal: 6
    });
    objectsPanel.classList.add('hidden');
});

btnAddTimer.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 60,
        y: centerY - 30,
        w: 120,
        h: 60,
        isTimer: true,
        duration: 5,
        endTime: null,
        isRunning: false
    });
    objectsPanel.classList.add('hidden');
});

btnAddChecklist.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 75,
        y: centerY - 100,
        w: 150,
        h: 200,
        isChecklist: true,
        title: "Lista Zadań",
        items: [
            { text: "Zadanie 1", checked: false }
        ]
    });
    objectsPanel.classList.add('hidden');
});

btnAddVenn.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 100,
        y: centerY - 100,
        w: 200, 
        h: 200,
        isVenn: true,
        circles: [
            { label: "A", color: "rgba(255, 0, 0, 0.3)" },
            { label: "B", color: "rgba(0, 0, 255, 0.3)" },
            { label: "C", color: "rgba(0, 255, 0, 0.3)" }
        ]
    });
    objectsPanel.classList.add('hidden');
});

btnAddMatrix.addEventListener('click', () => {
    const centerX = (canvas.width / 2 - camera.x) / scale;
    const centerY = (canvas.height / 2 - camera.y) / scale;
    
    push(ref(db, 'blocks'), {
        x: centerX - 200,
        y: centerY - 200,
        w: 400,
        h: 400,
        isMatrix: true,
        labels: ["Ważne", "Nieważne", "Pilne", "Niepilne"]
    });
    objectsPanel.classList.add('hidden');
});

btnAddText.addEventListener('click', () => {
    // Tryb wstawiania tekstu - kliknij by dodać
    currentTool = 'insert_text';
    canvas.style.cursor = 'text';
    objectsPanel.classList.add('hidden');
    updatePropertiesPanel();
    
    // Odznacz przyciski toolbara
    document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
});

// Narzędzia Toolbar
btnSelect.addEventListener('click', () => {
    currentTool = 'select';
    canvas.style.cursor = 'default';
    updateActiveButton(btnSelect);
    objectsPanel.classList.add('hidden');
});

// btnPan listener removed

btnDraw.addEventListener('click', () => {
    currentTool = 'draw';
    canvas.style.cursor = 'none'; // Ukryj systemowy kursor
    brushCursor.classList.remove('hidden');
    updateActiveButton(btnDraw);
    objectsPanel.classList.add('hidden');
});

btnLine.addEventListener('click', () => {
    isLineMode = !isLineMode;
    
    if (isLineMode) {
        // Wyłącz gumkę
        isEraser = false;
        btnEraser.classList.remove('active');
        brushCursor.style.borderColor = '#777';

        btnLine.classList.add('active');
    } else {
        btnLine.classList.remove('active');
    }
    currentTool = 'draw';
    canvas.style.cursor = 'none';
    brushCursor.classList.remove('hidden');
    updateActiveButton(btnDraw);
});

btnEraser.addEventListener('click', () => {
    isEraser = !isEraser;
    
    if (isEraser) {
        // Wyłącz linię
        isLineMode = false;
        btnLine.classList.remove('active');

        btnEraser.classList.add('active');
        brushCursor.style.borderColor = '#ff0000';
    } else {
        btnEraser.classList.remove('active');
        brushCursor.style.borderColor = '#777';
    }
    // Upewnij się że jesteśmy w trybie draw
    currentTool = 'draw';
    canvas.style.cursor = 'none';
    brushCursor.classList.remove('hidden');
    updateActiveButton(btnDraw);
});


btnClear.addEventListener('click', () => {
    if(confirm("Czy na pewno chcesz wyczyścić całą tablicę?")) {
        remove(ref(db, 'strokes'));
        remove(ref(db, 'notes'));
        remove(ref(db, 'blocks'));
        remove(ref(db, 'connections'));
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redrawBoard();
    }
});

// Logika Usuwania (Kontekstowa)
btnDeleteObject.addEventListener('click', deleteSelectedBlock);
btnDeleteConnections.addEventListener('click', () => deleteBlockConnections(true));
btnDeleteConn.addEventListener('click', deleteSelectedConnection);
btnDeleteSine.addEventListener('click', deleteSelectedBlock);

// Listenery Sinusoidy
sineLabelX.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/axisLabelX`), e.target.value);
    }
});

sineLabelY.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/axisLabelY`), e.target.value);
    }
});

// Listenery Trójkąta
btnDeleteTriangle.addEventListener('click', deleteSelectedBlock);
btnDeleteTriangleConnections.addEventListener('click', () => deleteBlockConnections(true));

// Listenery Timera
btnDeleteTimer.addEventListener('click', deleteSelectedBlock);

// Listenery Kostki
btnDeleteDice.addEventListener('click', deleteSelectedBlock);
diceMin.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/minVal`), parseInt(e.target.value) || 1);
});
diceMax.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/maxVal`), parseInt(e.target.value) || 6);
});

// Listenery Checklisty
btnDeleteChecklist.addEventListener('click', deleteSelectedBlock);
btnAddChecklistItem.addEventListener('click', () => {
    if (selectedElement && selectedElement.type === 'block') {
        const text = checklistNewItem.value || "Nowe zadanie";
        const block = localData.blocks[selectedElement.id];
        if (block) {
            const items = block.items || [];
            items.push({ text: text, checked: false });
            set(ref(db, `blocks/${selectedElement.id}/items`), items);
            checklistNewItem.value = "";
        }
    }
});

// Listenery Venna
btnDeleteVenn.addEventListener('click', deleteSelectedBlock);
vennLabel1.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/circles/0/label`), e.target.value);
});
vennLabel2.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/circles/1/label`), e.target.value);
});
vennLabel3.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/circles/2/label`), e.target.value);
});

// Listenery Macierzy
btnDeleteMatrix.addEventListener('click', deleteSelectedBlock);
matrixLabel1.addEventListener('input', (e) => { if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/labels/0`), e.target.value); });
matrixLabel2.addEventListener('input', (e) => { if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/labels/1`), e.target.value); });
matrixLabel3.addEventListener('input', (e) => { if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/labels/2`), e.target.value); });
matrixLabel4.addEventListener('input', (e) => { if (selectedElement && selectedElement.type === 'block') set(ref(db, `blocks/${selectedElement.id}/labels/3`), e.target.value); });


timerDuration.addEventListener('change', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         const val = parseInt(e.target.value) || 5;
         set(ref(db, `blocks/${selectedElement.id}/duration`), val);
    }
});

btnTimerStart.addEventListener('click', () => {
    if (selectedElement && selectedElement.type === 'block') {
        const block = localData.blocks[selectedElement.id];
        if (!block) return;

        if (block.isRunning) {
            // STOP
            set(ref(db, `blocks/${selectedElement.id}/isRunning`), false);
            set(ref(db, `blocks/${selectedElement.id}/endTime`), null);
        } else {
            // START
            const durationMs = (block.duration || 5) * 60 * 1000;
            const endTime = Date.now() + durationMs;
            set(ref(db, `blocks/${selectedElement.id}/isRunning`), true);
            set(ref(db, `blocks/${selectedElement.id}/endTime`), endTime);
        }
        updatePropertiesPanel(); // Odśwież przycisk
    }
});

btnTimerReset.addEventListener('click', () => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/isRunning`), false);
         set(ref(db, `blocks/${selectedElement.id}/endTime`), null);
         updatePropertiesPanel();
    }
});

triLabel1.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/labels/0`), e.target.value);
    }
});
triLabel2.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/labels/1`), e.target.value);
    }
});
triLabel3.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
         set(ref(db, `blocks/${selectedElement.id}/labels/2`), e.target.value);
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') { // Tylko Delete kasuje
        // Sprawdź czy nie edytujemy tekstu (overlay musi być ukryty)
        if (textEditorOverlay.classList.contains('hidden') && selectedElement) {
             if (selectedElement.type === 'block') {
                 deleteSelectedBlock();
             } else if (selectedElement.type === 'connection') {
                 deleteSelectedConnection();
             }
        }
    }
});

function deleteSelectedBlock() {
    if (!selectedElement || selectedElement.type !== 'block') return;
    if(confirm("Usunąć blok?")) {
        // Usuń połączenia
        deleteBlockConnections(false); // false = bez potwierdzenia
        remove(ref(db, `blocks/${selectedElement.id}`));
        selectedElement = null;
        redrawBoard();
        updatePropertiesPanel();
    }
}

function deleteBlockConnections(askConfirm = true) {
    if (!selectedElement || selectedElement.type !== 'block') return;
    if(askConfirm && !confirm("Usunąć wszystkie połączenia tego bloku?")) return;

    Object.entries(localData.connections).forEach(([cid, conn]) => {
        if (conn.fromBlock === selectedElement.id || conn.toBlock === selectedElement.id) {
            remove(ref(db, `connections/${cid}`));
        }
    });
    redrawBoard();
}

function deleteSelectedConnection() {
    if (!selectedElement || selectedElement.type !== 'connection') return;
    if(confirm("Usunąć połączenie?")) {
        remove(ref(db, `connections/${selectedElement.id}`));
        selectedElement = null;
        redrawBoard();
        updatePropertiesPanel();
    }
}

function updateActiveButton(activeBtn) {
    document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
    updatePropertiesPanel();
}

// Hit Test Logic
function hitTest(x, y) {
    // Sprawdzamy w odwrotnej kolejności rysowania (góra -> dół)
    
    // 1. Uchwyty (Tylko dla wybranego elementu - zmiana rozmiaru)
    if (selectedElement && selectedElement.type === 'block') {
        const block = localData.blocks[selectedElement.id];
        if (block) {
            const margin = HANDLE_SIZE * 1.5;
            // Odsunięcie uchwytów dla trójkąta
            const pad = block.isTriangle ? 20 : 0;

            if (dist(x, y, block.x - pad, block.y - pad) < margin) return { type: 'handle', id: selectedElement.id, dir: 'nw' };
            if (dist(x, y, block.x + block.w + pad, block.y - pad) < margin) return { type: 'handle', id: selectedElement.id, dir: 'ne' };
            if (dist(x, y, block.x + block.w + pad, block.y + block.h + pad) < margin) return { type: 'handle', id: selectedElement.id, dir: 'se' };
            if (dist(x, y, block.x - pad, block.y + block.h + pad) < margin) return { type: 'handle', id: selectedElement.id, dir: 'sw' };
        }
    }

    // 1.5. Wierzchołki i Punkt Trójkąta (Priorytet nad blokiem)
    for (const [id, block] of Object.entries(localData.blocks).reverse()) {
        if (block.isChecklist) {
            const items = block.items || [];
            const itemH = 30;
            let currY = block.y + 40;
            
            for(let i=0; i<items.length; i++) {
                // Checkbox (x + 15, y + 7, 14x14) - większy margines
                if (dist(x, y, block.x + 15 + 7, currY + 7) < 15) return { type: 'chk_box', id: id, index: i };
                
                // Delete (x + w - 20) - tylko gdy wybrany
                if (selectedElement && selectedElement.id === id) {
                     if (dist(x, y, block.x + block.w - 20 + 7, currY + 7) < 15) return { type: 'chk_del', id: id, index: i };
                }

                // Text Edit (obszar tekstu)
                if (x > block.x + 30 && x < block.x + block.w - 30 && y > currY && y < currY + itemH) {
                     return { type: 'chk_text', id: id, index: i };
                }

                currY += itemH;
            }
        }

        if (block.isTriangle) {
            const bx = block.x;
            const by = block.y;
            const v1 = block.v1 || {x:0,y:0};
            const v2 = block.v2 || {x:0,y:0};
            const v3 = block.v3 || {x:0,y:0};
            const pt = block.point || {x:0,y:0};
            
            const margin = 15; // Duża strefa kliknięcia

            // Punkt równowagi
            if (dist(bx + pt.x, by + pt.y, x, y) < margin) {
                return { type: 'tri_point', id: id };
            }
            
            // Wierzchołki jako KOTWICE (Anchors)
            // v1 (Góra) -> top
            if (dist(bx + v1.x, by + v1.y, x, y) < margin) return { type: 'anchor', blockId: id, side: 'top' };
            // v2 (Lewy) -> left
            if (dist(bx + v2.x, by + v2.y, x, y) < margin) return { type: 'anchor', blockId: id, side: 'left' };
            // v3 (Prawy) -> right
            if (dist(bx + v3.x, by + v3.y, x, y) < margin) return { type: 'anchor', blockId: id, side: 'right' };
            
            // Sprawdzenie czy wewnątrz trójkąta (Barycentric technique approximation or Polygon check)
            // Prostsze: Sprawdźmy czy punkt jest po właściwej stronie każdej z linii
            if (isPointInTriangle({x: x, y: y}, 
                                  {x: bx+v1.x, y: by+v1.y}, 
                                  {x: bx+v2.x, y: by+v2.y}, 
                                  {x: bx+v3.x, y: by+v3.y})) {
                 return { type: 'block', id: id };
            }
        }
    }

    // 2. Kotwice (Dla WSZYSTKICH bloków)
    for (const [id, block] of Object.entries(localData.blocks).reverse()) {
        if (block.isText) continue; // Ignoruj tekst - brak kotwic
        
        const anchorMargin = ANCHOR_SIZE * 2.5;
        
        // Punkty łączeń dla wszystkich bloków (w tym trójkąta)
        if (dist(x, y, block.x + block.w/2, block.y) < anchorMargin) return { type: 'anchor', blockId: id, side: 'top' };
        if (dist(x, y, block.x + block.w, block.y + block.h/2) < anchorMargin) return { type: 'anchor', blockId: id, side: 'right' };
        if (dist(x, y, block.x + block.w/2, block.y + block.h) < anchorMargin) return { type: 'anchor', blockId: id, side: 'bottom' };
        if (dist(x, y, block.x, block.y + block.h/2) < anchorMargin) return { type: 'anchor', blockId: id, side: 'left' };
    }

    // 1.5. Wierzchołki i Punkt Trójkąta (Priorytet nad blokiem)
    function isPointInTriangle(p, a, b, c) {
        const as_x = p.x - a.x;
        const as_y = p.y - a.y;
        const s_ab = (b.x - a.x) * as_y - (b.y - a.y) * as_x > 0;
        if ((c.x - a.x) * as_y - (c.y - a.y) * as_x > 0 == s_ab) return false;
        if ((c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x) > 0 != s_ab) return false;
        return true;
    }

    // 3. Bloki
    for (const [id, block] of Object.entries(localData.blocks).reverse()) {
        if (x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h) {
            return { type: 'block', id: id };
        }
    }

    // 4. Połączenia (Connections)
    for (const [id, conn] of Object.entries(localData.connections)) {
        const b1 = localData.blocks[conn.fromBlock];
        const b2 = localData.blocks[conn.toBlock];
        if (!b1 || !b2) continue;

        const start = getAnchorPos(b1, conn.fromSide);
        const end = getAnchorPos(b2, conn.toSide);
        
        if (distToSegment({x,y}, start, end) < 10) {
            return { type: 'connection', id: id };
        }
    }

    return null;
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

function distToSegment(p, v, w) {
    const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
    if (l2 === 0) return dist(p.x, p.y, v.x, v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
}

// --- RYSOWANIE I KAMERA ---

function drawLine(start, end, color, width) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function getPos(e) {
    // Zwraca współrzędne ŚWIATA (uwzględniając kamerę i skalę)
    return {
        x: (e.clientX - camera.x) / scale,
        y: (e.clientY - camera.y) / scale
    };
}

// Cache dla pointerów (do obsługi multi-touch)
let evCache = [];
let prevDiff = -1;

function remove_event(ev) {
    for (let i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == ev.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}

// --- OBSŁUGA PŁYWAJĄCEGO EDYTORA TEKSTU ---

function openTextEditor(blockId) {
    editingBlockId = blockId;
    const block = localData.blocks[blockId];
    if (!block) return;

    // Wypełnij danymi
    editTextInput.value = block.text || '';
    editSizeInput.value = block.fontSize || 16;
    
    if (block.fontWeight === 'bold') btnBold.classList.add('active');
    else btnBold.classList.remove('active');
    
    if (block.fontStyle === 'italic') btnItalic.classList.add('active');
    else btnItalic.classList.remove('active');

    // Pozycja
    const screenX = (block.x * scale) + camera.x;
    const screenY = (block.y * scale) + camera.y;
    
    textEditorOverlay.style.left = Math.max(10, screenX) + 'px';
    textEditorOverlay.style.top = (screenY + (block.h * scale) + 10) + 'px'; 
    
    textEditorOverlay.classList.remove('hidden');
    editTextInput.focus();
    editTextInput.select(); // Zaznacz wszystko dla szybkiej edycji
}

function closeTextEditor() {
    textEditorOverlay.classList.add('hidden');
    editingBlockId = null;
}

editTextInput.addEventListener('input', (e) => {
    if (editingBlockId) {
        set(ref(db, `blocks/${editingBlockId}/text`), e.target.value);
    }
});

editSizeInput.addEventListener('input', (e) => {
    if (editingBlockId) {
        const val = parseInt(e.target.value) || 16;
        set(ref(db, `blocks/${editingBlockId}/fontSize`), val);
    }
});

btnBold.addEventListener('click', () => {
    if (editingBlockId) {
        const block = localData.blocks[editingBlockId];
        const newVal = block.fontWeight === 'bold' ? 'normal' : 'bold';
        set(ref(db, `blocks/${editingBlockId}/fontWeight`), newVal);
        btnBold.classList.toggle('active');
    }
});

btnItalic.addEventListener('click', () => {
    if (editingBlockId) {
        const block = localData.blocks[editingBlockId];
        const newVal = block.fontStyle === 'italic' ? 'normal' : 'italic';
        set(ref(db, `blocks/${editingBlockId}/fontStyle`), newVal);
        btnItalic.classList.toggle('active');
    }
});

// btnCloseEditor listener removed


// --- EVENT LISTENERS ---

canvas.addEventListener('dblclick', (e) => {
    if (currentTool === 'select') {
        const { x, y } = getPos(e);
        const hit = hitTest(x, y);
        if (hit && hit.type === 'block') {
            const block = localData.blocks[hit.id];
            if (block.isText) {
                openTextEditor(hit.id);
            } else {
                const newText = prompt("Wpisz tekst:", block.text);
                if (newText !== null) {
                    set(ref(db, `blocks/${hit.id}/text`), newText);
                }
            }
        }
    }
});

canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    evCache.push(e);

    if (evCache.length === 2) {
        prevDiff = Math.hypot(evCache[0].clientX - evCache[1].clientX, evCache[0].clientY - evCache[1].clientY);
    }

    if (evCache.length > 1) {
        isPanning = false;
        isDrawing = false;
        interactionMode = 'idle';
        return;
    }
    
    // --- LOGIKA SELECT TOOL ---
    if (currentTool === 'select') {
        const { x, y } = getPos(e);
        const hit = hitTest(x, y);

        if (hit) {
            isPanning = false;
            if (hit.type === 'handle') {
                // Skalowanie
                interactionMode = 'resizing';
                dragStart = { x, y };
                // Głęboka kopia dla trójkąta
                initialBlockState = JSON.parse(JSON.stringify(localData.blocks[hit.id]));
                activeAnchor = hit.dir; // Używamy activeAnchor do przechowywania kierunku resize (nw, ne, ...)
            } else if (hit.type === 'anchor') {
                // Łączenie
                interactionMode = 'connecting';
                activeAnchor = hit; // { blockId, side }
                const startPos = getAnchorPos(localData.blocks[hit.blockId], hit.side);
                tempConnection = { start: startPos, end: { x, y } };
            } else if (hit.type === 'chk_box') {
                const block = localData.blocks[hit.id];
                const items = block.items || [];
                if (items[hit.index]) {
                    items[hit.index].checked = !items[hit.index].checked;
                    set(ref(db, `blocks/${hit.id}/items`), items);
                }
            } else if (hit.type === 'chk_del') {
                // FIX: Wyczyść cache pointerów przed blocking confirm, aby uniknąć "stuck pointer"
                evCache = [];
                if(confirm("Usunąć ten wpis?")) {
                    const block = localData.blocks[hit.id];
                    const items = block.items || [];
                    items.splice(hit.index, 1);
                    set(ref(db, `blocks/${hit.id}/items`), items);
                }
            } else if (hit.type === 'chk_text') {
                // FIX: Wyczyść cache przed prompt
                evCache = [];
                // Edycja tekstu elementu listy
                const block = localData.blocks[hit.id];
                const oldText = block.items[hit.index].text;
                const newText = prompt("Edytuj zadanie:", oldText);
                if (newText !== null) {
                    const items = block.items;
                    items[hit.index].text = newText;
                    set(ref(db, `blocks/${hit.id}/items`), items);
                }
            } else if (hit.type === 'tri_point') {
                interactionMode = 'tri_point_drag';
                selectedElement = { type: 'block', id: hit.id };
            } else if (hit.type === 'tri_vertex') {
                interactionMode = 'tri_vertex_drag';
                selectedElement = { type: 'block', id: hit.id };
                activeAnchor = hit.index; // 1, 2 or 3
            } else if (hit.type === 'block') {
                // Przesuwanie / Wybieranie
                selectedElement = hit;
                interactionMode = 'moving';
                dragStart = { x, y };
                // Głęboka kopia dla trójkąta, żeby skalowanie nie psuło referencji
                initialBlockState = JSON.parse(JSON.stringify(localData.blocks[hit.id]));

                // AUTO-OPEN EDITOR FOR TEXT
                if (block && block.isText) {
                     openTextEditor(hit.id);
                } else {
                     closeTextEditor();
                }
            }
        } else {
            // Odznaczanie i Smart Pan (gdy klikniemy w tło)
            selectedElement = null;
            interactionMode = 'idle';
            closeTextEditor();
            
            // Start Panning
            isPanning = true;
            startPanPoint = { x: e.clientX, y: e.clientY }; 
            canvas.style.cursor = 'grabbing';
        }
        redrawBoard();
        updatePropertiesPanel();
        return;
    }

    // --- LOGIKA DRAW ---
    if (currentTool === 'draw') {
        const { x, y } = getPos(e);
        
        if (x < 0 || x > PAPER_W || y < 0 || y > PAPER_H) return;

        isDrawing = true;
        lastPoint = { x, y };
        strokeOrigin = { x, y }; // Punkt startowy dla linii
        
        const newStrokeRef = push(ref(db, 'strokes'));
        currentStrokeId = newStrokeRef.key;
        
        const strokeData = {
            color: isEraser ? '#ffffff' : colorPicker.value, // Biały kolor dla gumki
            width: sizePicker.value,
            timestamp: Date.now()
        };
        set(newStrokeRef, strokeData);

        localData.strokes[currentStrokeId] = {
            color: strokeData.color,
            width: strokeData.width,
            points: [{x, y}]
        };

        if (!isLineMode) {
            pendingPoints.push({ x, y });
        }
    }
});

canvas.addEventListener('pointermove', (e) => {
    // 0. CURSOR UPDATE
    if (currentTool === 'draw') {
        // Skaluj kursor razem z widokiem
        const visualSize = sizePicker.value * scale;
        
        brushCursor.style.width = visualSize + 'px';
        brushCursor.style.height = visualSize + 'px';
        brushCursor.style.left = e.clientX + 'px';
        brushCursor.style.top = e.clientY + 'px';
        
        // Pokaż tylko jeśli nie ma gestu pinch (sprawdzamy niżej evCache)
        if (evCache.length < 2) {
            brushCursor.classList.remove('hidden');
        }
    } else {
        brushCursor.classList.add('hidden');
        if(currentTool === 'select') canvas.style.cursor = isPanning ? 'grabbing' : 'default';
    }

    // Aktualizuj cache
    for (let i = 0; i < evCache.length; i++) {
        if (e.pointerId == evCache[i].pointerId) {
            evCache[i] = e;
            break;
        }
    }

    // 1. PINCH ZOOM (2 palce)
    if (evCache.length === 2) {
        brushCursor.classList.add('hidden'); // Ukryj kursor przy pinch zoom
        const curDiff = Math.hypot(evCache[0].clientX - evCache[1].clientX, evCache[0].clientY - evCache[1].clientY);

        if (prevDiff > 0) {
            const midX = (evCache[0].clientX + evCache[1].clientX) / 2;
            const midY = (evCache[0].clientY + evCache[1].clientY) / 2;
            const mouseWorldX = (midX - camera.x) / scale;
            const mouseWorldY = (midY - camera.y) / scale;

            const diffChange = curDiff - prevDiff;
            const zoomFactor = diffChange * 0.005;
            
            let newScale = scale + zoomFactor;
            newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

            scale = newScale;
            camera.x = midX - mouseWorldX * scale;
            camera.y = midY - mouseWorldY * scale;

            redrawBoard();
        }
        prevDiff = curDiff;
        return;
    }

    const { x, y } = getPos(e);

    // 2. SELECT TOOL INTERACTION
    if (currentTool === 'select') {
        if (interactionMode === 'moving' && selectedElement) {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            
            const newBlock = {
                ...localData.blocks[selectedElement.id],
                x: initialBlockState.x + dx,
                y: initialBlockState.y + dy
            };
            
            localData.blocks[selectedElement.id] = newBlock;

            // Update edytora przy przesuwaniu
            if (editingBlockId === selectedElement.id) {
                 const screenX = (newBlock.x * scale) + camera.x;
                 const screenY = (newBlock.y * scale) + camera.y;
                 textEditorOverlay.style.left = Math.max(10, screenX) + 'px';
                 textEditorOverlay.style.top = (screenY + (newBlock.h * scale) + 10) + 'px'; 
            }

            redrawBoard();
        } 
        else if (interactionMode === 'resizing' && selectedElement) {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            const block = localData.blocks[selectedElement.id];
            const dir = activeAnchor; // 'nw', 'se', etc.
            
            let newX = initialBlockState.x;
            let newY = initialBlockState.y;
            let newW = initialBlockState.w;
            let newH = initialBlockState.h;

            if (dir.includes('e')) newW = Math.max(BLOCK_MIN_SIZE, initialBlockState.w + dx);
            if (dir.includes('s')) newH = Math.max(BLOCK_MIN_SIZE, initialBlockState.h + dy);
            if (dir.includes('w')) {
                const maxDX = initialBlockState.w - BLOCK_MIN_SIZE;
                const actualDX = Math.min(dx, maxDX);
                newX = initialBlockState.x + actualDX;
                newW = initialBlockState.w - actualDX;
            }
            if (dir.includes('n')) {
                const maxDY = initialBlockState.h - BLOCK_MIN_SIZE;
                const actualDY = Math.min(dy, maxDY);
                newY = initialBlockState.y + actualDY;
                newH = initialBlockState.h - actualDY;
            }

            block.x = newX;
            block.y = newY;
            block.w = newW;
            block.h = newH;

            // Skalowanie wierzchołków trójkąta jeśli to trójkąt
            if (block.isTriangle && initialBlockState.isTriangle) {
                const scaleX = newW / initialBlockState.w;
                const scaleY = newH / initialBlockState.h;
                
                block.v1 = { x: initialBlockState.v1.x * scaleX, y: initialBlockState.v1.y * scaleY };
                block.v2 = { x: initialBlockState.v2.x * scaleX, y: initialBlockState.v2.y * scaleY };
                block.v3 = { x: initialBlockState.v3.x * scaleX, y: initialBlockState.v3.y * scaleY };
                block.point = { x: initialBlockState.point.x * scaleX, y: initialBlockState.point.y * scaleY };
            }

            redrawBoard();
        }
        else if (interactionMode === 'connecting' && tempConnection) {
            tempConnection.end = { x, y };
            redrawBoard();
        }
        else if (interactionMode === 'tri_point_drag' && selectedElement) {
             const block = localData.blocks[selectedElement.id];
             // Punkt relatywny do (x, y)
             const newPt = { x: x - block.x, y: y - block.y };
             block.point = newPt;
             redrawBoard();
        }
        else if (interactionMode === 'tri_vertex_drag' && selectedElement) {
             const block = localData.blocks[selectedElement.id];
             const newV = { x: x - block.x, y: y - block.y };
             
             if (activeAnchor === 1) block.v1 = newV;
             else if (activeAnchor === 2) block.v2 = newV;
             else if (activeAnchor === 3) block.v3 = newV;
             
             redrawBoard();
        }
    }

    // 3. PAN (1 palec)
    if (isPanning && evCache.length === 1) {
        const dx = e.clientX - startPanPoint.x;
        const dy = e.clientY - startPanPoint.y;
        
        let newX = camera.x + dx;
        let newY = camera.y + dy;

        const scaledW = PAPER_W * scale;
        const scaledH = PAPER_H * scale;
        const limitX = canvas.width - 50;
        const limitY = canvas.height - 50;
        const minX = -scaledW + 50;
        const minY = -scaledH + 50;

        camera.x = Math.min(limitX, Math.max(minX, newX));
        camera.y = Math.min(limitY, Math.max(minY, newY));
        
        startPanPoint = { x: e.clientX, y: e.clientY };
        redrawBoard();
        return;
    }

    // 4. DRAW (1 palec)
    if (isDrawing && currentTool === 'draw' && evCache.length === 1) {
        const newPoint = getPos(e);
        
        if (isLineMode) {
            // W trybie linii: dynamiczny podgląd od Startu do Obecnej pozycji
            if (localData.strokes[currentStrokeId]) {
                localData.strokes[currentStrokeId].points = [strokeOrigin, newPoint];
            }
            redrawBoard(); // Przerysuj całość
            lastPoint = newPoint; 
        } else {
            // Tryb swobodny (Freehand)
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(camera.x, camera.y);
            ctx.scale(scale, scale);
            
            ctx.beginPath();
            ctx.rect(0, 0, PAPER_W, PAPER_H);
            ctx.clip();
            
            drawLine(lastPoint, newPoint, isEraser ? '#ffffff' : colorPicker.value, sizePicker.value);
            
            ctx.restore();
            
            if (localData.strokes[currentStrokeId]) {
                localData.strokes[currentStrokeId].points.push(newPoint);
            }
            
            lastPoint = newPoint;
            pendingPoints.push(newPoint);
        }
    }
});

canvas.addEventListener('pointerup', (e) => {
    canvas.releasePointerCapture(e.pointerId);
    remove_event(e);

    // Mobile Fix: Ukryj kursor po oderwaniu palca
    brushCursor.classList.add('hidden');

    if (evCache.length < 2) prevDiff = -1;
    
    // SELECT END
    if (currentTool === 'select') {
        if (interactionMode === 'moving' && selectedElement) {
            // Zapisz nową pozycję do Firebase
            const block = localData.blocks[selectedElement.id];
            set(ref(db, `blocks/${selectedElement.id}`), block);
        }
        else if (interactionMode === 'resizing' && selectedElement) {
            // Zapisz nowy rozmiar
            const block = localData.blocks[selectedElement.id];
            set(ref(db, `blocks/${selectedElement.id}`), block);
        }
        else if ((interactionMode === 'tri_point_drag' || interactionMode === 'tri_vertex_drag') && selectedElement) {
             // Zapisz zmiany wierzchołków/punktu
             const block = localData.blocks[selectedElement.id];
             set(ref(db, `blocks/${selectedElement.id}`), block);
        }
        else if (interactionMode === 'connecting' && tempConnection) {
            const { x, y } = getPos(e);
            const hit = hitTest(x, y);
            if (hit && hit.type === 'anchor' && hit.blockId !== activeAnchor.blockId) {
                // Utwórz połączenie
                push(ref(db, 'connections'), {
                    fromBlock: activeAnchor.blockId,
                    fromSide: activeAnchor.side,
                    toBlock: hit.blockId,
                    toSide: hit.side
                });

                // Reset po sukcesie
                selectedElement = null;
                currentTool = 'select';
                canvas.style.cursor = 'default';
                updateActiveButton(btnSelect);
            }
        }
        
        interactionMode = 'idle';
        activeAnchor = null;
        tempConnection = null;
        redrawBoard();
        updatePropertiesPanel();
    }

    if (isPanning) {
        isPanning = false;
        if (currentTool === 'select') canvas.style.cursor = 'default';
    }

    if (isDrawing) {
        if (isLineMode) {
            // W trybie linii wysyłamy DWA punkty: start i koniec
            const pointsRef = ref(db, `strokes/${currentStrokeId}/packets`);
            push(pointsRef, [strokeOrigin, lastPoint]);
        } else {
            sendBatch();
        }
        isDrawing = false;
        currentStrokeId = null;
        pendingPoints = [];
    }
});

// --- BATCHING / THROTTLING (Co 50ms) ---

setInterval(() => {
    if (isDrawing && pendingPoints.length > 0 && currentStrokeId) {
        sendBatch();
    }
}, 50);

function sendBatch() {
    if (pendingPoints.length === 0) return;

    const pointsRef = ref(db, `strokes/${currentStrokeId}/packets`);
    push(pointsRef, pendingPoints);
    
    pendingPoints = [];
}

// --- TEXT TOOL & EDITING ---

canvas.addEventListener('click', (e) => {
    if (currentTool === 'insert_text') {
        const pos = getPos(e);
        
        // Utwórz nowy tekst
        const newRef = push(ref(db, 'blocks'), {
            x: pos.x - 50,
            y: pos.y - 15,
            w: 100,
            h: 30,
            text: "Tekst",
            color: "transparent",
            isText: true,
            fontSize: 16,
            fontWeight: 'normal',
            fontStyle: 'normal'
        });
        
        // Przełącz na Select
        currentTool = 'select';
        canvas.style.cursor = 'default';
        updateActiveButton(btnSelect);

        // Otwórz edytor
        setTimeout(() => {
            selectedElement = { type: 'block', id: newRef.key };
            redrawBoard();
            updatePropertiesPanel();
            openTextEditor(newRef.key);
        }, 150);
    } else if (currentTool === 'select') {
        const pos = getPos(e);
        // Sprawdź czy to kliknięcie (a nie koniec dragowania)
        // dragStart jest ustawiane w pointerdown
        if (dist(pos.x, pos.y, dragStart.x, dragStart.y) < 5) {
            const hit = hitTest(pos.x, pos.y);
            if (hit && hit.type === 'block') {
                const block = localData.blocks[hit.id];
                
                // KOSTKA: Rzut przy kliknięciu (Czystym)
                if (block && block.isDice) {
                    let rolls = 0;
                    const maxRolls = 10;
                    const min = block.minVal || 1;
                    const max = block.maxVal || 6;
                    
                    const interval = setInterval(() => {
                        const randomVal = Math.floor(Math.random() * (max - min + 1)) + min;
                        set(ref(db, `blocks/${hit.id}/value`), randomVal);
                        rolls++;
                        if (rolls >= maxRolls) clearInterval(interval);
                    }, 50);
                }
            }
        }
    }
});

// Edycja z panelu bocznego
btnEditText.addEventListener('click', () => {
    if (selectedElement && selectedElement.type === 'block') {
        const block = localData.blocks[selectedElement.id];
        if (block && block.isText) {
             openTextEditor(selectedElement.id);
        }
    }
});

// Sync fontSize z panelu bocznego
fontSizeInput.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.type === 'block') {
        const block = localData.blocks[selectedElement.id];
        if (block && block.isText) {
            const newSize = parseInt(e.target.value) || 16;
            set(ref(db, `blocks/${selectedElement.id}/fontSize`), newSize);
            if(editingBlockId === selectedElement.id) editSizeInput.value = newSize;
        }
    }
});


// --- SCROLL WHEEL ACTIONS (PĘDZEL I TEKST) ---

// 1. Zmiana grubości pędzla rolką nad panelem
drawContext.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    let currentVal = parseInt(sizePicker.value);
    let newVal = currentVal + direction;

    // Clamp (1-50)
    newVal = Math.min(Math.max(newVal, 1), 50);
    sizePicker.value = newVal;

    // Aktualizuj kursor wizualnie od razu
    if (currentTool === 'draw') {
         const visualSize = newVal * scale;
         brushCursor.style.width = visualSize + 'px';
         brushCursor.style.height = visualSize + 'px';
    }
}, { passive: false });

// 2. Zmiana rozmiaru czcionki rolką nad edytorem
textEditorOverlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    let currentVal = parseInt(editSizeInput.value) || 16;
    let newVal = currentVal + direction;

    // Clamp (min 8)
    newVal = Math.max(newVal, 8);
    editSizeInput.value = newVal;
    
    // Wyzwól zdarzenie input, aby zapisać do Firebase (istniejący listener obsłuży)
    editSizeInput.dispatchEvent(new Event('input'));
}, { passive: false });


// --- ODBIERANIE DANYCH Z FIREBASE ---

// 1. Nowe kreski (Strokes)
onChildAdded(ref(db, 'strokes'), (snapshot) => {
    const strokeId = snapshot.key;
    const data = snapshot.val();
    
    if (localData.strokes[strokeId]) return;
    
    localData.strokes[strokeId] = {
        color: data.color,
        width: data.width,
        points: []
    };

    const packetsRef = ref(db, `strokes/${strokeId}/packets`);
    let localLastPoint = null;

    onChildAdded(packetsRef, (packetSnapshot) => {
        const points = packetSnapshot.val();
        if (!points || points.length === 0) return;

        if (localData.strokes[strokeId]) {
            localData.strokes[strokeId].points.push(...points);
        }

        redrawBoard(); // Po prostu przerysuj całość (dla prostoty przy zoomie i warstwach)
    });
});

// 2. Notatki (Notes)
onChildAdded(ref(db, 'notes'), (snapshot) => {
    const note = snapshot.val();
    localData.notes[snapshot.key] = note;
    redrawBoard();
});

// 3. Bloki (Blocks)
const blocksRef = ref(db, 'blocks');
import { onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

onChildAdded(blocksRef, (snapshot) => {
    localData.blocks[snapshot.key] = snapshot.val();
    redrawBoard();
});

onChildChanged(blocksRef, (snapshot) => {
    localData.blocks[snapshot.key] = snapshot.val();
    redrawBoard();
});

onChildRemoved(blocksRef, (snapshot) => {
    delete localData.blocks[snapshot.key];
    if (selectedElement && selectedElement.id === snapshot.key) {
        selectedElement = null;
    }
    redrawBoard();
    updatePropertiesPanel();
});

// 4. Połączenia (Connections)
const connsRef = ref(db, 'connections');

onChildAdded(connsRef, (snapshot) => {
    localData.connections[snapshot.key] = snapshot.val();
    redrawBoard();
});

onChildRemoved(connsRef, (snapshot) => {
    delete localData.connections[snapshot.key];
    redrawBoard();
});


// 5. Usuwanie (Clear)
onValue(ref(db, 'strokes'), (snapshot) => {
    if (!snapshot.exists()) {
        localData.strokes = {};
        redrawBoard();
    }
});

onValue(ref(db, 'notes'), (snapshot) => {
    if (!snapshot.exists()) {
        localData.notes = {};
        redrawBoard();
    }
});

onValue(ref(db, 'blocks'), (snapshot) => {
    if (!snapshot.exists()) {
        localData.blocks = {};
        selectedElement = null;
        redrawBoard();
    }
});

onValue(ref(db, 'connections'), (snapshot) => {
    if (!snapshot.exists()) {
        localData.connections = {};
        redrawBoard();
    }
});
