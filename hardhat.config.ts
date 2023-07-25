import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'dotenv/config';
import type { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  paths: {
    cache: 'build/cache',
    artifacts: 'build/artifacts',
    sources: 'solidity/contracts',
    tests: 'solidity/tests',
  },
  networks: {
    mainnet: {
      chainId: 137,// Polygon
      url: process.env.POLYGON_MAIN_URL,
      accounts: [process.env.METAMASK_PRIVATE_KEY || ''],
    },
    testnet: {
      chainId: 80001,// Polygon Mumbai
      url: process.env.POLYGON_MUMBAI_URL,
      accounts: [process.env.METAMASK_PRIVATE_KEY || ''],
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPriceApi: 'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
    token: 'MATIC',
    enabled: true,
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGON_ETHERSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGON_ETHERSCAN_API_KEY || '',
    }
  },
  typechain: {
    outDir: 'solidity/types',
  },
  mocha: {
    asyncOnly: true,
    bail: true,
  }
}

export default config;
