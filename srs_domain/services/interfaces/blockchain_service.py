import aiohttp
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class BlockchainServiceInterface(ABC):
    """
    Abstract base interface for blockchain operations.
    Concrete implementations (mock or API-based) must implement these.
    """

    @abstractmethod
    def upload_results(self, course_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_student(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_student(self, student_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_students(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def create_lecturer(self, lecturer_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_lecturers(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def add_course(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_courses(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def enroll_student(self, enrollment_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_transcript(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def list_transcripts(self, student_id: str) -> List[Dict[str, Any]]:
        pass