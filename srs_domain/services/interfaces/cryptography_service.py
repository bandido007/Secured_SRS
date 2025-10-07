# srs_domain/services/interfaces/cryptography_service.py

from abc import ABC, abstractmethod
from typing import Dict, Any


class CryptographyServiceInterface(ABC):
    """
    Interface for cryptography operations.

    Any implementation (mock or real) must provide these methods.
    The domain layer doesn't care HOW encryption/hashing works,
    only THAT it provides these capabilities.
    """

    @abstractmethod
    def compute_hash(self, data: Dict[str, Any]) -> str:
        """
        Compute a cryptographic hash of data.

        Args:
            data: Dictionary of data to hash

        Returns:
            Hexadecimal hash string
        """
        pass

    @abstractmethod
    def verify_hash(self, data: Dict[str, Any], claimed_hash: str) -> bool:
        """
        Verify that data matches a claimed hash.

        Args:
            data: Dictionary of data to verify
            claimed_hash: The hash to verify against

        Returns:
            True if data matches hash, False otherwise
        """
        pass
