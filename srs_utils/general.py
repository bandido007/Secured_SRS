from datetime import date, timedelta


def get_week_range(target_date):
    """
    Calculates the start and end dates of the week (Monday to Sunday)
    for a given date.

    Args:
        target_date (date): The date within the week to calculate the range for.

    Returns:
        tuple: A tuple containing the start date (Monday) and end date (Sunday).
    """

    day_of_week = target_date.weekday()

    start_of_week = target_date - timedelta(days=day_of_week)

    end_of_week = start_of_week + timedelta(days=6)

    return start_of_week, end_of_week
