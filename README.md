# VotEth — Decentralized Voting DApp

<div align="center">

![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?logo=ethereum)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)

**Live Site:** [vot-eth.vercel.app](https://vot-eth.vercel.app)

A secure, time-bound Ethereum voting DApp with enhanced features including role-based access control, voter registration, analytics, multi-language support, and AI chatbot assistance.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Enhanced Smart Contract](#-enhanced-smart-contract)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [User Guides](#-user-guides)
- [Command Reference](#-command-reference)
- [Security](#-security)
- [Technology Stack](#-technology-stack)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

VotEth is a production-ready decentralized voting platform built on Ethereum's Sepolia testnet. It combines blockchain security with user-friendly features to provide a complete voting solution.

**What Makes VotEth Special:**
- ✅ **Enhanced Security**: OpenZeppelin-based smart contracts with role-based access control
- ✅ **User-Friendly**: Multi-language support (English, Hindi, Gujarati, Marathi)
- ✅ **Real-Time Analytics**: Live vote tracking with visual charts and statistics
- ✅ **AI Assistant**: Hybrid chatbot for instant help and support
- ✅ **Mobile-Ready**: QR code generation for easy mobile access
- ✅ **Transparent**: Complete audit trail with event logging
- ✅ **Flexible**: Pause/resume voting, voter registration, time extensions

---

## ✨ Key Features

### Core Voting System
- 🗳️ **Secure Voting**: One vote per wallet, blockchain-verified
- ⏱️ **Time-Bound**: Configurable voting periods with extension capability
- 🔒 **Tamper-Proof**: Immutable vote records on Ethereum
- 📊 **Real-Time Results**: Live vote counting and winner calculation

### Enhanced Features (2025)

#### 1. Role-Based Access Control 👥
- Multiple admin roles (Admin, Election Manager)
- Granular permission system
- Multi-signature support ready

#### 2. Voter Registration System 📝
- Optional whitelist-based eligibility
- Batch voter registration
- Registration status tracking

#### 3. Emergency Controls 🛑
- Pause/unpause voting capability
- Admin-only emergency actions
- Reentrancy attack protection

#### 4. Analytics Dashboard 📊
- Live vote tracking charts
- Candidate leaderboards
- Turnout statistics
- CSV data export
- Auto-refresh (10s intervals)

#### 5. Multi-Language Support 🌐
- English, Hindi, Gujarati, Marathi
- Auto-detection of browser language
- Persistent language preference

#### 6. QR Code Generator 📱
- One-click QR generation
- Download as PNG
- URL copy feature
- Easy mobile access

#### 7. AI Chatbot Assistant 🤖
- 30+ pre-loaded Q&A responses
- Quick action buttons
- Smart keyword matching
- Optional AI mode (OpenAI/Gemini)

#### 8. Previous Elections Access 🗂️
- Load any past election
- Up to 20 elections in history
- LocalStorage-based management

---

## 🔐 Enhanced Smart Contract

**Contract Address:** `0xE0ffB2760074ea10861d50e2E620230690a60737` (Latest)  
**Network:** Sepolia Testnet  
**Compiler:** Solidity 0.8.20  
**Security:** OpenZeppelin v5.4.0

### New Contract Capabilities

```solidity
// Role-based access control
ADMIN_ROLE - Full administrative control
ELECTION_MANAGER_ROLE - Manage elections and voters

// Voter registration
function registerVoter(address voter)
function registerVotersBatch(address[] voters)
function unregisterVoter(address voter)

// Emergency controls
function pauseVoting()
function unpauseVoting()

// Time management
function extendVoting(uint256 additionalMinutes)
function updateVotingPeriod(uint256 start, uint256 end)

// Enhanced view functions
function getTotalVotes() returns (uint256)
function getWinningCandidate() returns (string, uint256)
function hasVoted(address voter) returns (bool)
function getCandidateCount() returns (uint256)
```

### Security Features
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Pausable**: Emergency stop mechanism
- ✅ **AccessControl**: OpenZeppelin role system
- ✅ **Event Logging**: Complete audit trail
- ✅ **Gas Optimized**: Efficient code for lower transaction costs

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 20+ (currently using v20.12.2)
MetaMask browser extension
Sepolia testnet ETH (from faucet)
```

### Installation

```bash
# Clone repository
git clone https://github.com/Mhrsh0129/voting-dapp-sepolia.git
cd voting-dapp-sepolia

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API_URL and PRIVATE_KEY
```

### Automated Startup (Recommended)

```powershell
# One command to rule them all
npm start
```

This automatically:
1. ✅ Compiles smart contracts
2. ✅ Deploys to Sepolia network
3. ✅ Updates contract addresses everywhere
4. ✅ Logs deployment to file
5. ✅ Starts Express server
6. ✅ Opens browser at localhost:3000

**Alternative methods:**
```powershell
.\start.bat       # Windows batch file
.\start.ps1       # PowerShell script
node start.js     # Node.js orchestrator
```

### Manual Steps

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npm run deploy

# Start server
npm run server
```

---

## 📁 Project Structure

```
voting-dapp-sepolia/
├── index.html                          # Main voting page
├── ListVoters.html                     # Results page
├── analytics.html                      # Analytics dashboard
├── main.js                             # Frontend logic
├── index.js                            # Express server
│
├── contracts/
│   └── Voting.sol                      # Enhanced smart contract
│
├── js/
│   ├── analytics.js                    # Analytics dashboard
│   ├── chatbot.js                      # Chatbot logic
│   ├── qr-manager.js                   # QR code generation
│   ├── theme.js                        # Theme switching
│   └── contract-abi.json               # Contract ABI
│
├── locales/
│   ├── en/translation.json             # English
│   ├── hi/translation.json             # Hindi
│   ├── gu/translation.json             # Gujarati
│   └── mr/translation.json             # Marathi
│
├── data/
│   └── chatbot-qa.json                 # Chatbot knowledge base
│
├── scripts/
│   ├── deploy-and-update.js            # Automated deployment
│   ├── manage-addresses.js             # Address management
│   ├── save-results.js                 # Results export
│   └── generate-qr.js                  # QR generation
│
├── start.bat | start.ps1 | start.js    # Startup scripts
├── contract-addresses.txt              # Deployment log
├── hardhat.config.js                   # Hardhat config
└── package.json                        # Dependencies
```

---

## 👥 User Guides

### For Voters

1. **Connect Wallet**
   - Click "Connect MetaMask"
   - Switch to Sepolia network
   - Approve connection

2. **Cast Your Vote**
   - Review candidates
   - Click "Vote" on your choice
   - Confirm transaction in MetaMask
   - Wait for confirmation

3. **View Results**
   - Navigate to Results page
   - See real-time vote counts
   - Check analytics dashboard

4. **Get Help**
   - Click chatbot bubble (bottom-right)
   - Ask questions or use quick actions
   - Switch language if needed

### For Administrators

1. **Deploy New Election**
   ```bash
   npm start
   # Follow prompts to set candidates and duration
   ```

2. **Manage Voters** (if registration enabled)
   ```javascript
   // Register voters
   await contract.registerVotersBatch([
     "0xAddress1", "0xAddress2", "0xAddress3"
   ]);
   ```

3. **Emergency Actions**
   ```javascript
   // Pause voting if needed
   await contract.pauseVoting();
   
   // Resume when ready
   await contract.unpauseVoting();
   ```

4. **Extend Voting Time**
   ```javascript
   // Add 30 more minutes
   await contract.extendVoting(30);
   ```

5. **Export Results**
   ```bash
   npm run results:save
   ```

---

## 💻 Command Reference

### Deployment & Server
```bash
npm start                       # Auto-deploy + start server
npm run deploy                  # Deploy contract only
npm run server                  # Start server only
```

### Contract Address Management
```bash
npm run addresses               # List all addresses
npm run addresses:latest        # Show latest address
npm run addresses:list          # Full deployment details
npm run addresses:export        # Export to JSON
```

### Results Management
```bash
npm run results:save            # Save latest election results
npm run results:save:addr       # Save specific election
```

### QR Code Generation
```bash
npm run qr:generate             # Generate QR code via CLI
```

### Development
```bash
npx hardhat compile             # Compile contracts
npx hardhat clean               # Clean artifacts
npx hardhat test                # Run tests
npx hardhat console             # Interactive console
```

---

## 🔒 Security

### Implemented Security Measures

1. **Smart Contract Security**
   - OpenZeppelin audited libraries
   - ReentrancyGuard protection
   - Role-based access control
   - Pausable functionality
   - Event logging for transparency

2. **Frontend Security**
   - Subresource Integrity (SRI) hashes on all CDN scripts
   - CORS protection via crossorigin attributes
   - Environment variable protection
   - No private keys in code

3. **Dependency Security**
   - Regular npm audit checks
   - Updated to latest stable versions
   - Zero critical/high vulnerabilities
   - Monthly security reviews

4. **Network Security**
   - Sepolia testnet only
   - Rate limiting (100 req/15min)
   - .env file in .gitignore

### Security Status (Dec 2025)
```
✅ 0 critical vulnerabilities
✅ 0 high vulnerabilities
✅ 0 medium vulnerabilities
⚠️  13 low vulnerabilities (dev dependencies only)

Production: SECURE ✅
```

### Best Practices

- ❌ Never commit `.env` or private keys
- ✅ Verify network before transactions
- ✅ Use hardware wallet for production
- ✅ Audit smart contracts before mainnet
- ✅ Keep dependencies updated
- ✅ Enable 2FA on all accounts

---

## 🛠️ Technology Stack

### Blockchain
- **Ethereum**: Sepolia Testnet
- **Solidity**: 0.8.20
- **Hardhat**: 2.22.17
- **Ethers.js**: 5.8.0
- **OpenZeppelin**: 5.4.0

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript**: ES6+
- **Chart.js**: 4.4.1 (Analytics)
- **i18next**: 25.6.2 (Multi-language)
- **QRCode.js**: 1.5.4

### Backend
- **Node.js**: 20.12.2
- **Express.js**: 4.21.1
- **dotenv**: 16.4.5

### Development
- **Git**: Version control
- **Vercel**: Auto-deployment
- **npm**: Package management

---

## 📊 Analytics & Monitoring

### Real-Time Metrics
- Total votes cast
- Voter turnout percentage
- Leading candidate
- Vote distribution charts
- Candidate rankings

### Export Options
- CSV data export
- Chart image downloads
- JSON contract address export
- Results logging to file

### Auto-Refresh
- Analytics: 10-second intervals
- Results page: 5-second intervals
- Voting status: Real-time

---

## 🌍 Accessibility & i18n

### Supported Languages
- 🇬🇧 English
- 🇮🇳 Hindi (हिन्दी)
- 🇮🇳 Gujarati (ગુજરાતી)
- 🇮🇳 Marathi (मराठी)

### Accessibility Features
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast modes
- Responsive design

---

## 🔄 Continuous Integration

### GitHub Integration
- Auto-commit on deployment
- Version tracking
- Issue templates
- PR automation

### Vercel Integration
- Auto-deploy on push
- Preview deployments
- Production builds
- HTTPS by default

---

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

### Development Standards
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic

---

## 📄 License

This project is licensed under the **MIT License**.

**You can:**
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Use privately
- ✅ Sublicense

**You must:**
- 📋 Include original license
- 📋 Include copyright notice

See `LICENSE` file for full terms.

---

## 📞 Support & Contact

- **GitHub**: [@Mhrsh0129](https://github.com/Mhrsh0129)
- **Repository**: [voting-dapp-sepolia](https://github.com/Mhrsh0129/voting-dapp-sepolia)
- **Issues**: [Open an Issue](https://github.com/Mhrsh0129/voting-dapp-sepolia/issues)
- **Live Site**: [vot-eth.vercel.app](https://vot-eth.vercel.app)

---

## 🙏 Acknowledgments

### Technologies
- Ethereum Foundation
- OpenZeppelin
- Hardhat Team
- MetaMask
- Vercel

### Libraries
- Chart.js
- i18next
- QRCode.js
- Express.js

---

## 📈 Project Stats

- **Contract Address**: `0xE0ffB2760074ea10861d50e2E620230690a60737`
- **Network**: Sepolia Testnet
- **Version**: 2.0.0 (Enhanced Edition)
- **Last Updated**: December 2025
- **Status**: ✅ Production Ready

---

<div align="center">

**Built with ❤️ by VotEth Team**

⭐ Star us on GitHub if you find this helpful!

</div>
