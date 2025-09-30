// Telegram Web App API with fallback
let tg = window.Telegram?.WebApp || {
    initDataUnsafe: { user: { id: 'demo_user', first_name: 'Demo' } },
    expand: () => {},
    MainButton: {
        setText: () => {},
        show: () => {},
        hide: () => {}
    },
    HapticFeedback: {
        notificationOccurred: () => {}
    },
    onEvent: () => {}
};

if (window.Telegram?.WebApp) {
    tg.expand();
}

// App State
let appState = {
    currentContest: {
        id: 1,
        participants: [],
        timeLeft: 30,
        phase: 'waiting',
        prizePool: 0,
        winnerCount: 0,
        tier: 'rookie',
        entryFee: 0.01
    },
    user: {
        balance: 0,
        wins: 0,
        totalEarnings: 0,
        winRate: 0
    },
    selectedTier: 'rookie',
    isJoined: false,
    ws: null,
    contestTiers: {
        rookie: { amount: 0.01, name: 'ROOKIE', multiplier: 1 },
        pro: { amount: 0.05, name: 'PRO', multiplier: 5 },
        elite: { amount: 0.1, name: 'ELITE', multiplier: 10 }
    }
};

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    contestTitle: document.getElementById('contestTitle'),
    contestPhase: document.getElementById('contestPhase'),
    timerText: document.getElementById('timerText'),
    timerCircle: document.getElementById('timerCircle'),
    participantsCount: document.getElementById('participantsCount'),
    participantsGrid: document.getElementById('participantsGrid'),
    winnerCount: document.getElementById('winnerCount'),
    prizePool: document.getElementById('prizePool'),
    joinBtn: document.getElementById('joinBtn'),
    joinAmount: document.getElementById('joinAmount'),
    topupBtn: document.getElementById('topupBtn'),
    statusBtn: document.getElementById('statusBtn'),
    historyBtn: document.getElementById('historyBtn'),
    shareBtn: document.getElementById('shareBtn'),
    winnersList: document.getElementById('winnersList'),
    totalWins: document.getElementById('totalWins'),
    totalEarnings: document.getElementById('totalEarnings'),
    winRate: document.getElementById('winRate'),
    profitPercentage: document.getElementById('profitPercentage'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    celebrationModal: document.getElementById('celebrationModal'),
    celebrationAmount: document.getElementById('celebrationAmount'),
    celebrationProfit: document.getElementById('celebrationProfit'),
    celebrationClose: document.getElementById('celebrationClose'),
    celebrationCloseX: document.getElementById('celebrationCloseX'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    tierButtons: document.querySelectorAll('.tier-btn')
};

// Initialize App
async function initApp() {
    showToast('🎰 Welcome to SourWinners!', 'success');

    // Simulate loading
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 2000);

    // Initialize user data
    await loadUserData();

    // Setup event listeners
    setupEventListeners();

    // Load initial contest data
    await loadContestData();

    // Start live updates
    startLiveUpdates();

    // Enable join button
    elements.joinBtn.disabled = false;
}

// Load user data from API
async function loadUserData() {
    try {
        const userId = tg.initDataUnsafe?.user?.id || 'demo_user';
        const response = await fetch(`/api/user/${userId}`);
        const userData = await response.json();

        appState.user = userData;
        updateUserDisplay();
    } catch (error) {
        console.error('Failed to load user data:', error);
        showToast('❌ Failed to load user data', 'error');
        // Fallback to demo data
        appState.user = {
            balance: 0.0500,
            wins: 12,
            totalEarnings: 0.1470,
            winRate: 75
        };
        updateUserDisplay();
    }
}

// Load contest data from API
async function loadContestData() {
    try {
        const response = await fetch('/api/contest/current');
        const contestData = await response.json();

        // Update app state with real contest data
        appState.currentContest = {
            ...appState.currentContest,
            id: contestData.id,
            participants: contestData.participants || [],
            timeLeft: contestData.timeLeft || 30,
            phase: contestData.phase || 'waiting',
            prizePool: contestData.prizePool || 0,
            entryFee: contestData.entryFee || 0.01
        };

        updateContestDisplay();

    } catch (error) {
        console.error('Failed to load contest data:', error);
        showToast('⚠️ Using offline mode', 'warning');
    }
}

