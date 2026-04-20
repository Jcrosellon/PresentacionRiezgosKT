const GRID_WIDTH = 600; 
const GRID_HEIGHT = 450;
const POINT_RADIUS = 10; 
const LABEL_HEIGHT = 14;
const PADDING = 25; 

const container = document.getElementById('points-container');
const tooltip = document.getElementById('tooltip');

let currentFilter = null;
let allPoints = [];

async function init() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        renderPoints(data);
        setupFilters();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

function getRiskCategory(score) {
    if (score >= 20) return 'high';
    if (score >= 10) return 'med';
    return 'low';
}

function getSeededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    // Return a pseudo-random value between 0 and 1
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
}

function renderPoints(data) {
    container.innerHTML = '';
    allPoints = [];

    data.forEach((p, index) => {
        const score = p.impact_val * p.prob_val;
        const category = getRiskCategory(score);
        
        // Map 1-5 to GRID dimensions
        let x = (p.prob_val - 1) / 4 * (GRID_WIDTH - 2 * PADDING) + PADDING;
        let y = (p.impact_val - 1) / 4 * (GRID_HEIGHT - 2 * PADDING) + PADDING;

        // Apply Deterministic Jitter (based on process name) to avoid exact overlaps
        // This ensures positions are consistent across reloads
        const seedX = getSeededRandom(p.PROCESO + "posX");
        const seedY = getSeededRandom(p.PROCESO + "posY");
        const jitterX = (seedX - 0.5) * 35;
        const jitterY = (seedY - 0.5) * 35;
        x += jitterX;
        y += jitterY;

        // Visual point
        const point = document.createElement('div');
        point.className = `risk-point ${category === 'high' ? 'critical' : category === 'med' ? 'alert' : 'low'}`;
        point.style.left = `${x}px`;
        point.style.bottom = `${y}px`; // Uses bottom because y-axis starts from bottom

        // Label
        const label = document.createElement('div');
        label.className = 'point-label';
        label.innerText = p.PROCESO;
        label.style.left = `${x + 15}px`;
        label.style.bottom = `${y - 10}px`;

        // Store for filtering
        const pointObj = { el: point, labelEl: label, category, score };
        allPoints.push(pointObj);

        // Tooltip interaction
        point.onmouseenter = (e) => {
            tooltip.style.display = 'block';
            document.getElementById('tt-title').innerText = p.PROCESO;
            document.getElementById('tt-impact').innerText = p.impact_val;
            document.getElementById('tt-prob').innerText = p.prob_val;
            document.getElementById('tt-findings').innerText = p.Hallazgo;
            document.getElementById('tt-score').innerText = score.toFixed(1);
            updateTooltipPos(e);
        };

        point.onmousemove = (e) => updateTooltipPos(e);
        point.onmouseleave = () => tooltip.style.display = 'none';

        container.appendChild(point);
        container.appendChild(label);
    });
}

function updateTooltipPos(e) {
    tooltip.style.left = `${e.clientX + 20}px`;
    tooltip.style.top = `${e.clientY + 20}px`;
}

function setupFilters() {
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach(card => {
        card.onclick = () => {
            const filter = card.getAttribute('data-filter');
            
            if (currentFilter === filter) {
                // Reset filter if clicking the active one
                currentFilter = null;
                cards.forEach(c => c.classList.remove('active'));
            } else {
                currentFilter = filter;
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            }

            applyFilter();
        };
    });
}

function applyFilter() {
    allPoints.forEach(p => {
        if (!currentFilter || p.category === currentFilter) {
            p.el.classList.remove('filtered');
            // Labels are handled by CSS based on the .filtered class of the point
        } else {
            p.el.classList.add('filtered');
        }
    });
}

init();
