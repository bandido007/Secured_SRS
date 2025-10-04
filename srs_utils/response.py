import json
from typing import Type, TypeVar, List
from django.core.paginator import Paginator
from django.db.models import Model, Q, CharField, TextField, QuerySet, ForeignKey
from datetime import date, datetime
from django.utils import timezone


from srs_utils.general import get_week_range

T = TypeVar("T", bound=Model)
from ninja import schema
from functools import reduce
import operator
import logging


logger = logging.getLogger("gateway_logger")


class PageObject:
    number: int = None
    has_next_page: bool = None
    has_previous_page: bool = None
    current_page_number: int = None
    next_page_number: int = None
    previous_page_number: int = None
    number_of_pages: int = None
    total_elements: int = None
    pages_number_array: List[int] = []

    def __init__(
        self,
        number,
        has_next_page,
        has_previous_page,
        current_page_number,
        next_page_number,
        previous_page_number,
        number_of_pages,
        total_elements,
        pages_number_array,
    ):
        self.number = number
        self.has_next_page = has_next_page
        self.has_previous_page = has_previous_page
        self.current_page_number = current_page_number
        self.next_page_number = next_page_number
        self.previous_page_number = previous_page_number
        self.number_of_pages = number_of_pages
        self.total_elements = total_elements
        self.pages_number_array = pages_number_array

    @classmethod
    def get_page(self, page_datas: Paginator, page_number: int, total_items: int):
        page_object = page_datas.page(page_number)
        previous_page_number = 0
        next_page_number = 0

        if page_object.number > 1:
            previous_page_number = page_object.previous_page_number()
        try:
            next_page_number = page_object.next_page_number()
        except:
            next_page_number + page_object.number

        return PageObject(
            number=page_object.number,
            has_next_page=page_object.has_next(),
            has_previous_page=page_object.has_previous(),
            current_page_number=page_number,
            next_page_number=next_page_number,
            previous_page_number=previous_page_number,
            number_of_pages=page_datas.num_pages,
            total_elements=total_items,
            pages_number_array=list(range(1, page_datas.num_pages + 1)),
        )


class ResponseObject:
    id: int = 0
    status: bool = False
    code: int = 9000
    message: str = ""

    def __init__(self, id=id, status=status, code=code, message=message):
        """
        Args:
            id (int): integer of the response.
            status (bool): status of the Response a boolean field.
            code (int): integer of the Response Object
            message (str): message of the response
        """

        self.id = id
        self.status = status
        self.code = code
        self.message = message

    def __read_code_file(code_id):
        file = open("response.json", "r")
        file_codes = file.read()
        response_codes = json.loads(file_codes)
        response_code = next(code for code in response_codes if code["id"] == code_id)
        return response_code

    def get_response(id: int, message: str | None = None):
        """
        Fetches, Response, and builds Response data .

        Args:
            id (int): integer of the response.
            status (bool): status of the Response a boolean field.
            code (int): integer of the Response Object
            message (str): message of the response
        Returns:
            self: response of the Response class
        """

        response_code = ResponseObject.__read_code_file(id)

        return ResponseObject(
            response_code["id"],
            response_code["status"],
            response_code["code"],
            message if message else response_code["message"],
        )


