import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Coins, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../lib/api';
import type { CarbonProject } from '../../types';

interface MintCreditsProps {
  project: CarbonProject;
  onMinted?: () => void;
}

export default function MintCredits({ project, onMinted }: MintCreditsProps) {
  const { address, isConnected } = useAccount();
  const { addToast } = useToast();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!isConnected || !address) {
      addToast('Connect wallet first', 'error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // First, mint via backend (this handles the blockchain transaction)
      await apiClient.mintCredits({
        project_id: project.id,
        amount: parseFloat(amount),
        wallet_address: address
      });

      addToast(`Successfully minted ${amount} carbon credits!`, 'success');
      setAmount('');
      
      if (onMinted) {
        onMinted();
      }
      
    } catch (error: unknown) {
      console.error('Minting failed:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to mint credits. Please try again.',
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
            Connect your wallet to mint carbon credits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">
            Mint Carbon Credits
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Mint credits for project: {project.name}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Mint
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
            min="0"
            step="0.01"
          />
        </div>
        
        <Button
          onClick={handleMint}
          disabled={loading || !amount}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Mint Credits
        </Button>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Credits will be minted to: {address?.slice(0, 10)}...</p>
          <p>• Project ID: {project.id}</p>
          <p>• Standard: {project.standard}</p>
        </div>
      </CardContent>
    </Card>
  );
}
