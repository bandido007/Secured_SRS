# srs_domain/services/interfaces/blockchain_service.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime


class BlockchainServiceInterface(ABC):
    """
    Interface for blockchain operations.

    Any implementation (mock or real) must provide these methods.
    The domain layer doesn't care if this uses Hyperledger, Ethereum,
    or just a database - it only needs these capabilities.
    """

    async def upload_results(self, courseId, results):
        print(f" Uploading results for patient {courseId} ...")

        response = await self.client.chaincode_invoke(
            requestor=self.admin,
            channel_name='mychannel',
            peers=['peer0.org1.example.com'],
            args=[courseId, results],
            cc_name='basic',
            fcn='uploadResults',
            wait_for_event=True
        )

        print("Chaincode Response:", response)
        return response


    @abstractmethod
    def store_transaction(
        self,
        record_hash: str,
        metadata: Dict[str, Any]
    ) -> str:
        """
        Store a transaction on the blockchain.

        Args:
            record_hash: The cryptographic hash to store
            metadata: Additional data about the transaction

        Returns:
            Transaction ID that can be used to retrieve this transaction
        """
        pass
    

    @abstractmethod
    def get_transaction(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a transaction from the blockchain.

        Args:
            transaction_id: The transaction to retrieve

        Returns:
            Dictionary with transaction data or None if not found
        """
        pass

    @abstractmethod
    def verify_transaction_integrity(self, transaction_id: str) -> bool:
        """
        get student grades from db
        hash student grade
        get_transaction from blockchain 
        compare to verify
        
        Verify that a transaction hasn't been tampered with.

        Args:
            transaction_id: The transaction to verify

        Returns:
            True if transaction is valid and untampered
        """
        pass
