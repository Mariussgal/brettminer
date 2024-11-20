import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import styled from "styled-components";
import BrettMinerABI from "./abis/BrettMinerABI.json";
import BrettMinerImage from './Design_sans_titre_30.png'; 
import './App.css';  // Assurez-vous que ce fichier est bien importé

// Adresse du contrat et du token Brett
const contractAddress = "0x2cF88805B665E2F14244065c8317eEa29967118A";
const brettTokenAddress = "0x532f27101965dd16442e59d40670faf5ebb142e4";

const Container = styled.div`
  font-family: Arial, sans-serif;
  padding: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const BOX = styled.section`
 
  
  text-align: left;
`;

const Section2 = styled.section`
  
  text-align: left;
`;

const LeftSection = styled.div`
  width: 50%;
  padding-right: 20px;
`;

const RightSection = styled.div`
  width: 50%;
  text-align: center;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #d35400;
  color: white;
`;

const Section = styled.section`
  margin: 18px 0;
  padding: 15px;
  border: 1px solid gray;
  text-align: left;
`;

const Button = styled.button`

  border: none;
  padding: 10px 20px;
  font-size: 16px;
  color: black;
  cursor: pointer;
  border-radius: 5px;
  margin: 5px;
`;

const Image = styled.img`
  width: 100%;
  border-radius: 10px;
`;

const ReferralSection = styled.div`
  margin-top: 20px;
  padding: 10px;
 