// Update user display
function updateUserDisplay() {
    elements.balance.textContent = `${appState.user.balance.toFixed(4)} SOL`;
    elements.totalWins.textContent = appState.user.wins;
    elements.totalEarnings.textContent = appState.user.totalEarnings.toFixed(3);
    elements.winRate.textContent = `${appState.user.winRate}%`;

    // Calculate profit percentage (assuming user started with some SOL)
    const initialInvestment = 0.05; // Assume they started with 0.05 SOL
    const currentValue = appState.user.balance + appState.user.totalEarnings;
    const profitPercent = ((currentValue - initialInvestment) / initialInvestment * 100).toFixed(0);
    elements.profitPercentage.textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent}%`;
}

// Setup event listeners
function setupEventListeners() {
    elements.joinBtn.addEventListener('click', joinContest);
    elements.topupBtn.addEventListener('click', topupSol);
    elements.statusBtn.addEventListener('click', showStatus);
    elements.historyBtn.addEventListener('click', showHistory);
    elements.shareBtn.addEventListener('click', shareApp);
    elements.celebrationClose.addEventListener('click', closeCelebration);
    elements.celebrationCloseX.addEventListener('click', closeCelebration);

    // Tier selection listeners
    elements.tierButtons.forEach(btn => {
        btn.addEventListener('click', () => selectTier(btn.dataset.tier, parseFloat(btn.dataset.amount)));
    });
}

// Join contest
async function joinContest() {
    const entryFee = appState.currentContest.entryFee;
    const tierName = appState.contestTiers[appState.currentContest.tier].name;

    if (appState.isJoined) {
        showToast('✅ You are already in this contest!', 'info');
        return;
    }

    if (appState.user.balance < entryFee) {
        showToast(`❌ Insufficient balance! Need ${entryFee.toFixed(2)} SOL`, 'error');
        return;
    }

    try {
        elements.joinBtn.disabled = true;
        elements.joinBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Joining...</span>';

        // Call API to join contest
        const userId = tg.initDataUnsafe?.user?.id || 'demo_user';
        const response = await fetch('/api/contest/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to join contest');
        }

        // Update state
        appState.isJoined = true;
        appState.user.balance = result.newBalance || (appState.user.balance - entryFee);

        // Refresh contest data to get updated participants
        await loadContestData();

        updateUserDisplay();
        updateContestDisplay();

        elements.joinBtn.innerHTML = `<span class="btn-icon">✅</span><span class="btn-text">Joined ${tierName}!</span><span class="btn-amount">Good Luck!</span>`;

        showToast(`🎉 Joined ${tierName} contest!`, 'success');

        // Simulate other players joining (more for higher tiers)
        const joinDelay = appState.currentContest.tier === 'elite' ? 1000 : appState.currentContest.tier === 'pro' ? 1500 : 2000;
        setTimeout(() => addRandomParticipant(), joinDelay);
        setTimeout(() => addRandomParticipant(), joinDelay * 2);

        // Higher tier contests get more players faster
        if (appState.currentContest.tier !== 'rookie') {
            setTimeout(() => addRandomParticipant(), joinDelay * 3);
        }

    } catch (error) {
        elements.joinBtn.disabled = false;
        elements.joinBtn.innerHTML = `<span class="btn-icon">🎰</span><span class="btn-text">Join Contest</span><span class="btn-amount" id="joinAmount">${entryFee.toFixed(2)} SOL</span>`;
        // Re-reference the joinAmount element after innerHTML update
        elements.joinAmount = document.getElementById('joinAmount');
        // Update Telegram MainButton
        if (tg && tg.MainButton) {
            tg.MainButton.setText(`🎰 Join Contest (${entryFee.toFixed(2)} SOL)`);
        }
        showToast('❌ Failed to join contest', 'error');
    }
}

// Add random participant (simulation)
function addRandomParticipant() {
    const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry'];
    const avatars = ['🤖', '👾', '🎯', '🚀', '⭐', '🔥', '💎', '🎭'];

    const participant = {
        id: 'sim_' + Date.now(),
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        name: names[Math.floor(Math.random() * names.length)]
    };

    appState.currentContest.participants.push(participant);
    updateContestDisplay();
    showToast(`👋 ${participant.name} joined the contest!`, 'info');
}

// Select contest tier
function selectTier(tier, amount) {
    appState.selectedTier = tier;
    appState.currentContest.tier = tier;
    appState.currentContest.entryFee = amount;

    // Update tier button states
    elements.tierButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tier === tier) {
            btn.classList.add('active');
        }
    });

    // Update join button - re-reference if needed
    if (!elements.joinAmount) {
        elements.joinAmount = document.getElementById('joinAmount');
    }
    if (elements.joinAmount) {
        elements.joinAmount.textContent = `${amount.toFixed(2)} SOL`;
    }

    // Update Telegram MainButton
    if (tg && tg.MainButton) {
        tg.MainButton.setText(`🎰 Join Contest (${amount.toFixed(2)} SOL)`);
    }

    // Update contest display
    updateContestDisplay();

    const tierInfo = appState.contestTiers[tier];
    showToast(`Selected ${tierInfo.name} tier - ${tierInfo.multiplier}x rewards!`, 'info');
}

// Update contest display
function updateContestDisplay() {
    const contest = appState.currentContest;
    const participantCount = contest.participants.length;
    const tierInfo = appState.contestTiers[contest.tier] || appState.contestTiers.rookie;

    // Update header
    elements.contestTitle.textContent = `🎰 ${tierInfo.name} #${contest.id}`;

    // Update phase
    let phaseText, phaseColor;
    if (participantCount < 2) {
        phaseText = `⏳ Need ${2 - participantCount} more players!`;
        phaseColor = '🔴';
    } else if (contest.timeLeft > 5) {
        phaseText = '🎰 Contest active - JOIN NOW!';
        phaseColor = '🟢';
    } else {
        phaseText = '⚡ FINAL SECONDS!';
        phaseColor = '🟡';
    }

    elements.contestPhase.textContent = phaseText;
    elements.contestTitle.textContent = `${phaseColor} ${tierInfo.name} #${contest.id}`;

    // Update participants count
    elements.participantsCount.textContent = `${participantCount}/30`;

    // Update participants grid
    elements.participantsGrid.innerHTML = '';
    contest.participants.forEach((participant, index) => {
        const avatar = document.createElement('div');
        avatar.className = 'participant-avatar';
        avatar.textContent = participant.avatar;
        avatar.title = participant.name;
        avatar.style.animationDelay = `${index * 0.1}s`;
        elements.participantsGrid.appendChild(avatar);
    });

    // Update winners and prize
    const winnerCount = Math.floor(participantCount * 0.8);
    const prizePool = participantCount * contest.entryFee * 0.98; // 2% house fee

    elements.winnerCount.textContent = `${winnerCount} (80%)`;
    elements.prizePool.textContent = `${prizePool.toFixed(4)} SOL`;

    contest.winnerCount = winnerCount;
    contest.prizePool = prizePool;
}

