/**
 * PrivGuard Dashboard Controller
 * Handles simulation, data fetching, chart rendering, and live threat feed.
 */

// ========================
// State
// ========================
let allAlerts = [];
let isSimulating = false;
let animationIndex = 0;
let animationTimer = null;

// ========================
// API
// ========================
const API = {
    simulate: () => fetch('/api/v1/simulate', { method: 'POST' }).then(r => r.json()),
    alerts: () => fetch('/api/v1/alerts').then(r => r.json()),
    stats: () => fetch('/api/v1/stats').then(r => r.json()),
    health: () => fetch('/health').then(r => r.json()),
};

// ========================
// Simulation
// ========================
async function runSimulation() {
    const btn = document.getElementById('btnSimulate');
    if (isSimulating) return;
    
    isSimulating = true;
    btn.classList.add('loading');
    btn.textContent = '⏳ Simulating...';
    
    // Clear current display
    allAlerts = [];
    animationIndex = 0;
    clearInterval(animationTimer);
    renderThreatFeed([]);
    updateStats({ total_events: 0, active_threats: 0, critical_alerts: 0, avg_risk_score: 0, band_counts: { Low: 0, Medium: 0, High: 0, Critical: 0 } });
    
    try {
        const data = await API.simulate();
        const alerts = data.alerts || [];
        
        // Animate events appearing one by one
        animateEventsIn(alerts);
        
    } catch (err) {
        console.error('Simulation failed:', err);
        btn.textContent = '❌ Failed — Retry';
        btn.classList.remove('loading');
        isSimulating = false;
    }
}

function animateEventsIn(alerts) {
    const btn = document.getElementById('btnSimulate');
    let index = 0;
    
    animationTimer = setInterval(() => {
        if (index >= alerts.length) {
            clearInterval(animationTimer);
            btn.classList.remove('loading');
            btn.textContent = '⚡ Simulate Again';
            isSimulating = false;
            return;
        }
        
        allAlerts.push(alerts[index]);
        index++;
        
        // Update everything
        renderThreatFeed(allAlerts);
        updateStatsFromAlerts(allAlerts);
        drawDonutChart(allAlerts);
        drawTimelineChart(allAlerts);
        updateLatestCritical(allAlerts);
        
        // Scroll feed to show latest
        const feed = document.getElementById('threatFeed');
        feed.scrollTop = 0;
        
    }, 300); // 300ms between each event appearing
}

// ========================
// Stats
// ========================
function updateStats(stats) {
    animateNumber('statTotal', stats.total_events);
    animateNumber('statThreats', stats.active_threats);
    animateNumber('statCritical', stats.critical_alerts);
    document.getElementById('statAvgScore').textContent = stats.avg_risk_score.toFixed(1);
    
    // Update legend
    const bc = stats.band_counts || {};
    document.getElementById('legendLow').textContent = bc.Low || 0;
    document.getElementById('legendMedium').textContent = bc.Medium || 0;
    document.getElementById('legendHigh').textContent = bc.High || 0;
    document.getElementById('legendCritical').textContent = bc.Critical || 0;
}

function updateStatsFromAlerts(alerts) {
    const bc = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    let totalScore = 0;
    
    alerts.forEach(a => {
        bc[a.risk_band] = (bc[a.risk_band] || 0) + 1;
        totalScore += a.composite_risk_score;
    });
    
    updateStats({
        total_events: alerts.length,
        active_threats: bc.Medium + bc.High + bc.Critical,
        critical_alerts: bc.Critical,
        avg_risk_score: alerts.length ? totalScore / alerts.length : 0,
        band_counts: bc
    });
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    
    const diff = target - current;
    const step = diff > 0 ? 1 : -1;
    let val = current;
    
    const interval = setInterval(() => {
        val += step;
        el.textContent = val;
        if (val === target) clearInterval(interval);
    }, 30);
}

