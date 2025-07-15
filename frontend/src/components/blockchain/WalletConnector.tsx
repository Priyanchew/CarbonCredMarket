import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import apiClient from '../../lib/api';

interface WalletConnectorProps {
  showBalance?: boolean;
  className?: string;
}

export default function WalletConnector({ showBalance = true, className = '' }: WalletConnectorProps) {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      // Use backend API to get wallet balance instead of ethers
      const balanceData = await apiClient.getWalletBalance(address) as { balance: string };
      setBalance(balanceData.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("Error");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    fetchBalance();
    if (isConnected && address) {
      // Auto refresh every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [address, isConnected, fetchBalance]);

  if (!isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <ConnectButton showBalance={false} />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {showBalance && (
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">
                {loading ? '...' : `${parseFloat(balance || '0').toFixed(2)} Credits`}
              </p>
              <p className="text-xs text-gray-500">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}
      
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