// Start live updates (timer and simulations)
function startLiveUpdates() {
    // Sync with server every 2 seconds
    const syncInterval = setInterval(async () => {
        await loadContestData();
    }, 2000);

    // Local timer for smooth countdown
    const timerInterval = setInterval(() => {
        if (appState.currentContest.timeLeft > 0) {
            appState.currentContest.timeLeft--;
        }

        // Update timer display
        elements.timerText.textContent = appState.currentContest.timeLeft;

        const timeLeft = appState.currentContest.timeLeft;

        // Update timer circle color based on time
        if (timeLeft <= 3) {
            elements.timerCircle.style.background = 'conic-gradient(from 0deg, #FF6B6B, #FF8E8E, #FF6B6B)';
        } else if (timeLeft <= 7) {
            elements.timerCircle.style.background = 'conic-gradient(from 0deg, #FFEAA7, #FFD93D, #FFEAA7)';
        }

        // Warning notifications
        if (timeLeft === 5 && appState.currentContest.participants.length >= 2) {
            showToast('⚡ 5 seconds left!', 'warning');
        } else if (timeLeft === 3 && appState.currentContest.participants.length >= 2) {
            showToast('🎲 3 seconds!', 'warning');
        } else if (timeLeft === 1 && appState.currentContest.participants.length >= 2) {
            showToast('🔥 FINAL SECOND!', 'warning');
        }
    }, 1000);
}

// Finalize contest
async function finalizeContest() {
    const contest = appState.currentContest;

    if (contest.participants.length < 2) {
        showToast('⏩ Contest skipped - not enough players', 'info');
        resetContest();
        return;
    }

    // Show selection animation
    elements.contestPhase.textContent = '🎲 Selecting winners...';

    // Simulate winner selection
    await new Promise(resolve => setTimeout(resolve, 2000));

    const winners = selectWinners(contest.participants);
    const isUserWinner = winners.some(w => w.id.includes('user_'));

    if (isUserWinner) {
        const prizePerWinner = contest.prizePool / winners.length;
        appState.user.balance += prizePerWinner;
        appState.user.wins++;
        appState.user.totalEarnings += prizePerWinner;
        appState.user.winRate = Math.round((appState.user.wins / (appState.user.wins + 3)) * 100); // Simulate some losses

        updateUserDisplay();
        showCelebration(prizePerWinner);
    } else {
        showToast('😔 Not this time! 80% win rate - keep playing!', 'info');
    }

    // Add to winners list
    addToWinnersList(winners);

    // Reset for next contest
    setTimeout(resetContest, 3000);
}

// Select winners (80% of participants)
function selectWinners(participants) {
    const winnerCount = Math.floor(participants.length * 0.8);
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, winnerCount);
}