// ========================
// Threat Feed
// ========================
function renderThreatFeed(alerts) {
    const feed = document.getElementById('threatFeed');
    const empty = document.getElementById('emptyState');
    const badge = document.getElementById('feedCount');
    
    badge.textContent = `${alerts.length} events`;
    
    if (alerts.length === 0) {
        feed.innerHTML = '';
        feed.appendChild(createEmptyState());
        return;
    }
    
    // Build newest-first
    const reversed = [...alerts].reverse();
    feed.innerHTML = '';
    
    reversed.forEach((alert, i) => {
        const row = document.createElement('div');
        row.className = `threat-row risk-${alert.risk_band}`;
        if (alert.risk_band === 'Critical' && i < 3) {
            row.classList.add('pulse');
        }
        
        const time = formatTime(alert.timestamp);
        const scoreClass = `score-${alert.risk_band.toLowerCase()}`;
        const actionClass = `action-${alert.action_required}`;
        
        row.innerHTML = `
            <span class="threat-time">${time}</span>
            <span class="threat-user">
                ${alert.user_name}
                <div class="threat-user-dept">${alert.department}</div>
            </span>
            <span class="threat-detail">
                <span class="threat-system">${alert.target_system}</span>
                <span style="color: var(--text-muted); margin: 0 4px;">→</span>
                ${alert.target_object}
            </span>
            <span><span class="risk-badge band-${alert.risk_band}">${getRiskIcon(alert.risk_band)} ${alert.risk_band}</span></span>
            <span class="threat-score ${scoreClass}">${alert.composite_risk_score.toFixed(1)}</span>
            <span><span class="action-badge ${actionClass}">${formatAction(alert.action_required)}</span></span>
        `;
        
        feed.appendChild(row);
    });
}

function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.id = 'emptyState';
    div.innerHTML = `
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No Events Yet</div>
        <div class="empty-desc">Click <strong>"⚡ Simulate Attack"</strong> to generate realistic threat scenarios and watch them get detected in real time.</div>
    `;
    return div;
}

function formatTime(isoStr) {
    try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return isoStr.substring(11, 16);
    }
}

function getRiskIcon(band) {
    return { Low: '●', Medium: '▲', High: '◆', Critical: '⬟' }[band] || '●';
}

function formatAction(action) {
    const map = {
        'allow': '✓ Allow',
        'step-up-mfa': '🔐 MFA',
        'jit-approval-required': '⏳ JIT Approve',
        'auto-block-session': '🚫 BLOCKED'
    };
    return map[action] || action;
}