`;

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [marketPoints, setMarketPoints] = useState(0);
  const [myPoints, setMyPoints] = useState(0);
  const [myMiners, setMyMiners] = useState(0);
  const [claimPower, setClaimPower] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [tvl, setTVL] = useState({ eth: 0, usd: 0 });
  const [brettBalance, setBrettBalance] = useState(0);
  const [halvingPercentage, setHalvingPercentage] = useState(100);
  const [userReward, setUserReward] = useState(0);
  const [referral, setReferral] = useState("0x0000000000000000000000000000000000000000");
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        fetchBrettBalance(address);
        fetchReward();
        fetchContractData();
        fetchTVL();
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  };

  const initializeContract = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const brettMinerContract = new ethers.Contract(
          contractAddress,
          BrettMinerABI,
          signer
        );
        return brettMinerContract;
      } catch (err) {
        console.error("Error initializing contract:", err);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  };

  const fetchBrettBalance = async (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const brettTokenContract = new ethers.Contract(
      brettTokenAddress,
      [
        "function balanceOf(address account) external view returns (uint256)"
      ],
      provider
    );
    try {
      const balance = await brettTokenContract.balanceOf(address);
      setBrettBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error("Error fetching Brett balance:", err);
      setBrettBalance(0);
    }
  };

  const fetchReward = async () => {
    const brettMinerContract = await initializeContract();
    try {
      const myPoints = await brettMinerContract.getMyPoints();
      const reward = await brettMinerContract.calculatePointSell(myPoints);
      setUserReward(ethers.utils.formatEther(reward));
    } catch (err) {
      console.error("Error fetching reward:", err);
      setUserReward(0);
    }
  };

  const fetchContractData = async () => {
    const brettMinerContract = await initializeContract();
    try {
      const points = await brettMinerContract.getMyPoints();
      const miners = await brettMinerContract.getMyMiners();
      const marketPoints = await brettMinerContract.marketPoints();
      const claimPower = await brettMinerContract.getHalvingPercentage();
      setMyPoints(ethers.utils.formatEther(points));
      setMyMiners(miners.toString());
      setMarketPoints(marketPoints.toString());
      setClaimPower(ethers.utils.formatUnits(claimPower, 18));
    } catch (err) {
      console.error("Error fetching contract data:", err);
    }
  };

  const fetchTVL = async () => {
    const brettMinerContract = await initializeContract();
    try {
      const balance = await brettMinerContract.getBalance();
      const tokenPrice = await fetchTokenPrice();
      const tvlInEth = ethers.utils.formatEther(balance);
      setTVL({
        eth: tvlInEth,
        usd: (tvlInEth * tokenPrice).toFixed(2),
      });
    } catch (err) {
      console.error("Error fetching TVL:", err);
      setTVL({ eth: 0, usd: 0 });
    }
  };

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=based-brett&vs_currencies=usd"
      );
      const data = await response.json();
      return data["based-brett"].usd;
    } catch (err) {
      console.error("Error fetching token price:", err);
      return 0;
    }
  };

  const depositETH = async (amount) => {
    const brettMinerContract = await initializeContract();
    try {
      const tx = await brettMinerContract.depositETH(
        ethers.utils.parseEther(amount),
        "0x0000000000000000000000000000000000000000",
        { value: ethers.utils.parseEther(amount) }
      );
      await tx.wait();
      alert("Deposit ETH successful!");
      fetchTVL();
    } catch (err) {
      console.error("Error during ETH deposit:", err);
    }
  };

  const depositBrett = async (amount) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const brettTokenContract = new ethers.Contract(
      brettTokenAddress,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
      ],
      signer
    );
    const brettMinerContract = await initializeContract();

    try {
      const allowance = await brettTokenContract.allowance(
        walletAddress,
        contractAddress
      );
      const amountInWei = ethers.utils.parseUnits(amount, 18);

      if (allowance.lt(amountInWei)) {
        const approveTx = await brettTokenContract.approve(
          contractAddress,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
        alert("Approval successful!");
      }

      const depositTx = await brettMinerContract.depositBrett(
        amountInWei,
        "0x0000000000000000000000000000000000000000"
      );
      await depositTx.wait();
      alert("Deposit Brett successful!");
    } catch (err) {
      console.error("Error during Brett deposit:", err);
    }
  };

  const compound = async () => {
    const brettMinerContract = await initializeContract();
    try {
      const tx = await brettMinerContract.compound(
        "0x0000000000000000000000000000000000000000"
      );
      await tx.wait();
      alert("Compound successful!");
    } catch (err) {
      console.error("Error during compound:", err);
    }
  };

  const copyReferralLink = () => {
    if (walletAddress) {
      const referralLink = `${window.location.origin}/?ref=${walletAddress}`;
      navigator.clipboard.writeText(referralLink)
        .then(() => alert("Referral link copied to clipboard!"))
        .catch(() => alert("Failed to copy referral link."));
    } else {
      alert("Connect your wallet to generate a referral link.");
    }
  };

  const withdraw = async () => {
    const brettMinerContract = await initializeContract();
    try {
      const tx = await brettMinerContract.withdraw();
      await tx.wait();
      alert("Withdraw successful!");
    } catch (err) {
      console.error("Error during withdrawal:", err);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchReward();
      fetchContractData();
      fetchTVL();
      fetchBrettBalance(walletAddress);
    }
  }, [walletAddress, myPoints]);

  return (
    <Container className="Container">
      <LeftSection className="LeftSection">

        <BOX>
        <div style={{ display: 'flex',  justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '45px' }}>BRETT MINER</h1>
          <Button onClick={connectWallet}>
            {walletAddress ? `Wallet: ${walletAddress}` : "Connect Wallet"}
          </Button>
        </div>
        </BOX>

        <Section2>
          <hr></hr>
          <p>The $BRETT reward pool with the richest daily return and lowest dev fee, daily income up to 8% and a referal bonus up to 12%</p>
          <p><u><strong>#1 - BUY FARMERS :</strong></u> Start by using your $BRETT or $ETH topurchase miners</p>
          <p><u><strong>#2 - COMPOUND:</strong></u> To maximize your earnings, click on the "COMPOUND" button. this action will automatically reinvest your rewards back into farmers</p>
          <p><u><strong>#3 - CLAIM REWARDS:</strong></u> This will transfer your accumulated $BRETT rewards directly into your wallet</p>
        </Section2>

        <Section2>
        
        <h1><u><strong>REWARDS</strong></u></h1>
        
        <p>The key to maximizing your rewards lies in the quantity of brett you hold 
          and how frequently you compound them. The more miner you accumulate and the more often you reinvest your rewards. the greater the potential for earning more rewards</p> 
        </Section2>

        {/* 
        <Section>
          <h2>Wallet Information</h2>
          <p>Brett Balance: {brettBalance} Brett</p>
        </Section>
        */}


        <Section>
          <h1 style={{ fontWeight: 'bold', textAlign: 'center' }}>BRETT MINERS</h1>
  
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>TVL (Total Value Locked)</p>
          <p>{tvl.eth} Tokens</p>
          </div>
      
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>My Miners:</p>
          <p>{myMiners}</p>
          </div>
    
        
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Claim Power: </p>
          <p>{claimPower}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>You can claim: </p>
          <p>{userReward} Brett</p>
          </div>

          <h1 style={{  textAlign: 'center' }}>
          <Button className="button-89" role="button" onClick={() => depositETH(depositAmount)}>Deposit ETH</Button>
          <Button className="button-89" role="button" onClick={() => depositBrett(depositAmount)}>Deposit Brett</Button>
          </h1>
          <h1 style={{  textAlign: 'center' }}>
          <input
            type="number"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          </h1>
          <p>Your rewards: </p>
          <h1 style={{  textAlign: 'center' }}>
          <Button className="button-89" role="button" onClick={compound}>Compound</Button>
          <Button className="button-89" role="button" onClick={withdraw}>Withdraw</Button>
          </h1>
          <p style={{  textAlign: 'center', fontSize: '12px' }}>WITHDRAW WILL RESET THE CLAIM POWER TO 50% <br /> CLAIM POWER REGENERATES 10% PER DAY TILL 100%</p>
        </Section>
        
        <Section>
        <h1 style={{ textAlign: 'center' }}><u>Harvest Return</u></h1>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Daily return: </p>
          <p>8%</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>APR</p>
            <p>2920%</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>Dev Fee</p>
          <p>5%</p>
          </div>
        </Section>

        <Section2>
        
        <h1><u><strong>REFERAL LINK</strong></u></h1>
        <ReferralSection style={{ textAlign: 'center' }}>
          
          <Button onClick={copyReferralLink} >Copy Referral Link</Button>
        </ReferralSection>
        
        </Section2>

      </LeftSection>

      <RightSection className="RightSection">
        {/*<img src={BrettMinerImage} alt="Brett Miner Image" />*/}
      </RightSection>
    </Container>
  );
}

export default App;
