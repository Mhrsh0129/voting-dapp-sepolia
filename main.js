let WALLET_CONNECTED = "";
let contractAddress = "0x61F1d0760aeABB09BFdCF2594ed515725589e73e"; // Enhanced contract with new features
window.contractAddress = contractAddress; // Expose to window for QR manager
let currentElectionName = "Current Election"; // Track which election we're viewing
let configLoaded = false; // Track if config has been loaded
let provider = null; // Current provider
let walletType = ""; // Track wallet type

// Event handler references for cleanup
let accountsChangedHandler = null;
let chainChangedHandler = null;
let connectHandler = null;
let disconnectHandler = null;

// ========================================
// THEME SWITCHING FUNCTIONALITY
// ========================================
function toggleTheme() {
  const body = document.body;
  
  body.classList.toggle('light-theme');
  
  // Save preference
  if (body.classList.contains('light-theme')) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme preference on page load
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  const body = document.body;
  
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
  } else {
    // Dark theme (default or explicitly saved)
    body.classList.remove('light-theme');
  }
}

// Load theme as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSavedTheme);
} else {
  loadSavedTheme();
}

// Load contract address from config.json
async function loadConfig() {
  try {
    // Add cache-busting timestamp to prevent browser caching
    const cacheBuster = new Date().getTime();
    const response = await fetch(`/config.json?v=${cacheBuster}`);
    const config = await response.json();
    contractAddress = config.contractAddress;
    window.contractAddress = contractAddress; // Expose to window
    configLoaded = true;
    console.log("✅ Loaded contract address from config:", contractAddress);
    console.log("📅 Config last updated:", config.lastUpdated);
    
    // Update contract address display if element exists
    const fullEl = document.getElementById("fullContractAddress");
    if (fullEl) fullEl.textContent = contractAddress;
    
    return config;
  } catch (error) {
    console.warn("⚠️ Failed to load config.json, using fallback address:", error);
    configLoaded = true; // Mark as loaded even if failed, to not block operations
    return null;
  }
}

// Initialize app - load config then update UI
async function initializeApp() {
  await loadConfig();
}
// Call initialization on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Network configuration
const SEPOLIA_CHAIN_ID = 11155111; // Sepolia testnet
const NETWORK_NAME = "Sepolia";

