import requests
from typing import Dict, Any, List
from srs_domain.services.interfaces.blockchain_service import BlockchainServiceInterface


class MockBlockchainService(BlockchainServiceInterface):
    """
    Implementation of BlockchainServiceInterface that talks to the Node.js Fabric backend.
    """

    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url

    def _post(self, endpoint: str, data: Dict[str, Any]) -> Any:
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()

    def _get(self, endpoint: str) -> Any:
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    # -----------------------
    # Student APIs
    # -----------------------
    def create_student(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/createStudent", student_data)

    def get_student(self, student_id: str) -> Dict[str, Any]:
        return self._get(f"/getStudent/{student_id}")

    def list_students(self) -> List[Dict[str, Any]]:
        return self._get("/listStudents")

    # -----------------------
    # Lecturer APIs
    # -----------------------
    def create_lecturer(self, lecturer_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/createLecturer", lecturer_data)

    def list_lecturers(self) -> List[Dict[str, Any]]:
        return self._get("/listLecturers")

    # -----------------------
    # Course APIs
    # -----------------------
    def add_course(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/addCourse", course_data)

    def list_courses(self) -> List[Dict[str, Any]]:
        return self._get("/listCourses")

    def upload_results(self, course_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        data = {"courseId": course_id, "results": results}
        return self._post("/submitGrade", data)

    # -----------------------
    # Enrollment APIs
    # -----------------------
    def enroll_student(self, enrollment_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/enrollStudent", enrollment_data)

    # -----------------------
    # Transcript APIs
    # -----------------------
    def generate_transcript(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._post("/generateTranscript", transcript_data)

    def list_transcripts(self, student_id: str) -> List[Dict[str, Any]]:
        return self._get(f"/listTranscripts/{student_id}")
