# CivicLedger — Public Accountability Layer for Civic Infrastructure

CivicLedger is a decentralized civic accountability platform designed to make public infrastructure issues transparent, verifiable, and immutable. Instead of relying on editable complaint portals, CivicLedger records every civic issue and action as a permanent, cryptographically verifiable event using blockchain and decentralized storage.

This project was developed as part of a Web3 civic-tech initiative focusing on transparency, governance, and community participation.

---

## 🚀 Project Overview

Traditional civic reporting systems rely on centralized databases where records can be modified, deleted, or hidden. CivicLedger introduces an **append-only accountability model**:

- Complaints become immutable public records
- Status updates are stored as new events instead of overwriting history
- Evidence cannot be silently removed
- Community members can support issues through transparent donations

The platform acts as a **public audit trail**, not just a complaint system.

---

## 🧠 Core Concept

Instead of asking:
> “What is the current status?”

CivicLedger answers:
> “What actually happened over time?”

Each action is recorded as a verifiable event.

---

## 🏗️ Architecture

### 1. Frontend
- Built with React
- MetaMask wallet integration
- User submission panel and admin action panel
- CID-based data rendering from IPFS

### 2. Smart Contract (Ethereum Sepolia)
- Stores complaint CID references
- Maintains immutable action history
- Tracks issue creation and status updates
- Supports donation-linked transparency

### 3. Decentralized Storage (IPFS via Pinata)
- Complaint JSON metadata
- Image evidence
- Status update records

### 4. Web3 Integration
- ethers.js for blockchain interaction
- MetaMask for identity and transaction signing

---

## ⚙️ How It Works (Flow)

1. User submits an issue with image and details.
2. Data is packaged into a JSON file.
3. JSON + image are uploaded to IPFS → CID generated.
4. CID is written to the blockchain smart contract.
5. Any future update creates a **new CID** (no edits).
6. Frontend fetches official issue history from blockchain → loads data from IPFS.

---

## 🔑 Key Features

- Immutable issue records
- Event-based status tracking
- Wallet-based identity
- Transparent community donation support
- Decentralized evidence persistence
- No centralized database dependency

---

## 🧪 Tech Stack

- **Frontend:** React, JavaScript
- **Blockchain:** Solidity, Ethereum Sepolia
- **Web3 Libraries:** ethers.js
- **Storage:** IPFS (Pinata)
- **Wallet:** MetaMask
- **Development Tools:** Remix IDE

---

## 📦 Smart Contract Summary

The CivicIssues contract:

- Creates new issues using CID references
- Stores reporter wallet address and timestamps
- Appends status updates as immutable entries
- Enables verifiable issue history retrieval

---

## 🛡️ Design Principles

- Append-only architecture (no silent edits)
- Minimal on-chain storage (CID-only model)
- Proof over trust
- Transparency by design
- Community-driven accountability

---

## 💡 Innovation Highlights

- Converts civic issues into publicly auditable events
- Eliminates hidden status modifications
- Links funding directly to visible outcomes
- Ensures evidence persistence through decentralized storage

---

## 📈 Future Improvements

- Role-based authority permissions
- On-chain donation smart contract module
- AI-assisted image validation
- Advanced analytics dashboard
- Multi-network deployment

---

## 👥 Team

Developed as a collaborative Web3 civic-tech project focused on governance innovation and transparent public infrastructure tracking.

---

## 📜 License

This project is released for educational and research purposes.

---

## ✅ Project Status

**Completed — End-to-end flow operational**

- Frontend integrated with MetaMask ✔
- IPFS uploads functional ✔
- Smart contract deployed on Sepolia ✔
- Immutable issue tracking implemented ✔
- Status history append logic working ✔

---

> CivicLedger transforms civic reporting into a permanent, verifiable public record — where accountability is enforced by architecture, not authority.