// Check if user is on correct network
const checkNetwork = async() => {
  try {
    if (!window.ethereum && !provider) {
      return false;
    }
    const ethersProvider = provider ? new ethers.providers.Web3Provider(provider) : new ethers.providers.Web3Provider(window.ethereum);
    const network = await ethersProvider.getNetwork();
    
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      alert(`⚠️ Wrong Network!\n\nPlease switch to ${NETWORK_NAME} testnet in MetaMask.\n\nCurrent: ${network.name}\nRequired: ${NETWORK_NAME}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Network check failed:", err);
    return false;
  }
};

let contractAbi = [
    {
      "inputs": [
        {
          "internalType": "string[]",
          "name": "_candidateNames",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "_durationInMinutes",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        }
      ],
      "name": "addCandidate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "candidates",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "voteCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllVotesOfCandidates",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "voteCount",
              "type": "uint256"
            }
          ],
          "internalType": "struct Voting.Candidate[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRemainingTime",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVotingStatus",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_candidateIndex",
          "type": "uint256"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "voters",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingEnd",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingStart",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

// Load saved elections from localStorage
const getSavedElections = () => {
  const saved = localStorage.getItem('savedElections');
  return saved ? JSON.parse(saved) : [];
};

// Save election to localStorage
const saveElection = (address, name) => {
  const elections = getSavedElections();
  // Check if already exists
  const exists = elections.find(e => e.address.toLowerCase() === address.toLowerCase());
  if (!exists) {
    elections.unshift({ address, name, timestamp: Date.now() });
    // Keep only last 20 elections
    if (elections.length > 20) elections.pop();
    localStorage.setItem('savedElections', JSON.stringify(elections));
  }
};

// Switch to a different contract address
const switchContract = async(newAddress, electionName = "Previous Election") => {
  if (!ethers.utils.isAddress(newAddress)) {
    alert("Invalid contract address!");
    return;
  }
  
  contractAddress = newAddress;
  window.contractAddress = newAddress; // Expose to window
  currentElectionName = electionName;
  
  // Save to history
  saveElection(newAddress, electionName);
  
  // Update UI to show which election
  updateElectionDisplay();
  
  // Refresh data if wallet is connected
  if (WALLET_CONNECTED) {
    try {
      const basicTable = document.getElementById("candidatesTable");
      if (basicTable) {
        await getCandidateNames();
        await voteStatus();
      } else {
        const resultsTableContainer = document.getElementById("resultsTableContainer");
        if (resultsTableContainer) {
          await checkAndDisplayResults();
        }
      }
    } catch (err) {
      console.error("Failed to load data for this contract:", err);
      alert("Failed to load election data. Make sure this is a valid Voting contract.");
    }
  }
};

// Update UI to show current election
const updateElectionDisplay = () => {
  const electionDisplay = document.getElementById("currentElectionDisplay");
  if (electionDisplay) {
    electionDisplay.innerHTML = `
      <strong>${currentElectionName}</strong><br>
      <small>Contract: ${contractAddress.substring(0, 6)}...${contractAddress.substring(38)}</small>
    `;
    // If a dedicated full-address element exists (homepage), populate it as well
    const fullEl = document.getElementById('contractFullAddress');
    if (fullEl) fullEl.textContent = contractAddress;
  }
};

// Show saved elections modal
const showElectionsHistory = () => {
  const elections = getSavedElections();
  const modal = document.getElementById("electionsModal");
  const list = document.getElementById("electionsList");
  
  list.innerHTML = '';
  
  if (elections.length === 0) {
    list.innerHTML = '<p style="text-align: center; padding: 20px;">No saved elections yet.</p>';
  } else {
    elections.forEach((election, index) => {
      const item = document.createElement('div');
      item.className = 'election-item';
      const date = new Date(election.timestamp).toLocaleString();
      item.innerHTML = `
        <div>
          <strong>${election.name}</strong><br>
          <small>${election.address}</small><br>
          <small style="color: #999;">Added: ${date}</small>
        </div>
        <button onclick="loadElection('${election.address}', '${election.name}')" class="load-btn">Load</button>
      `;
      list.appendChild(item);
    });
  }
  
  modal.style.display = "block";
};

// Load a specific election
const loadElection = async(address, name) => {
  document.getElementById("electionsModal").style.display = "none";
  await switchContract(address, name);
  alert(`Switched to: ${name}`);
};

// Close modal
const closeModal = () => {
  document.getElementById("electionsModal").style.display = "none";
};

// Manual switch from input field
const switchContractManual = async() => {
  const input = document.getElementById("contractAddressInput");
  const address = input.value.trim();
  
  if (!address) {
    alert("❌ Please enter a contract address!");
    return;
  }
  
  // Validate Ethereum address format
  if (!ethers.utils.isAddress(address)) {
    alert("❌ Invalid Ethereum address format!\n\nPlease enter a valid address starting with '0x' followed by 40 hexadecimal characters.");
    return;
  }
  
  // Check if it's a contract (has code)
  try {
    if (!window.ethereum && !provider) {
      alert("⚠️ Please install a Web3 wallet to validate contract addresses.");
      return;
    }
    const ethersProvider = provider ? new ethers.providers.Web3Provider(provider) : new ethers.providers.Web3Provider(window.ethereum);
    const code = await ethersProvider.getCode(address);
    
    if (code === '0x') {
      alert("⚠️ This address has no contract code!\n\nPlease make sure you're using a deployed Voting contract address.");
      return;
    }
  } catch (err) {
    console.error("Contract validation error:", err);
    alert("⚠️ Could not verify contract. Proceeding anyway...");
  }
  
  const name = prompt("Enter a name for this election (optional):", "Previous Election");
  await switchContract(address, name || "Previous Election");
  input.value = ""; // Clear input
};

// Make function globally accessible for HTML onclick handlers
window.connectMetamask = async() => {
  try {
    // Wait a moment for providers to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check multiple provider locations for Phantom
    let ethereumProvider = null;
    
    // Priority 1: Check window.phantom.ethereum (Phantom's Ethereum provider)
    if (window.phantom?.ethereum) {
      ethereumProvider = window.phantom.ethereum;
      console.log("Found Phantom Ethereum provider");
    }
    // Priority 2: Check standard window.ethereum
    else if (window.ethereum) {
      ethereumProvider = window.ethereum;
      console.log("Found standard Ethereum provider");
    }
    // Priority 3: Check if Phantom Solana is available (guide user)
    else if (window.phantom?.solana) {
      alert("❌ Phantom detected, but Ethereum is not active!\n\nSteps to fix:\n1. Make sure Ethereum toggle is ON in Phantom settings\n2. Close and re-open your browser completely\n3. Come back to this page\n\nIf problem persists, try MetaMask instead.");
      return;
    }
    // No provider found
    else {
      alert("❌ No Ethereum wallet detected!\n\nPlease install one of these:\n• MetaMask (metamask.io) - Recommended\n• Phantom (phantom.app)\n• Coinbase Wallet\n• Brave Browser Wallet\n\nAfter installing, refresh this page.");
      return;
    }

    // Use the detected provider
    provider = ethereumProvider;
    
    // Detect wallet type
    if (window.phantom?.ethereum && provider === window.phantom.ethereum) {
      walletType = "Phantom";
    } else if (provider.isPhantom) {
      walletType = "Phantom";
    } else if (provider.isMetaMask && !provider.isPhantom) {
      walletType = "MetaMask";
    } else if (provider.isCoinbaseWallet) {
      walletType = "Coinbase Wallet";
    } else if (provider.isBraveWallet) {
      walletType = "Brave Wallet";
    } else if (provider.isTrust) {
      walletType = "Trust Wallet";
    } else {
      walletType = "Web3 Wallet";
    }

    console.log(`Attempting to connect with ${walletType}...`);

    // Request account access
    await provider.request({ method: 'eth_requestAccounts' });

    // Create ethers provider
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    
    // Check network
    const network = await ethersProvider.getNetwork();
    if (network.chainId !== 11155111) {
      alert(`⚠️ Wrong Network!\n\nPlease switch to Sepolia testnet in your wallet.\n\nCurrent: ${network.name}\nRequired: Sepolia`);
      
      // Try to switch network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
        });
      } catch (switchError) {
        console.error("Failed to switch network:", switchError);
        return;
      }
    }
    
    // Get signer and address
    const signer = ethersProvider.getSigner();
    WALLET_CONNECTED = await signer.getAddress();
    window.userAddress = WALLET_CONNECTED; // Expose for Face Verification
    
    console.log(`✅ Connected with ${walletType}:`, WALLET_CONNECTED);
    
    // Update UI notification
    updateWalletConnectionUI();
    
    // Update election display on connect
    updateElectionDisplay();

    // Auto-refresh candidates list on pages that have the table
    try {
      const basicTable = document.getElementById("candidatesTable");
      if (basicTable) {
        await getCandidateNames();
        await updateCandidatePreviewCards(); // Update preview cards
        // Start auto-updating voting status on homepage
        startVotingStatusUpdates();
      } else {
        const resultsTableContainer = document.getElementById("resultsTableContainer");
        if (resultsTableContainer) {
          await checkAndDisplayResults();
          startResultsUpdates();
        }
      }
    } catch (err) {
      console.error("Failed to auto-load candidates:", err);
    }

    // Define event handlers for proper cleanup
    accountsChangedHandler = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        window.location.reload();
      }
    };

    chainChangedHandler = (chainId) => {
      window.location.reload();
    };

    connectHandler = (info) => {
      console.log("Provider connected:", info);
    };

    disconnectHandler = (error) => {
      console.log("Provider disconnected:", error);
      disconnectWallet();
    };

    // Subscribe to provider events
    provider.on("accountsChanged", accountsChangedHandler);
    provider.on("chainChanged", chainChangedHandler);
    provider.on("connect", connectHandler);
    provider.on("disconnect", disconnectHandler);

  } catch (error) {
    console.error("Wallet connection error:", error);
    if (error.message) {
      alert(`❌ Connection failed: ${error.message}`);
    }
  }
}

// New function to disconnect wallet
window.disconnectWallet = async() => {
  try {
    // Remove event listeners to prevent memory leaks
    if (provider) {
      if (accountsChangedHandler) {
        provider.removeListener("accountsChanged", accountsChangedHandler);
      }
      if (chainChangedHandler) {
        provider.removeListener("chainChanged", chainChangedHandler);
      }
      if (connectHandler) {
        provider.removeListener("connect", connectHandler);
      }
      if (disconnectHandler) {
        provider.removeListener("disconnect", disconnectHandler);
      }
    }

    // Reset all state
    provider = null;
    WALLET_CONNECTED = "";
    walletType = "";
    accountsChangedHandler = null;
    chainChangedHandler = null;
    connectHandler = null;
    disconnectHandler = null;

    updateWalletConnectionUI();
    console.log("🔌 Wallet disconnected and event listeners cleaned up");
  } catch (error) {
    console.error("Error during wallet disconnect:", error);
  }
}

// Centralized UI update for wallet connection
const updateWalletConnectionUI = () => {
  const element = document.getElementById("metamasknotification");
  if (element) {
    if (WALLET_CONNECTED) {
      const truncated = WALLET_CONNECTED.substring(0, 6) + "..." + WALLET_CONNECTED.substring(38);
      const walletName = walletType || "Wallet";
      element.textContent = `${walletName} connected: ${truncated}`;
      element.style.color = "#00FF00";
    } else {
      element.textContent = "";
    }
  }
};

// Update candidate preview cards with live data
window.updateCandidatePreviewCards = async() => {
  const grid = document.getElementById('candidatesPreviewGrid');
  if (!grid) return;

  if (!WALLET_CONNECTED || !provider) {
    // Show placeholder card when wallet not connected
    grid.innerHTML = `
      <div class="candidate-card" style="opacity: 0.6;">
        <div class="candidate-avatar">🗳️</div>
        <div class="candidate-name" data-i18n="candidates.connectWallet">Connect Wallet</div>
        <div class="candidate-index" data-i18n="candidates.toView">to view candidates</div>
        <div class="vote-count">--</div>
        <div class="vote-progress">
          <div class="vote-progress-bar" style="width: 0%;"></div>
        </div>
        <div class="vote-percentage">0%</div>
      </div>
    `;
    return;
  }

  try {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    
    const candidates = await contractInstance.getAllVotesOfCandidates();
    const totalVotes = candidates.reduce((sum, c) => sum + parseInt(c.voteCount.toString()), 0);
    
    // Update stats
    document.getElementById('totalVotesCount').textContent = totalVotes;
    document.getElementById('candidateCount').textContent = candidates.length;
    
    // Calculate participation (assuming 100 max voters for demo)
    const participationRate = Math.min(100, Math.floor((totalVotes / 100) * 100));
    document.getElementById('participationRate').textContent = participationRate + '%';
    
    // Candidate emojis for visual appeal
    const candidateEmojis = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '⚫'];
    
    // Generate cards
    grid.innerHTML = candidates.map((candidate, index) => {
      const voteCount = parseInt(candidate.voteCount.toString());
      const percentage = totalVotes > 0 ? Math.floor((voteCount / totalVotes) * 100) : 0;
      const emoji = candidateEmojis[index % candidateEmojis.length];
      
      return `
        <div class="candidate-card">
          <div class="candidate-avatar">${emoji}</div>
          <div class="candidate-name">${candidate.name}</div>
          <div class="candidate-index">Index: ${index}</div>
          <div class="vote-count">${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}</div>
          <div class="vote-progress">
            <div class="vote-progress-bar" style="width: ${percentage}%;"></div>
          </div>
          <div class="vote-percentage">${percentage}%</div>
        </div>
      `;
    }).join('');
    
    // Update contract info
    const shortAddress = contractAddress.slice(0, 6) + '...' + contractAddress.slice(-4);
    document.getElementById('contractShort').textContent = shortAddress;
    document.getElementById('etherscanLink').href = `https://sepolia.etherscan.io/address/${contractAddress}`;
    
    // Update election name
    document.getElementById('electionNameInfo').textContent = currentElectionName || 'Current Election';
    
  } catch (error) {
    console.error('Error updating preview cards:', error);
  }
};

// Update time remaining in info panel
window.updateTimeRemaining = () => {
  const timeElement = document.getElementById('time');
  const infoTimeElement = document.getElementById('timeRemainingInfo');
  
  if (timeElement && timeElement.textContent) {
    const timeText = timeElement.textContent.replace('Remaining time is ', '').replace(' seconds', 's');
    if (infoTimeElement && timeText !== '') {
      infoTimeElement.textContent = timeText;
    }
  }
};

// Make globally accessible for HTML onclick
window.getCandidateNames = async() => {
  var p3 = document.getElementById("p3");
  
  // Check if wallet is connected first
  if(!WALLET_CONNECTED || WALLET_CONNECTED === "" || !provider) {
    p3.innerHTML = "⚠️ Please connect your wallet first to view candidates";
    p3.className = "warning-text";
    p3.style.color = "orange";
    return;
  }
  
  // Wait for config to load
  if (!configLoaded) {
    await loadConfig();
  }
  
  if(WALLET_CONNECTED && WALLET_CONNECTED !== "") {
    try {
      p3.innerHTML = '⏳ Loading candidates<span class="spinner"></span>';
      p3.className = "loading-text";
      
      // Use the connected provider instead of creating a new one
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      
      var candidates = await contractInstance.getAllVotesOfCandidates();
      var table = document.getElementById("candidatesTable");

      if (!table) {
        p3.innerHTML = "❌ Candidates table not found on this page.";
        p3.style.color = "red";
        return;
      }

      // Clear existing rows (except header)
      var rowCount = table.rows.length;
      for (var i = rowCount - 1; i > 0; i--) {
        table.deleteRow(i);
      }

      for (let i = 0; i < candidates.length; i++) {
        var row = table.insertRow();
        var idCell = row.insertCell();
        var nameCell = row.insertCell();

        idCell.innerHTML = i;
        nameCell.innerHTML = candidates[i].name;
      }

      p3.innerHTML = "✅ Candidates loaded successfully";
      p3.className = "success-text";
    } catch (err) {
      console.error("Error loading candidates:", err);
      p3.innerHTML = "❌ Failed to load candidates. Please refresh the page.";
      p3.className = "error-text";
    }
  }
  else {
    if (p3 && !p3.innerHTML) {
      p3.innerHTML = "⚠️ Connect MetaMask to view candidates";
      p3.style.color = "orange";
    }
  }
}

// Make globally accessible for HTML onclick
window.addVote = async() => {
    // Face Verification Check
    if (window.checkFaceVerification && !window.checkFaceVerification()) {
        const cand = document.getElementById("cand");
        cand.innerHTML = "🔐 Please complete face verification before voting!";
        cand.style.color = "#FFD700";
        cand.className = "error-text";
        
        // Scroll to face verification section if it exists
        const faceSection = document.getElementById('faceVerificationSection');
        if (faceSection) {
            faceSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Wait for config to load
    if (!configLoaded) {
        await loadConfig();
    }
    
    if(WALLET_CONNECTED && WALLET_CONNECTED !== "") {
        var candidateIndexInput = document.getElementById("vote");
        var cand = document.getElementById("cand");
        
        // Input validation
        const indexValue = candidateIndexInput.value.trim();
        
        if (indexValue === "") {
            cand.innerHTML = "❌ Please enter a candidate number";
            cand.style.color = "red";
            return;
        }
        
        const candidateIndex = parseInt(indexValue);
        
        if (isNaN(candidateIndex)) {
            cand.innerHTML = "❌ Please enter a valid number";
            cand.style.color = "red";
            return;
        }
        
        if (candidateIndex < 0) {
            cand.innerHTML = "❌ Candidate number must be 0 or greater";
            cand.style.color = "red";
            return;
        }
        
        // Check network before voting
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
            cand.innerHTML = "❌ Please switch to Sepolia network";
            cand.style.color = "red";
            return;
        }
        
        try {
            // Use the connected provider instead of creating a new one
            const ethersProvider = new ethers.providers.Web3Provider(provider);
            const signer = ethersProvider.getSigner();
            const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
            
            cand.innerHTML = '⏳ Submitting vote<span class="spinner"></span>';
            cand.className = "loading-text";
            
            const tx = await contractInstance.vote(candidateIndex);
            
            cand.innerHTML = '⏳ Confirming transaction<span class="spinner"></span>';
            await tx.wait();
            
            cand.innerHTML = "✅ Vote successfully recorded!";
            cand.className = "success-text";
        } catch (err) {
            console.error("Voting error:", err);
            
            // Better error messages
            if (err.code === 4001) {
                cand.innerHTML = "❌ Transaction rejected by user";
            } else if (err.message.includes("already voted")) {
                cand.innerHTML = "❌ You have already voted!";
            } else if (err.message.includes("Voting is finished")) {
                cand.innerHTML = "❌ Voting period has ended";
            } else if (err.message.includes("Invalid candidate")) {
                cand.innerHTML = `❌ Invalid candidate number. Please choose 0-${await getMaxCandidateIndex()}`;
            } else {
                cand.innerHTML = "❌ Transaction failed. Please try again.";
            }
            cand.style.color = "red";
        }
    }
    else {
        var cand = document.getElementById("cand");
        if (cand) {
            cand.innerHTML = "❌ Please connect your wallet first";
            cand.style.color = "red";
        }
    }
}

let votingStatusInterval = null;
let resultsInterval = null;

const stopVotingStatusUpdates = () => {
  if (votingStatusInterval) {
    clearInterval(votingStatusInterval);
    votingStatusInterval = null;
  }
};

const stopResultsUpdates = () => {
  if (resultsInterval) {
    clearInterval(resultsInterval);
    resultsInterval = null;
  }
};

const startVotingStatusUpdates = async () => {
  // Clean any previous interval before starting a new one
  stopVotingStatusUpdates();

  // Update immediately with error isolation
  try {
    await voteStatus();
  } catch (err) {
    console.error('Initial voteStatus update failed:', err);
  }

  // Then update every 5 seconds with error isolation
  votingStatusInterval = setInterval(async () => {
    try {
      await voteStatus();
      updateTimeRemaining(); // Update info panel time
      await updateCandidatePreviewCards(); // Update preview cards
    } catch (err) {
      console.error('voteStatus interval update failed:', err);
    }
  }, 5000);
};

// Cleanup on navigation/unload/background
if (typeof window !== 'undefined') {
  // Consolidated cleanup handler for all intervals
  const cleanupAllIntervals = () => {
    stopVotingStatusUpdates();
    stopResultsUpdates();
  };
  
  window.addEventListener('beforeunload', cleanupAllIntervals);
  window.addEventListener('pagehide', cleanupAllIntervals);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden) {
        // Page moved to background — stop updates
        stopVotingStatusUpdates();
      } else {
        // Page returned to foreground — restart only on voting (homepage) where candidates table exists
        const basicTable = typeof document !== 'undefined' ? document.getElementById('candidatesTable') : null;
        if (basicTable) {
          startVotingStatusUpdates();
        }
        const resultsTableContainer = typeof document !== 'undefined' ? document.getElementById('resultsTableContainer') : null;
        if (resultsTableContainer) {
          startResultsUpdates();
        }
        // Refresh election display if present
        updateElectionDisplay();
      }
    } catch (err) {
      console.error('visibilitychange handler error:', err);
    }
  });
}

