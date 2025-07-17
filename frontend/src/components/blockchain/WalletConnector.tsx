import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletConnectorProps {
  showBalance?: boolean;
  className?: string;
}

export default function WalletConnector({ showBalance = true, className = '' }: WalletConnectorProps) {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <ConnectButton showBalance={false} />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <ConnectButton 
        showBalance={false}
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
    </div>
  );
}