// ========================
// Latest Critical Alert
// ========================
function updateLatestCritical(alerts) {
    const critical = alerts.filter(a => a.risk_band === 'Critical' || a.risk_band === 'High');
    const panel = document.getElementById('latestAlertDetail');
    const badge = document.getElementById('latestAlertBadge');
    
    if (critical.length === 0) {
        badge.textContent = '—';
        panel.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
                <div class="empty-icon" style="font-size: 2rem;">🟢</div>
                <div class="empty-title">All Clear</div>
                <div class="empty-desc">No critical alerts detected.</div>
            </div>
        `;
        return;
    }
    
    const latest = critical[critical.length - 1];
    badge.textContent = latest.risk_band;
    badge.style.color = latest.risk_band === 'Critical' ? 'var(--color-critical)' : 'var(--color-high)';
    
    panel.innerHTML = `
        <div class="breakdown-row">
            <span class="breakdown-label">👤 User</span>
            <span style="grid-column: span 2; color: var(--text-primary); font-weight: 600;">${latest.user_name} (${latest.department})</span>
        </div>
        <div class="breakdown-row">
            <span class="breakdown-label">🎯 Target</span>
            <span style="grid-column: span 2; color: var(--accent-cyan); font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;">${latest.target_system} → ${latest.target_object}</span>
        </div>
        <div class="breakdown-row">
            <span class="breakdown-label">📦 Data Transfer</span>
            <span style="grid-column: span 2; color: var(--color-critical); font-weight: 700;">${formatBytes(latest.bytes_transferred)}</span>
        </div>
        <div class="breakdown-row">
            <span class="breakdown-label">💻 Command</span>
            <span style="grid-column: span 2; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; word-break: break-all;">${latest.command_text || 'N/A'}</span>
        </div>
        <div class="breakdown-row">
            <span class="breakdown-label">🔴 Risk Score</span>
            <div class="breakdown-bar-track">
                <div class="breakdown-bar-fill" style="width: ${latest.composite_risk_score}%; background: ${getScoreColor(latest.composite_risk_score)};"></div>
            </div>
            <span class="breakdown-value" style="color: ${getScoreColor(latest.composite_risk_score)};">${latest.composite_risk_score.toFixed(1)}</span>
        </div>
        <div class="breakdown-row">
            <span class="breakdown-label">⚡ Action</span>
            <span style="grid-column: span 2;"><span class="action-badge action-${latest.action_required}" style="font-size: 0.78rem;">${formatAction(latest.action_required)}</span></span>
        </div>
    `;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function getScoreColor(score) {
    if (score > 85) return '#ef4444';
    if (score > 60) return '#f97316';
    if (score > 30) return '#f59e0b';
    return '#22c55e';
}

// ========================
// Donut Chart (Canvas)
// ========================
function drawDonutChart(alerts) {
    const canvas = document.getElementById('donutChart');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const outerR = 90;
    const innerR = 58;
    
    ctx.clearRect(0, 0, W, H);
    
    const bc = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    alerts.forEach(a => bc[a.risk_band] = (bc[a.risk_band] || 0) + 1);
    
    const total = alerts.length;
    if (total === 0) {
        // Draw empty ring
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        
        ctx.font = '600 14px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('No Data', cx, cy + 5);
        return;
    }
    
    const segments = [
        { label: 'Low', count: bc.Low, color: '#22c55e' },
        { label: 'Medium', count: bc.Medium, color: '#f59e0b' },
        { label: 'High', count: bc.High, color: '#f97316' },
        { label: 'Critical', count: bc.Critical, color: '#ef4444' },
    ].filter(s => s.count > 0);
    
    let startAngle = -Math.PI / 2;
    
    segments.forEach(seg => {
        const sliceAngle = (seg.count / total) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        
        // Gap between segments
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle + sliceAngle - 0.02, startAngle + sliceAngle + 0.02);
        ctx.arc(cx, cy, innerR, startAngle + sliceAngle + 0.02, startAngle + sliceAngle - 0.02, true);
        ctx.fillStyle = '#0a0e1a';
        ctx.fill();
        
        startAngle += sliceAngle;
    });
    
    // Center text
    ctx.font = '800 28px Inter';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 8);
    
    ctx.font = '500 11px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('EVENTS', cx, cy + 14);
}

// ========================
// Timeline Chart (Canvas)
// ========================
function drawTimelineChart(alerts) {
    const canvas = document.getElementById('timelineChart');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 20, right: 15, bottom: 30, left: 40 };
    
    ctx.clearRect(0, 0, W, H);
    
    if (alerts.length === 0) {
        ctx.font = '500 13px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', W / 2, H / 2);
        return;
    }
    
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const scores = alerts.map(a => a.composite_risk_score);
    const maxScore = 100;
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    [0, 30, 60, 85, 100].forEach(val => {
        const y = pad.top + chartH - (val / maxScore) * chartH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        
        ctx.font = '500 9px JetBrains Mono';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'right';
        ctx.fillText(val, pad.left - 6, y + 3);
    });
    
    // Threshold zones
    // Low zone (0-30)
    const y30 = pad.top + chartH - (30 / maxScore) * chartH;
    const y60 = pad.top + chartH - (60 / maxScore) * chartH;
    const y85 = pad.top + chartH - (85 / maxScore) * chartH;
    const yTop = pad.top;
    const yBottom = pad.top + chartH;
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
    ctx.fillRect(pad.left, y30, chartW, yBottom - y30);
    
    ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
    ctx.fillRect(pad.left, y60, chartW, y30 - y60);
    
    ctx.fillStyle = 'rgba(249, 115, 22, 0.04)';
    ctx.fillRect(pad.left, y85, chartW, y60 - y85);
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    ctx.fillRect(pad.left, yTop, chartW, y85 - yTop);
    
    // Draw line
    const stepX = scores.length > 1 ? chartW / (scores.length - 1) : chartW / 2;
    
    // Gradient fill under the line
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
    
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    scores.forEach((score, i) => {
        const x = pad.left + i * stepX;
        const y = pad.top + chartH - (score / maxScore) * chartH;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (scores.length - 1) * stepX, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Line stroke
    ctx.beginPath();
    scores.forEach((score, i) => {
        const x = pad.left + i * stepX;
        const y = pad.top + chartH - (score / maxScore) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Data points
    scores.forEach((score, i) => {
        const x = pad.left + i * stepX;
        const y = pad.top + chartH - (score / maxScore) * chartH;
        const color = getScoreColor(score);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
    
    // X-axis label
    ctx.font = '500 9px Inter';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('Event Sequence →', W / 2, H - 6);
}

// ========================
// Health Check
// ========================
async function checkHealth() {
    try {
        const data = await API.health();
        document.getElementById('statusDot').classList.remove('offline');
        document.getElementById('statusText').textContent = 'Engine Online';
    } catch {
        document.getElementById('statusDot').classList.add('offline');
        document.getElementById('statusText').textContent = 'Offline';
    }
}

// ========================
// Init
// ========================
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    drawDonutChart([]);
    drawTimelineChart([]);
    
    // Periodic health check
    setInterval(checkHealth, 10000);
});
