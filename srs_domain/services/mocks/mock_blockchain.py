import requests
from typing import Dict, Any, List
from srs_domain.services.interfaces.blockchain_service import BlockchainServiceInterface


class MockBlockchainService(BlockchainServiceInterface):
    """
    Implementation of BlockchainServiceInterface that talks to the Node.js Fabric backend.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:3000"):
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

    def _put(self, endpoint: str, data: Dict[str, Any]) -> Any:
        url = f"{self.base_url}{endpoint}"
        response = requests.put(url, json=data)
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


    # -----------------------
    # Course Result APIs
    # -----------------------
    def upload_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        # data = {"courseId": course_id, "results": results}
        return self._post("/submitGrade", results)
    
    def get_course_result(self, result_id: str) -> Dict[str, Any]:
        """Get a specific grade from blockchain by result ID"""
        return self._get(f"/getResult/{result_id}")

    def update_course_result(self, result_id: str, grade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing course result on the blockchain.
        Calls the proper updateGrade endpoint which creates immutable audit trail.
        """
        return self._put(f"/updateGrade/{result_id}", grade_data)

    def get_version_history(self, result_id: str) -> Dict[str, Any]:
        """Get complete version history for a grade from blockchain"""
        return self._get(f"/getGradeVersionHistory/{result_id}")

    def verify_grade_integrity(self, result_id: str) -> Dict[str, Any]:
        """Real-time verification of grade integrity against blockchain"""
        return self._get(f"/verifyGradeIntegrity/{result_id}")

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