import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

const localhost = defineChain({
  id: 31337,
  name: 'Hardhat',
  network: 'localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://16.171.235.251:8545'] },
    public: { http: ['http://16.171.235.251:8545'] }
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'http://16.171.235.251:8545' },
  }
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Carbon Marketplace',
  projectId: '08a096acf228fb4dee2ba701fb031dcf',
  chains: [localhost],
  ssr: false
});

export { localhost };
