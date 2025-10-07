# srs_domain/services/mocks/mock_crypto.py

import hashlib
import json
from typing import Dict, Any
from ..interfaces.cryptography_service import CryptographyServiceInterface


class MockCryptographyService(CryptographyServiceInterface):
    """
    Mock implementation using real SHA-256 hashing.

    This is a working implementation that's good enough for development.
    When you need real encryption, create RealCryptographyService
    that implements the same interface with AES-256 or similar.
    """

    def compute_hash(self, data: Dict[str, Any]) -> str:
        """
        Compute SHA-256 hash of data.

        Uses JSON serialization with sorted keys for consistent hashing.
        """
        # Convert to JSON with sorted keys for consistency
        json_str = json.dumps(data, sort_keys=True, default=str)

        # Compute SHA-256 hash
        hash_obj = hashlib.sha256(json_str.encode('utf-8'))

        return hash_obj.hexdigest()

    def verify_hash(self, data: Dict[str, Any], claimed_hash: str) -> bool:
        """
        Verify data matches the claimed hash.
        """
        computed_hash = self.compute_hash(data)
        return computed_hash == claimed_hash
