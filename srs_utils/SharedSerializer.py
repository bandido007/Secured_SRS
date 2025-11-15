from ninja import Schema 
from typing import List , Optional
from datetime import date
from uuid import UUID
import enum


def to_camel(string: str) -> str:
    return "".join(
        word.capitalize() if index > 0 else word
        for (index, word) in enumerate(string.split("_"))
    )

def normalize_datetime(dt):
    if isinstance(dt, datetime):
        return dt.replace(microsecond=int(dt.microsecond/1000)*1000).isoformat(timespec="milliseconds") + "Z"
    return dt


def normalize(s):
    return s.strip().lower() if isinstance(s, str) else s


class TimeRangeEnum(str, enum.Enum):
    TODAY = "TODAY"
    THIS_WEEK = "THIS_WEEK"
    THIS_MONTH = "THIS_MONTH"
    THIS_YEAR = "THIS_YEAR"


class UserResponse(Schema):

    username: str = None
    first_name: str = None
    last_name: str = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class ResponseSerializer(Schema):
    id: int
    status: bool
    message: str
    code: int


class PaginationResponseSerializer(Schema):
    number: int = None
    has_next_page: bool = None
    has_previous_page: bool = None
    current_page_number: int = None
    next_page_number: Optional[int]
    previous_page_number: Optional[int]
    number_of_pages: int = None
    total_elements: int = None
    pages_number_array: List[int] | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BasePagedFilteringSerializer(Schema):
    page_number: int | None = None
    items_per_page: int | None = None
    search_term: str | None = None
    unique_id: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    time_range: TimeRangeEnum | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BaseNonPagedFilteringSerializer(Schema):
    search_term: str | None = None
    unique_id: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    time_range: TimeRangeEnum | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BaseSerializer(Schema):
    id: int
    unique_id: UUID
    created_date: date
    updated_date: date
    is_active: bool
    created_by: UserResponse | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BaseInputSerializer(Schema):
    unique_id: str | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BasePagedResponseList(Schema):
    response: ResponseSerializer
    page: PaginationResponseSerializer | None = None

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BaseNonPagedResponseData(Schema):
    response: ResponseSerializer

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class BaseSchema(Schema):
    """
    Extend this Class if you want to get the Camel case Feature to you Schema
    """

    class Config(Schema.Config):
        alias_generator = to_camel
        populate_by_name = True


class ErrorSchema(Schema):
    """Standard schema for returning structured error messages."""
    detail: str

# # ===================================================================
# # SECTION 2: APPLICATION-SPECIFIC ADMIN SCHEMAS
# # ===================================================================

# # --- Schemas for Admin Input ---

# class ServiceComponentInputSchema(BaseSchema):
#     """Input for creating/updating a service component."""
#     component_name: str
#     component_code: str
#     component_description: str

# class AIServiceInputSchema(BaseSchema):
#     """Admin input for creating or updating an AI Service."""
#     name: str
#     description: str
#     service_code: str
#     service_type: str # e.g., "API" or "WIDGET"
#     version: str = "1.0.0"
#     documentation_url: Optional[str] = None
#     endpoint_url: Optional[str] = None
#     is_active: bool
#     components: List[ServiceComponentInputSchema]

# class ServiceConfigurationInputSchema(BaseSchema):
#     """Admin input for creating or updating a configuration variable."""
#     key: str
#     value: str
#     data_type: str # e.g., 'string', 'integer', 'boolean'
#     is_required: bool = False
#     description: Optional[str] = None

# # --- Schemas for Admin Output/Responses ---

# class PublicServiceComponentSchema(BaseSchema):
#     component_name: str
#     component_description: Optional[str] = None
#     component_code: str

# class PublicAIServiceListSchema(BaseSchema):
#     name: str
#     service_code: str
#     service_type: str
#     description: str
#     is_active: bool

# class AIServiceDetailSchema(PublicAIServiceListSchema):
#     """Detailed schema for a single AI service response."""
#     service_version: str
#     documentation_url: Optional[str] = None
#     service_endpoint_url: Optional[str] = None
#     components: List[PublicServiceComponentSchema]

# class ServiceConfigurationSchema(BaseSchema):
#     """Output schema for a service configuration item."""
#     key: str
#     value: str
#     data_type: str
#     is_required: bool
#     description: Optional[str] = None

# class AdminSubscriptionSchema(BaseSchema):
#     """Schema for listing subscriptions in the admin panel."""
#     unique_id: UUID
#     user_profile: str  # Simplified to username
#     service_name: str
#     service_code: str
#     subscription_status: str
#     is_active: bool
#     created_at: datetime