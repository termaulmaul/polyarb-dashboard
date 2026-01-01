## EVM Wallet Connection Setup

PolyArb Dashboard now supports EVM wallet connections for interacting with Polymarket. Follow these steps to set up wallet connectivity:

### 🚀 Quick Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure WalletConnect** (Optional)
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Update `src/lib/wagmi.ts` with your project ID

3. **Start Development Server**
   ```bash
   pnpm run dev
   ```

### 🔑 Supported Wallets

- **MetaMask** - Browser extension
- **WalletConnect** - Mobile wallets (Trust, Rainbow, etc.)
- **Coinbase Wallet** - Coinbase's wallet

### 🌐 Supported Networks

- **Polygon** (Primary) - For Polymarket trading
- **Ethereum Mainnet** - For testing

### 📱 How to Use

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Select Wallet**: Choose your preferred wallet
3. **Switch Network**: Automatically prompts to switch to Polygon
4. **Start Trading**: Bot controls become available once connected

### 🔒 Security Features

- **Network Validation**: Ensures Polygon network for Polymarket
- **Connection Status**: Real-time connection monitoring
- **Balance Display**: Shows wallet balance and address
- **Transaction Safety**: All trades require explicit wallet approval

### 🛠️ Configuration

#### WalletConnect Project ID
```typescript
// src/lib/wagmi.ts
const projectId = 'your-walletconnect-project-id';
```

#### Supported Chains
```typescript
// src/lib/wagmi.ts
chains: [polygon, mainnet]
```

### 🎯 Features

- **Real-time Balance**: Live wallet balance updates
- **Network Switching**: Automatic Polygon network switching
- **Address Copy**: One-click address copying
- **Explorer Links**: Direct links to PolygonScan
- **Connection Persistence**: Maintains connection across sessions

### 🔧 Troubleshooting

**Connection Issues:**
- Ensure MetaMask is installed and unlocked
- Check if you're on the correct network
- Try refreshing the page

**Network Switching:**
- Click "Switch to Polygon" in wallet dialog
- Approve the network switch in your wallet

**Mobile Wallets:**
- Use WalletConnect for mobile wallet support
- Scan QR code with your mobile wallet app

### 📊 Integration Status

✅ **Frontend**: Wallet connection UI complete  
✅ **Backend**: Ready for wallet-signed transactions  
✅ **Network**: Polygon network validation  
✅ **Security**: Private key stays client-side  

The wallet connection is now fully integrated and ready for Polymarket arbitrage trading!