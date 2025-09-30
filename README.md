# SourWinners Telegram Mini App

A beautiful, addictive casino-style interface for the SourWinners lottery bot where users win 4x more often!

## 🎨 Features

### 🎰 Beautiful Casino Interface
- **Animated background** with floating particles
- **Colorful gradients** and casino-style colors
- **Live countdown timer** with rotating animations
- **Participant avatars** joining in real-time
- **Prize pool visualization** and statistics

### 🎮 Engaging User Experience
- **Live join notifications** - see others join
- **Winner celebrations** with confetti animations
- **Toast notifications** for all actions
- **Haptic feedback** on Telegram devices
- **Smooth animations** throughout the app

### 📊 Rich Dashboard
- **Real-time contest status** with color-coded phases
- **Personal statistics** - wins, earnings, win rate
- **Recent winners list** with animations
- **Wallet balance** and top-up functionality
- **Contest history** and sharing features

## 🚀 Quick Start

### 1. Local Development
```bash
# Install dependencies
npm install

# Start the server
npm start

# Access at http://localhost:3000
```

### 2. For Telegram Integration

#### Option A: Using ngrok (Quick Testing)
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose local server
ngrok http 3000

# Use the https URL for Telegram bot setup
```

#### Option B: Deploy to Railway (Production)
1. Push code to GitHub repository
2. Connect to Railway.app
3. Deploy automatically
4. Use the Railway URL for Telegram

#### Option C: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Use the Vercel URL for Telegram
```

### 3. Configure Your Telegram Bot

Add this to your Telegram bot to enable the Mini App:

```javascript
// In your bot code
bot.command('app', (ctx) => {
    const webAppUrl = 'https://your-domain.com'; // Your Mini App URL

    ctx.reply('🎰 Open SourWinners Casino!', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🎰 Play SourWinners',
                    web_app: { url: webAppUrl }
                }
            ]]
        }
    });
});

// Or set as menu button
bot.telegram.setChatMenuButton({
    menu_button: {
        type: 'web_app',
        text: '🎰 Play',
        web_app: { url: webAppUrl }
    }
});
```

### 4. Integration with Your Bot

The Mini App includes API endpoints that you can connect to your existing bot:

```javascript
// Example integration in your bot
app.post('/api/contest/join', (req, res) => {
    const { userId } = req.body;

    // Call your existing join logic
    const result = await joinUserToContest(userId);

    res.json({
        success: result.success,
        message: result.message,
        newBalance: result.newBalance
    });
});
```

## 🎨 Customization

### Colors & Themes
Edit `styles.css` to customize:
- **Background gradients** - Change the color schemes
- **Button colors** - Modify the gradient styles
- **Animation speeds** - Adjust timing in CSS animations
- **Layout** - Modify the responsive grid layouts

### Features
Edit `app.js` to add:
- **New animations** - Add more particle effects
- **Sound effects** - Integrate Web Audio API
- **More statistics** - Add charts and graphs
- **Social features** - Friend systems, leaderboards

## 📱 Mobile Optimization

The Mini App is fully optimized for mobile:
- **Responsive design** - Works on all screen sizes
- **Touch-friendly** - Large buttons and touch targets
- **Fast loading** - Optimized assets and animations
- **Native feel** - Follows Telegram design guidelines

## 🔧 API Integration

### Current Endpoints
- `GET /api/user/:userId` - Get user data
- `GET /api/contest/current` - Get current contest
- `POST /api/contest/join` - Join contest
- `POST /api/topup` - Top up balance
- `GET /api/winners/recent` - Recent winners

### WebSocket Support (Future)
Add real-time updates:
```javascript
// WebSocket connection for live updates
const ws = new WebSocket('wss://your-domain.com/ws');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateContestDisplay(data);
};
```

## 🎯 Performance

- **Lightweight** - ~100KB total size
- **Fast animations** - 60 FPS with CSS transforms
- **Efficient rendering** - Minimal DOM updates
- **Progressive loading** - Load critical content first

## 🛠️ Development

### File Structure
```
mini-app/
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── app.js              # JavaScript logic and API calls
├── server.js           # Express server for hosting
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

### Adding New Features
1. **UI Changes** - Modify `index.html` structure
2. **Styling** - Add CSS to `styles.css`
3. **Logic** - Add JavaScript to `app.js`
4. **API** - Add endpoints to `server.js`

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=https://your-api.com
```

### Optimization
- **Minify CSS/JS** - Use build tools for production
- **Compress assets** - Enable gzip compression
- **CDN** - Use CDN for static assets
- **Caching** - Add proper cache headers

## 🎊 Result

You now have a **stunning, addictive Mini App** that transforms your text-based lottery bot into a beautiful casino experience that users will love to play!

**Features Include:**
- 🎨 **Casino-style visuals** with animations
- ⏰ **Live countdown timers** with color changes
- 👥 **Real-time participant tracking**
- 🎉 **Winner celebrations** with confetti
- 📊 **Rich statistics** and history
- 🎯 **80% win rate** prominently displayed
- 📱 **Mobile-optimized** for all devices