// Ensure the current election/contract is shown as soon as the page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    try { 
      updateElectionDisplay();
      
      // Auto-load candidates and status on homepage without requiring MetaMask first
      const basicTable = document.getElementById('candidatesTable');
      const statusEl = document.getElementById('status');
      
      if (basicTable && statusEl) {
        // Homepage detected - try to load data if user already connected before
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.request({ method: 'eth_accounts' })
            .then(async accounts => {
              if (accounts && accounts.length > 0) {
                // User is already connected - set global provider
                provider = window.ethereum;
                const ethersProvider = new ethers.providers.Web3Provider(provider);
                const signer = ethersProvider.getSigner();
                WALLET_CONNECTED = await signer.getAddress();
                
                // Use centralized UI update for consistency
                updateWalletConnectionUI();
                
                // Load data
                try {
                  await getCandidateNames();
                  await startVotingStatusUpdates();
                  console.log('Auto-connected to wallet:', WALLET_CONNECTED);
                } catch (err) {
                  console.error('Auto-load data failed:', err);
                }
              }
            })
            .catch(err => {
              console.log('No prior wallet connection:', err);
              // Optionally show a subtle hint to connect
              const notificationEl = document.getElementById('metamasknotification');
              if (notificationEl && !notificationEl.innerHTML) {
                notificationEl.innerHTML = 'Click "Connect Metamask" to get started';
              }
            });
        }
      }
    } catch (e) {
      console.error('Page load initialization error:', e);
    }
  });
}