// Show celebration modal
function showCelebration(amount) {
    elements.celebrationAmount.textContent = `${amount.toFixed(4)} SOL`;

    // Calculate profit percentage for this win (amount won vs entry fee)
    const entryFee = 0.01;
    const profitPercent = ((amount - entryFee) / entryFee * 100).toFixed(0);
    elements.celebrationProfit.textContent = `+${profitPercent}%`;

    elements.celebrationModal.classList.add('show');

    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// Close celebration
function closeCelebration() {
    elements.celebrationModal.classList.remove('show');
}

// Add to leaderboard (top 5 winners with profit %)
function addToWinnersList(winners) {
    winners.forEach(winner => {
        const winnerItem = document.createElement('div');
        winnerItem.className = 'winner-item';

        const prizeAmount = (appState.currentContest.prizePool / winners.length).toFixed(4);
        const entryFee = 0.01;
        const profitPercent = ((prizeAmount - entryFee) / entryFee * 100).toFixed(0);

        winnerItem.innerHTML = `
            <div class="winner-info">
                <div class="winner-avatar">${winner.avatar}</div>
                <span>${winner.name}</span>
            </div>
            <div class="winner-stats">
                <div class="winner-amount">+${prizeAmount} SOL</div>
                <div class="winner-profit">+${profitPercent}%</div>
            </div>
        `;

        elements.winnersList.insertBefore(winnerItem, elements.winnersList.firstChild);

        // Keep only top 5 winners
        if (elements.winnersList.children.length > 5) {
            elements.winnersList.removeChild(elements.winnersList.lastChild);
        }
    });
}

// Reset contest
function resetContest() {
    const entryFee = appState.currentContest.entryFee;
    const tier = appState.currentContest.tier;

    appState.currentContest = {
        id: appState.currentContest.id + 1,
        participants: [],
        timeLeft: 30,
        phase: 'waiting',
        prizePool: 0,
        winnerCount: 0,
        tier: tier,
        entryFee: entryFee
    };

    appState.isJoined = false;

    // Reset UI
    elements.joinBtn.disabled = false;
    elements.joinBtn.innerHTML = `<span class="btn-icon">🎰</span><span class="btn-text">Join Contest</span><span class="btn-amount" id="joinAmount">${entryFee.toFixed(2)} SOL</span>`;

    // Re-reference the joinAmount element after innerHTML update
    elements.joinAmount = document.getElementById('joinAmount');

    // Update Telegram MainButton
    if (tg && tg.MainButton) {
        tg.MainButton.setText(`🎰 Join Contest (${entryFee.toFixed(2)} SOL)`);
    }

    updateContestDisplay();
    const tierName = appState.contestTiers[tier].name;
    showToast(`🆕 New ${tierName} contest started!`, 'success');

    // Start new timer
    startLiveUpdates();
}

// Top up SOL
async function topupSol() {
    try {
        elements.topupBtn.disabled = true;
        elements.topupBtn.textContent = 'Adding...';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        appState.user.balance += 0.05;
        updateUserDisplay();

        elements.topupBtn.disabled = false;
        elements.topupBtn.textContent = '+ Add SOL';

        showToast('✅ Added 0.05 SOL to your wallet!', 'success');

    } catch (error) {
        elements.topupBtn.disabled = false;
        elements.topupBtn.textContent = '+ Add SOL';
        showToast('❌ Failed to add SOL', 'error');
    }
}

// Show status
function showStatus() {
    const status = `
Contest #${appState.currentContest.id}
Players: ${appState.currentContest.participants.length}/30
Time Left: ${appState.currentContest.timeLeft}s
Prize Pool: ${appState.currentContest.prizePool.toFixed(4)} SOL
Your Odds: 80%
    `.trim();

    showToast(status, 'info');
}

// Show history
function showHistory() {
    const history = `
Your Stats:
🏆 Wins: ${appState.user.wins}
💰 Earned: ${appState.user.totalEarnings.toFixed(4)} SOL
📊 Win Rate: ${appState.user.winRate}%
💸 Balance: ${appState.user.balance.toFixed(4)} SOL
    `.trim();

    showToast(history, 'info');
}

// Share app
function shareApp() {
    const shareText = `🎰 Join me on SourWinners - the lottery where you WIN 4x more often! 80% of players win every round! 🎉`;

    if (tg.shareMessage) {
        tg.shareMessage(shareText);
    } else {
        // Fallback
        navigator.clipboard?.writeText(shareText + '\n\nPlay now: t.me/your_bot_username');
        showToast('📢 Share link copied!', 'success');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚡',
        info: 'ℹ️'
    };

    elements.toast.querySelector('.toast-icon').textContent = icons[type] || 'ℹ️';
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle Telegram WebApp events
tg.onEvent('mainButtonClicked', () => {
    joinContest();
});

tg.onEvent('backButtonClicked', () => {
    // Handle back button if needed
});

// Set up main button
tg.MainButton.setText('🎰 Join Contest (0.01 SOL)');
tg.MainButton.show();

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // App is hidden
    } else {
        // App is visible, refresh data
        loadUserData();
    }
});

// Export for debugging
window.appState = appState;
window.elements = elements;