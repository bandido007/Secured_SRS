# srs_domain/services/mocks/mock_storage.py

import json
from typing import Dict, Any, Optional
from django.utils import timezone
from ..interfaces.storage_service import StorageServiceInterface


class MockStorageService(StorageServiceInterface):
    """
    Mock implementation that simulates distributed storage.

    Stores content in memory (for testing) or local files.
    When you need real IPFS, create RealStorageService
    that talks to IPFS nodes.
    """

    def __init__(self):
        # In-memory storage for testing
        self._storage = {}

    def store_content(
        self,
        content_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store content (simulated).

        In production, this would upload to IPFS and return real CID.
        """
        # Generate a mock IPFS-like CID
        timestamp = timezone.now().timestamp()
        content_hash = str(hash(json.dumps(content_data, sort_keys=True)))
        content_id = f"QM{content_hash[:16]}{int(timestamp)}"

        # Store in memory
        self._storage[content_id] = {
            'content': content_data,
            'metadata': metadata or {},
            'timestamp': str(timezone.now())
        }

        return content_id

    def retrieve_content(self, content_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve content.
        """
        stored = self._storage.get(content_id)
        if not stored:
            return None

        return stored.get('content')

    def verify_content_availability(self, content_id: str) -> bool:
        """
        Check if content is available.
        """
        return content_id in self._storage