const startResultsUpdates = async () => {
  // Clean previous interval
  stopResultsUpdates();

  try {
    await checkAndDisplayResults();
  } catch (err) {
    console.error('Initial results update failed:', err);
  }

  resultsInterval = setInterval(async () => {
    try {
      await checkAndDisplayResults();
    } catch (err) {
      console.error('Results interval update failed:', err);
    }
  }, 5000);
};

const checkAndDisplayResults = async() => {
    var p3 = document.getElementById("p3");
    
    // Check if wallet is connected
    if(!WALLET_CONNECTED || WALLET_CONNECTED === "" || !provider) {
        if (p3) {
            p3.innerHTML = "⚠️ Please connect your wallet to view results";
            p3.style.color = "orange";
        }
        return;
    }
    
    // Wait for config to load
    if (!configLoaded) {
        await loadConfig();
    }
    
    if(WALLET_CONNECTED && WALLET_CONNECTED !== "") {
        try {
            // Use the connected provider instead of creating a new one
            const ethersProvider = new ethers.providers.Web3Provider(provider);
            const signer = ethersProvider.getSigner();
            const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
            
            // Check voting status
            const currentStatus = await contractInstance.getVotingStatus();
            const votingOngoingMessage = document.getElementById("votingOngoingMessage");
            const resultsTableContainer = document.getElementById("resultsTableContainer");
            const showResultsBtn = document.getElementById("showResultsBtn");
            
            if (currentStatus) {
                // Voting is still ongoing
                votingOngoingMessage.classList.remove("hidden");
                resultsTableContainer.classList.add("hidden");
                if (p3) p3.innerHTML = "";
            } else {
                // Voting has ended, show results
                votingOngoingMessage.classList.add("hidden");
                resultsTableContainer.classList.remove("hidden");
                if (showResultsBtn) showResultsBtn.classList.add("hidden");
                await getAllCandidates();
            }
        } catch (err) {
            console.error("Error checking results:", err);
            if (p3) {
                p3.innerHTML = "❌ Failed to load results. Please refresh the page.";
                p3.style.color = "red";
            }
        }
    } else {
        if (p3) {
            p3.innerHTML = "⚠️ Please connect your wallet first";
            p3.style.color = "orange";
        }
    }
}

