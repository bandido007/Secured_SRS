# srs_domain/services/mocks/mock_blockchain.py

from typing import Dict, Any, Optional
from django.utils import timezone
from ..interfaces.blockchain_service import BlockchainServiceInterface


class MockBlockchainService(BlockchainServiceInterface):
    """
    Mock implementation that simulates blockchain storage.

    Stores transactions in memory (for testing) or uses RecordTransaction model.
    When you need real blockchain, create RealBlockchainService
    that talks to Hyperledger, Ethereum, etc.
    """

    def __init__(self):
        # In-memory storage for testing (won't persist across restarts)
        self._transactions = {}

    def store_transaction(
        self,
        record_hash: str,
        metadata: Dict[str, Any]
    ) -> str:
        """
        Store a transaction (simulated).

        In production, this would call actual blockchain APIs.
        """
        # Generate a transaction ID
        timestamp = timezone.now().timestamp()
        transaction_id = f"TX-{timestamp}-{record_hash[:8]}"

        # Store in memory
        self._transactions[transaction_id] = {
            'hash': record_hash,
            'metadata': metadata,
            'timestamp': str(timezone.now()),
            'verified': True
        }

        return transaction_id

    def get_transaction(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a transaction.
        """
        return self._transactions.get(transaction_id)

    def verify_transaction_integrity(self, transaction_id: str) -> bool:
        """
        Verify transaction integrity (simulated).

        In production, this would verify blockchain signatures/proofs.
        """
        transaction = self._transactions.get(transaction_id)
        if not transaction:
            return False

        # In mock, we just check it exists
        # Real implementation would verify cryptographic proofs
        return transaction.get('verified', False)
