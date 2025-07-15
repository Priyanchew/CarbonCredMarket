import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Flame, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../lib/api';

interface RetireCreditsProps {
  onRetired?: () => void;
}

export default function RetireCredits({ onRetired }: RetireCreditsProps) {
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRetire = async () => {
    if (!isConnected || !address) {
      addToast('Connect wallet first', 'error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }

    if (!reason.trim()) {
      addToast('Enter a reason for retirement', 'error');
      return;
    }

    if (!privateKey.trim()) {
      addToast('Enter your wallet private key', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Retire credits via backend (this handles the blockchain transaction)
      await apiClient.retireCreditsBlockchain({
        amount: parseFloat(amount),
        reason: reason.trim(),
        wallet_address: address,
        private_key: privateKey.trim()
      });

      addToast(`Successfully retired ${amount} carbon credits!`, 'success');
      setAmount('');
      setReason('');
      setPrivateKey('');
      
      if (onRetired) {
        onRetired();
      }
      
    } catch (error: unknown) {
      console.error('Retirement failed:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to retire credits. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Connect your wallet to retire carbon credits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Flame className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">
            Retire Carbon Credits
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Permanently retire credits to offset emissions
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Retire
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Retirement
          </label>
          <input
            type="text"
            placeholder="e.g., Company emissions offset"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Private Key
          </label>
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ Your private key is used only for this transaction and is not stored
          </p>
        </div>
        
        <Button
          onClick={handleRetire}
          disabled={loading || !amount || !reason || !privateKey}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Retire Credits
        </Button>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Credits will be retired from: {address?.slice(0, 10)}...</p>
          <p>• Retired credits cannot be recovered</p>
          <p>• Transaction will be recorded on blockchain</p>
        </div>
      </CardContent>
    </Card>
  );
}
