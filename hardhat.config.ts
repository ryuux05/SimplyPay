import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import { HttpNetworkAccountsUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/deploy";

dotenv.config();

const MNEMONIC = process.env.MNEMONIC

const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const alchemyApiKey: string | undefined = process.env.ALCHEMY_MAINNET_API;
if (!alchemyApiKey) {
  throw new Error("Please set your ALCHEMY_API in a .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
  },
  networks:{
    hardhat:{
      forking:{
        url: alchemyApiKey,
        blockNumber: 20998408
      },
    },
    'sepolia': {
      url: process.env.ALCHEMY_SEPOLIA_API || 'https://rpc.sepolia.org/',
      accounts,
    },
    "arbitrum-sepolia": {
      url: process.env.ALCHEMY_ARBITRUM_SEPOLIA_API,
      accounts,
    },
    "node":{
      url: "http://127.0.0.1:8545/",
      accounts,
    }
  },
  sourcify: {
    enabled: true
  },
  etherscan:{
    apiKey:process.env.ETHERSCAN_API
  }
};





export default config;
