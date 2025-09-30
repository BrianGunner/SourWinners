const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS and security headers for Telegram Web Apps
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
    // Allow framing from Telegram domains
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('Content-Security-Policy', "frame-ancestors 'self' https://web.telegram.org https://telegram.org https://*.telegram.org");
    res.header('ngrok-skip-browser-warning', 'true');
    next();
});

// Serve static files from the mini-app directory
app.use(express.static(path.join(__dirname)));

// Handle Mini App route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for Mini App integration
app.use(express.json());

// Get user data
app.get('/api/user/:userId', (req, res) => {
    // In real app, fetch from your database
    const userData = {
        balance: 0.0500,
        wins: 12,
        totalEarnings: 0.1470,
        winRate: 75,
        contestsPlayed: 16
    };
    res.json(userData);
});

const fs = require('fs');

// Self-contained contest system for Railway deployment
let currentContest = {
    id: 1,
    startTime: Date.now(),
    participants: [],
    entryFee: 0.01,
    maxParticipants: 30
};

// Generate realistic contest data
function generateContestData() {
    const now = Date.now();
    const contestDuration = 60000; // 60 seconds
    const elapsed = (now - currentContest.startTime) % contestDuration;
    const timeLeft = Math.max(0, Math.floor((contestDuration - elapsed) / 1000));

    // Reset contest every minute
    if (elapsed < 1000) { // First second of new contest
        currentContest.id++;
        currentContest.participants = [];
    }

    // Simulate participants joining during contest
    const maxParticipants = Math.min(8, Math.floor(elapsed / 8000) + 1); // Add participant every 8 seconds
    while (currentContest.participants.length < maxParticipants && timeLeft > 5) {
        currentContest.participants.push(`player_${currentContest.participants.length + 1}`);
    }

    return {
        id: currentContest.id,
        participants: currentContest.participants.map((p, index) => ({
            id: p,
            avatar: ['🎮', '🤖', '👾', '🎯', '🚀', '⭐', '🔥', '💎'][index % 8],
            name: `Player ${index + 1}`
        })),
        timeLeft: timeLeft,
        entryFee: currentContest.entryFee,
        prizePool: currentContest.participants.length * currentContest.entryFee * 0.98,
        phase: currentContest.participants.length >= 3 ? (timeLeft > 0 ? 'active' : 'finalizing') : 'waiting'
    };
}

// Fallback function for local bot sync (when available)
async function syncWithBotData() {
    try {
        const botState = JSON.parse(fs.readFileSync('/tmp/contest-state.json', 'utf8'));
        const timeLeft = Math.max(0, Math.floor((botState.startTime + 120000 - Date.now()) / 1000));

        return {
            id: botState.id,
            participants: botState.participants.map((p, index) => ({
                id: `player_${index}`,
                avatar: ['🎮', '🤖', '👾', '🎯', '🚀', '⭐', '🔥', '💎'][index % 8],
                name: `Player ${index + 1}`
            })),
            timeLeft: timeLeft,
            entryFee: botState.entryFee,
            prizePool: botState.participants.length * botState.entryFee * 0.98,
            phase: botState.participants.length >= 3 ? (timeLeft > 0 ? 'active' : 'finalizing') : 'waiting'
        };
    } catch (error) {
        console.log('No bot state found, using self-contained contest system');
        return generateContestData();
    }
}

// Get current contest
app.get('/api/contest/current', async (req, res) => {
    try {
        const contestData = await syncWithBotData();
        res.json(contestData);
    } catch (error) {
        // Fallback to mock data if sync fails
        const contestData = {
            id: 1,
            participants: [],
            timeLeft: 15,
            entryFee: 0.01,
            prizePool: 0,
            phase: 'waiting'
        };
        res.json(contestData);
    }
});

// Join contest
app.post('/api/contest/join', (req, res) => {
    const { userId } = req.body;

    // In real app, integrate with your bot's join logic
    console.log(`User ${userId} joined contest via Mini App`);

    res.json({
        success: true,
        message: 'Successfully joined contest!',
        newBalance: 0.0400 // Updated balance after paying entry fee
    });
});

// Top up balance
app.post('/api/topup', (req, res) => {
    const { userId, amount } = req.body;

    // In real app, integrate with your funding logic
    console.log(`User ${userId} topped up ${amount} SOL via Mini App`);

    res.json({
        success: true,
        newBalance: 0.1000, // Updated balance
        message: `Added ${amount} SOL to your wallet!`
    });
});

// Get recent winners
app.get('/api/winners/recent', (req, res) => {
    // In real app, fetch from your database
    const recentWinners = [
        { name: 'Alice', avatar: '🤖', amount: 0.0147, timestamp: Date.now() - 60000 },
        { name: 'Bob', avatar: '👾', amount: 0.0147, timestamp: Date.now() - 120000 },
        { name: 'Carol', avatar: '🎯', amount: 0.0147, timestamp: Date.now() - 180000 }
    ];
    res.json(recentWinners);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SourWinners Mini App server running on port ${PORT}`);
    console.log(`📱 Access at: http://localhost:${PORT}`);
    console.log('🔗 For Telegram: Host this on a public server (ngrok, Railway, etc.)');
});

module.exports = app;