def get_paginated_and_non_paginated_data(
    model: Type[T],
    filtering_object: dict | None,
    serializer: schema,
    additional_filters: Q | None = None,
    exclude_filtering_object: Q | None = None,
    custom_look_up_filter: dict | None = None,
    is_paged: bool = True,
    additional_computed_values: dict = None,
    custom_date_field_name: str = "created_date",
    is_custom_date_field_date_time: bool = False,
    **kwargs,
) -> schema:
    """
    Fetches, paginates, and builds data for a given model class.

    Args:
        model (Model): The Django model to query.
        filters (Q): The filters to apply to the queryset.
        serializer(object): serializer class for response
        custom_look_up_filter(dict): custom lookup in the  query filters default is None
        additional_filters(Q): additional filters to be passed
        is_paged(bool): defaulted to True change to false to make list not page
    Returns:
        schema: A schema containing the response, page, data.
    """

    try:
        logger.info("Fetching paginated and non-paginated data started 🗒️")

        if custom_look_up_filter is None:
            logger.info("Custom look up filter is None, setting to empty dictionary")
            custom_look_up_filter = {}

        filter_dictionary = dict(filtering_object)

        if is_paged:
            filter_dictionary.pop("page_number")
            filter_dictionary.pop("items_per_page")

        filter_dictionary.pop("search_term")
        filter_dictionary.pop("start_date", None)
        filter_dictionary.pop("end_date", None)
        filter_dictionary.pop("time_range", None)

        for attr, value in dict(filter_dictionary).items():
            if value is None:
                filter_dictionary.pop(attr)
            elif custom_look_up_filter.get(attr, None) is not None:
                filter_dictionary[custom_look_up_filter.get(attr, None)] = value
                filter_dictionary.pop(attr)

        if filter_dictionary.get("is_active", None) is None:
            filter_dictionary["is_active"] = True

        filtering_object = dict(filtering_object)

        search_term = filtering_object.get("search_term", None)
        start_date = filtering_object.get("start_date", None)
        end_date = filtering_object.get("end_date", None)
        time_range = filtering_object.get("time_range", None)

        page_number = (
            filtering_object.get("page_number", 1)
            if filtering_object.get("page_number", 1)
            else 1
        )
        items_per_page = (
            filtering_object.get("items_per_page", 40)
            if filtering_object.get("items_per_page", 40)
            else 40
        )

        queryset = model.objects.filter(**filter_dictionary)

        if additional_filters is not None:
            queryset = queryset.filter(additional_filters)

        if exclude_filtering_object is not None:
            queryset = queryset.exclude(exclude_filtering_object)

        if search_term:  # Only apply search filter if search_term is not empty
            queryset = apply_search_filter(
                queryset, model, search_term
            )  # Comment this line if you don't want global search functionality

        if start_date is not None or end_date is not None or time_range is not None:
            queryset = apply_date_filters(
                start_date=start_date,
                end_date=end_date,
                time_range=time_range,
                custom_date_field_name=custom_date_field_name,
                is_custom_date_field_date_time=is_custom_date_field_date_time,
                queryset=queryset,
            )

        if not is_paged:
            data_object = serializer(
                response=ResponseObject.get_response(id=1), data=queryset
            )
            if additional_computed_values is not None:
                for (
                    additional_attr,
                    additional_values,
                ) in additional_computed_values.items():
                    setattr(data_object, additional_attr, additional_values)

            return data_object

        paginated_data = Paginator(queryset, items_per_page)

        if (
            page_number > paginated_data.num_pages or page_number < 1
        ):  # If page number is greater than the number of pages or less than 1, returns "This page has no results."
            return serializer(
                response=ResponseObject.get_response(
                    id=0, message="This page has no results"
                )
            )

        page_obj = PageObject.get_page(
            page_datas=paginated_data,
            page_number=page_number,
            total_items=queryset.count(),
        )

        data = paginated_data.page(page_number)

        data_object = serializer(
            response=ResponseObject.get_response(id=1), page=page_obj, data=data
        )

        if additional_computed_values is not None:
            for (
                additional_attr,
                additional_values,
            ) in additional_computed_values.items():
                setattr(data_object, additional_attr, additional_values)

        return data_object

    except Exception as e:
        logger.error(f"error occurred {e}")
        return serializer(
            response=ResponseObject.get_response(2, message=str(e)),
        )


def apply_search_filter(queryset: QuerySet, model: Model, search_term: str = None):

    logger.info(f"applying search filter {search_term}")

    query_to_search = {}

    for field in model._meta.get_fields():
        if isinstance(field, (CharField, TextField)):
            query_to_search[field.name + "__icontains"] = search_term

        if isinstance(field, (ForeignKey)):
            logger.info(f"got foreign key field here {field.name}")
            foreign_model = field.related_model
            for foreign_field in foreign_model._meta.get_fields():
                if "password" in foreign_field.name:
                    continue
                if isinstance(foreign_field, (CharField, TextField)):
                    query_to_search[
                        field.name + "__" + foreign_field.name + "__icontains"
                    ] = search_term

    queryset = queryset.filter(
        reduce(
            operator.or_, (Q(**d) for d in [dict([i]) for i in query_to_search.items()])
        )
    )

    return queryset


def apply_date_filters(
    start_date: date,
    end_date: date,
    time_range: str,
    custom_date_field_name: str,
    is_custom_date_field_date_time: bool,
    queryset: QuerySet,
) -> QuerySet:

    logger.info(
        f"📅 applying date filter with start_date:{start_date} end_date:{end_date} time_range: {time_range} custom_date_field_name:{custom_date_field_name}  is_custom_date_field_date_time:{is_custom_date_field_date_time}"
    )
    dates_search_dictionary = {}
    if start_date is not None:
        dates_search_dictionary[
            (
                custom_date_field_name
                + "__"
                + ("date__gte" if is_custom_date_field_date_time else "gte")
            )
        ] = start_date
    if end_date is not None:
        dates_search_dictionary[
            (
                custom_date_field_name
                + "__"
                + ("date__lte" if is_custom_date_field_date_time else "lte")
            )
        ] = end_date
    if time_range is not None:
        today = datetime.today().date()
        if time_range == "TODAY":
            dates_search_dictionary[
                (
                    custom_date_field_name
                    + ("__date" if is_custom_date_field_date_time else "")
                )
            ] = today
        if time_range == "THIS_WEEK":
            monday, sunday = get_week_range(today)
            dates_search_dictionary[
                (
                    custom_date_field_name
                    + "__"
                    + ("date__gte" if is_custom_date_field_date_time else "gte")
                )
            ] = monday
            dates_search_dictionary[
                (
                    custom_date_field_name
                    + "__"
                    + ("date__lte" if is_custom_date_field_date_time else "lte")
                )
            ] = sunday

        if time_range == "THIS_MONTH":
            month = today.month
            dates_search_dictionary[
                (
                    custom_date_field_name
                    + "__"
                    + ("date__month" if is_custom_date_field_date_time else "month")
                )
            ] = month

        if time_range == "THIS_YEAR":
            year = today.year
            dates_search_dictionary[
                (
                    custom_date_field_name
                    + "__"
                    + ("date__year" if is_custom_date_field_date_time else "year")
                )
            ] = year

    logger.info(dates_search_dictionary)

    queryset = queryset.filter(
        reduce(
            operator.and_,
            (Q(**d) for d in [dict([i]) for i in dates_search_dictionary.items()]),
        )
    )

    return queryset
