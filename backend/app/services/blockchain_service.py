"""
Blockchain service for handling Web3 interactions.
"""
import logging
from typing import Optional, Dict, Any
from web3 import Web3
from eth_account import Account
import json
import os
from uuid import UUID
from datetime import datetime

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # Connect to local Hardhat node
        self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
        
        # Contract addresses from the blockchain project
        self.contract_addresses = {
            'HackCarbonToken': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            'EmissionsRegistry': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            'RetirementCertificate': '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            'CarbonMarketplace': '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
        }
        
        # Load contract ABI
        self._load_contract_abi()
        
        # Set up admin account (first Hardhat account)
        self.admin_private_key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        self.admin_account = Account.from_key(self.admin_private_key)
        
    def _load_contract_abi(self):
        """Load the HackCarbon contract ABI."""
        try:
            abi_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'abis', 'HackCarbon_abi.json')
            with open(abi_path, 'r') as f:
                self.contract_abi = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load contract ABI: {e}")
            self.contract_abi = []
    
    def get_contract(self, contract_name: str = 'HackCarbonToken'):
        """Get contract instance."""
        try:
            contract_address = self.contract_addresses.get(contract_name)
            if not contract_address:
                raise ValueError(f"Contract {contract_name} not found")
            
            return self.w3.eth.contract(
                address=contract_address,
                abi=self.contract_abi
            )
        except Exception as e:
            logger.error(f"Failed to get contract {contract_name}: {e}")
            return None
    
    def mint_carbon_credits(
        self, 
        to_address: str, 
        amount: float, 
        project_id: str, 
        vintage: str, 
        standard: str, 
        price: float
    ) -> Optional[str]:
        """Mint carbon credits to a wallet address."""
        try:
            contract = self.get_contract('HackCarbonToken')
            if not contract:
                return None
            
            # Convert amount to wei (18 decimals)
            amount_wei = self.w3.to_wei(amount, 'ether')
            price_wei = int(price * 100)  # Convert to cents
            
            # Build transaction
            transaction = contract.functions.mintCarbonCredits(
                to_address,
                amount_wei,
                project_id,
                vintage,
                standard,
                price_wei
            ).build_transaction({
                'from': self.admin_account.address,
                'nonce': self.w3.eth.get_transaction_count(self.admin_account.address),
                'gas': 500000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.admin_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                logger.info(f"Successfully minted {amount} credits to {to_address}")
                return tx_hash.hex()
            else:
                logger.error("Transaction failed")
                return None
                
        except Exception as e:
            logger.error(f"Failed to mint carbon credits: {e}")
            return None
    
    def retire_carbon_credits(
        self, 
        from_address: str, 
        private_key: str, 
        amount: float, 
        reason: str
    ) -> Optional[str]:
        """Retire carbon credits from a wallet."""
        try:
            contract = self.get_contract('HackCarbonToken')
            if not contract:
                return None
            
            # Convert amount to wei
            amount_wei = self.w3.to_wei(amount, 'ether')
            
            # Build transaction
            transaction = contract.functions.retireCarbonCredits(
                amount_wei,
                reason
            ).build_transaction({
                'from': from_address,
                'nonce': self.w3.eth.get_transaction_count(from_address),
                'gas': 300000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                logger.info(f"Successfully retired {amount} credits from {from_address}")
                return tx_hash.hex()
            else:
                logger.error("Transaction failed")
                return None
                
        except Exception as e:
            logger.error(f"Failed to retire carbon credits: {e}")
            return None
    
    def get_balance(self, address: str) -> float:
        """Get carbon credit balance for an address."""
        try:
            contract = self.get_contract('HackCarbonToken')
            if not contract:
                return 0.0
            
            balance_wei = contract.functions.balanceOf(address).call()
            return float(self.w3.from_wei(balance_wei, 'ether'))
            
        except Exception as e:
            logger.error(f"Failed to get balance for {address}: {e}")
            return 0.0
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain network."""
        try:
            return self.w3.is_connected()
        except:
            return False