const voteStatus = async() => {
    // Check if wallet is connected
    if(!WALLET_CONNECTED || WALLET_CONNECTED === "" || !provider) {
        var status = document.getElementById("status");
        if (status && !status.innerHTML) {
            status.innerHTML = "Connect wallet to view voting status";
        }
        return;
    }
    
    // Wait for config to load
    if (!configLoaded) {
        await loadConfig();
    }
    
    if(WALLET_CONNECTED && WALLET_CONNECTED !== "") {
        var status = document.getElementById("status");
        var remainingTime = document.getElementById("time");
        
        // Use the connected provider instead of creating a new one
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const signer = ethersProvider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        const currentStatus = await contractInstance.getVotingStatus();
  const time = await contractInstance.getRemainingTime();
  console.log(time);
        status.innerHTML = currentStatus == 1 ? "Voting is currently open" : "Voting is finished";
  const seconds = Number(time.toString());
  remainingTime.innerHTML = `Remaining time is ${seconds} seconds`;
    }
    else {
        var status = document.getElementById("status");
        if (status && !status.innerHTML) {
            status.innerHTML = "Connect MetaMask to view voting status";
        }
    }
}

const getAllCandidates = async() => {
    // Check if wallet is connected
    if(!WALLET_CONNECTED || WALLET_CONNECTED === "" || !provider) {
        return;
    }
    
    // Wait for config to load
    if (!configLoaded) {
        await loadConfig();
    }
    
    if(WALLET_CONNECTED && WALLET_CONNECTED !== "") {
        var p3 = document.getElementById("p3");
        
        // Use the connected provider instead of creating a new one
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const signer = ethersProvider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
        p3.innerHTML = "Please wait, getting all the candidates from the voting smart contract";
        var candidates = await contractInstance.getAllVotesOfCandidates();
        console.log(candidates);
        var table = document.getElementById("myTable");

        // Clear existing rows (except header)
        var rowCount = table.rows.length;
        for (var i = rowCount - 1; i > 0; i--) {
            table.deleteRow(i);
        }

        for (let i = 0; i < candidates.length; i++) {
            var row = table.insertRow();
            var idCell = row.insertCell();
            var descCell = row.insertCell();
            var statusCell = row.insertCell();

            idCell.innerHTML = i;
            descCell.innerHTML = candidates[i].name;
            statusCell.innerHTML = candidates[i].voteCount.toString();
        }

        p3.innerHTML = "The tasks are updated"
    }
    else {
        var p3 = document.getElementById("p3");
        p3.innerHTML = "Please connect your wallet first";
    }
}
