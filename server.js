require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: process.env.ORIGIN
}));
app.use(express.json());

// Add a health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Faucet server is running" });
});

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const faucetContract = new ethers.Contract(
  process.env.FAUCET_CONTRACT,
  ["function requestFunds(address _recipient) external"],
  wallet
);

app.post("/faucet", async (req, res) => {
  try {
    const { userAddress } = req.body;
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Invalid address" });
    }
    
    try {
      const tx = await faucetContract.requestFunds(userAddress);
      res.json({ txHash: tx.hash, errorMessage: "Transaction successful" });
    } catch (contractError) {
      return res.status(400).json({ txHash: null,errorMessage: contractError.reason });
    }
  } catch (error) {
    res.status(500).json({txHash: null, errorMessage: error.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
