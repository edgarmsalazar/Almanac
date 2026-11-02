"""Loans: a second module, drawn in each docstring section style.

The same function is shown three times on the guide's page: as tables (the
default), as lists, and in spaCy's style.
"""

from dataclasses import dataclass
from datetime import date, timedelta

LOAN_PERIOD = timedelta(days=21)
"""How long a loan lasts unless renewed."""


@dataclass(frozen=True)
class Loan:
    """One copy lent to one reader.

    Attributes:
        mark: The shelf mark of the item lent.
        reader: The reader's card number.
        due: The day it is due back.
    """

    mark: str
    reader: int
    due: date


def lend(mark: str, reader: int, today: date, *, period: timedelta = LOAN_PERIOD) -> Loan:
    """Lends a copy of an item to a reader.

    Args:
        mark: The shelf mark of the item.
        reader: The reader's card number.
        today: The day of the loan.
        period: How long until it is due.

    Returns:
        The loan, due one period from today.

    Raises:
        ValueError: If the reader's card has expired.
    """
    return Loan(mark, reader, today + period)
