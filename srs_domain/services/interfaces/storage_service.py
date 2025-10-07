# srs_domain/services/interfaces/storage_service.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class StorageServiceInterface(ABC):
    """
    Interface for distributed storage operations.

    Any implementation (mock or real) must provide these methods.
    The domain layer doesn't care if this uses IPFS, S3, or local files.
    """

    @abstractmethod
    def store_content(
        self,
        content_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store content in distributed storage.

        Args:
            content_data: The data to store
            metadata: Optional metadata about the content

        Returns:
            Content identifier (CID) that can be used to retrieve
        """
        pass

    @abstractmethod
    def retrieve_content(self, content_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve content from storage.

        Args:
            content_id: The content identifier

        Returns:
            The stored content or None if not found
        """
        pass

    @abstractmethod
    def verify_content_availability(self, content_id: str) -> bool:
        """
        Check if content is available in storage.

        Args:
            content_id: The content identifier

        Returns:
            True if content can be retrieved
        """
        pass
