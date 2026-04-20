const GRID_WIDTH = 600; 
const GRID_HEIGHT = 450;
const POINT_RADIUS = 10; 
const LABEL_HEIGHT = 14;
const PADDING = 25; 

const container = document.getElementById('points-container');
const tooltip = document.getElementById('tooltip');

let currentFilter = null;
let allPoints = [];

// Drag functionality state
let draggedObj = null;
let dragStartX = 0;
let dragStartY = 0;
let dragInitLeft = 0;
let dragInitBottom = 0;

// Global Click listener for dismissing tooltips on mobile
document.addEventListener('click', (e) => {
    if (!e.target.closest('.risk-point')) {
        const t = document.getElementById('tooltip');
        if (t) t.style.display = 'none';
    }
});

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

function formatProcessName(name) {
    if (name.toUpperCase() === "TI") return "TI";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function renderPoints(data) {
    container.innerHTML = '';
    allPoints = [];

    data.forEach((p, index) => {
        const score = p.impact_val * p.prob_val;
        const category = getRiskCategory(score);
        
        // Map 1-5 to exact cell centers using Percentages (0% to 100%)
        let xPct = ((p.prob_val - 1) / 4) * 80 + 10;
        let yPct = ((p.impact_val - 1) / 4) * 80 + 10;

        // Apply Deterministic Jitter (based on process name) to avoid exact overlaps
        const seedX = getSeededRandom(p.PROCESO + "posX");
        const seedY = getSeededRandom(p.PROCESO + "posY");
        const jitterX = (seedX - 0.5) * 6; // +/- 3%
        const jitterY = (seedY - 0.5) * 6; // +/- 3%
        xPct += jitterX;
        yPct += jitterY;

        // Visual point
        const point = document.createElement('div');
        point.className = `risk-point ${category === 'high' ? 'critical' : category === 'med' ? 'alert' : 'low'}`;
        point.style.left = `${xPct}%`;
        point.style.bottom = `${yPct}%`;

        // Label offset with calc formulas for precision
        const label = document.createElement('div');
        label.className = 'point-label';
        label.innerText = formatProcessName(p.PROCESO);
        label.style.left = `calc(${xPct}% + 22px)`;
        label.style.bottom = `calc(${yPct}% - 8px)`;

        // Store for filtering

        const pointObj = { el: point, labelEl: label, category, score };
        allPoints.push(pointObj);

        // Tooltip interaction
        point.onmouseenter = (e) => {
            if (draggedObj) return; // Prevent hover changes if dragging something
            tooltip.style.display = 'block';
            document.getElementById('tt-title').innerText = p.PROCESO;
            document.getElementById('tt-impact').innerText = p.impact_val;
            document.getElementById('tt-prob').innerText = p.prob_val;
            document.getElementById('tt-findings').innerText = p.Hallazgo;
            document.getElementById('tt-score').innerText = score.toFixed(1);
            updateTooltipPos(e);
        };

        point.onmousemove = (e) => {
            if (!draggedObj) updateTooltipPos(e);
        };
        
        point.onmouseleave = () => {
            if (!draggedObj) tooltip.style.display = 'none';
        };

        // Mobile touch interaction
        point.onclick = (e) => {
            if (draggedObj) return;
            e.stopPropagation(); // Prevents instant hiding from document click
            tooltip.style.display = 'block';
            document.getElementById('tt-title').innerText = p.PROCESO;
            document.getElementById('tt-impact').innerText = p.impact_val;
            document.getElementById('tt-prob').innerText = p.prob_val;
            document.getElementById('tt-findings').innerText = p.Hallazgo;
            document.getElementById('tt-score').innerText = score.toFixed(1);
            updateTooltipPos(e);
        };

        // Drag interaction
        point.onmousedown = (e) => {
            e.preventDefault(); // Prevent text selection
            
            draggedObj = { pointEl: point, labelEl: label };
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            dragInitLeft = parseFloat(point.style.left); // stores the numeric %
            dragInitBottom = parseFloat(point.style.bottom); 
            
            point.style.zIndex = 2000;
            label.style.zIndex = 2001;
            
            point.style.transition = 'none';
            label.style.transition = 'none';
            
            // Hide tooltip during drag for clarity
            tooltip.style.display = 'none';
        };

        container.appendChild(point);

        container.appendChild(label);
    });
}

function updateTooltipPos(e) {
    const tooltip = document.getElementById('tooltip');
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    // Support Touch Events if triggered
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    let leftPos = clientX + 15;
    let topPos = clientY + 15;

    // Boundary check so tooltip doesn't bleed out of right side on Mobile
    if (leftPos + 240 > window.innerWidth) { // Approx width of tooltip
        leftPos = clientX - 240; // Flip to left side
    }

    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${topPos}px`;
}

function setupFilters() {
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach(card => {
        card.onclick = () => {
            const filter = card.getAttribute('data-filter');
            
            if (filter === 'all' || currentFilter === filter) {
                // Reset filter if clicking 'all' or the same active filter
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

// Global Drag Handlers
document.addEventListener('mousemove', (e) => {
    if (!draggedObj) return;
    
    const gridRect = document.getElementById('grid').getBoundingClientRect();
    
    // Calculate difference in percentages relative to the grid width/height
    const deltaX = (e.clientX - dragStartX) / gridRect.width * 100;
    const deltaY = (e.clientY - dragStartY) / gridRect.height * 100;
    
    // Apply position using % constraint
    draggedObj.pointEl.style.left = `${dragInitLeft + deltaX}%`;
    draggedObj.pointEl.style.bottom = `${dragInitBottom - deltaY}%`;
    
    draggedObj.labelEl.style.left = `calc(${dragInitLeft + deltaX}% + 22px)`;
    draggedObj.labelEl.style.bottom = `calc(${dragInitBottom - deltaY}% - 8px)`;
});

document.addEventListener('mouseup', () => {
    if (draggedObj) {
        draggedObj.pointEl.style.zIndex = '';
        draggedObj.labelEl.style.zIndex = 1;
        
        // Restore CSS transitions
        draggedObj.pointEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        draggedObj.labelEl.style.transition = 'opacity 0.3s';
        
        draggedObj = null;
    }
});

init();
