"""The catalogue: what the library holds, and how a reader finds it.

A module docstring, then the module's members: an attribute, a type alias, an
exception, an enumeration, a protocol, an abstract class, a dataclass, a
generic class, and functions with every docstring section.

Examples:
    A module's own example, drawn as code:

    >>> from library.catalogue import Catalogue, Item
    >>> catalogue = Catalogue()
    >>> catalogue.add(Item("QA76 .K5", "The Art of Computer Programming"))
"""

import enum
import warnings
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Generator, Iterable
from dataclasses import dataclass, field
from functools import cached_property
from pathlib import Path
from typing import Protocol, overload

DEFAULT_LIMIT: int = 20
"""A module attribute with a type and a docstring: how many results a search returns."""

type Mark = str
"""A type alias: a shelf mark, unique within the library."""


class NotCatalogued(KeyError):
    """An exception, with its base shown: a shelf mark names nothing in the catalogue."""


class Format(enum.Enum):
    """An enumeration, its members drawn as attributes."""

    BOOK = "book"
    """Printed and bound."""
    SERIAL = "serial"
    """Issued in parts."""
    RECORDING = "recording"
    """Sound or video."""


class Shelved(Protocol):
    """A protocol: anything with a shelf mark."""

    mark: Mark
    """The shelf mark."""


class Store(ABC):
    """An abstract class, its abstract method labelled."""

    @abstractmethod
    def save(self, path: Path) -> None:
        """An abstract method: writes the store to a file.

        Args:
            path: The file to write.
        """


@dataclass(frozen=True)
class Item:
    """A dataclass, its fields as the constructor's parameters.

    Attributes:
        mark: The shelf mark, unique within the library.
        title: The title as printed.
        authors: Each author, surname first.
        year: The year of the edition held.
        format: What kind of thing it is.
    """

    mark: Mark
    title: str
    authors: tuple[str, ...] = ()
    year: int | None = None
    format: Format = Format.BOOK

    @property
    def label(self) -> str:
        """A read-only property: the spine label, mark then first surname."""
        surname = self.authors[0].split(",")[0] if self.authors else ""
        return f"{self.mark} {surname}".strip()


class Shelf[T: Shelved]:
    """A generic class with a type parameter.

    Type Parameters:
        T: What the shelf holds.

    Args:
        name: The shelf's name, as its sign reads.
        capacity: How many things fit.
    """

    #: A class attribute, documented with a comment.
    signs: int = 1

    def __init__(self, name: str, capacity: int = 40) -> None:
        self.name = name
        """An instance attribute, set in __init__: the shelf's name."""
        self._capacity = capacity
        self._held: list[T] = []

    @property
    def capacity(self) -> int:
        """A writable property: how many things fit."""
        return self._capacity

    @capacity.setter
    def capacity(self, value: int) -> None:
        self._capacity = value

    @cached_property
    def sign(self) -> str:
        """A cached property: the sign above the shelf."""
        return self.name.upper()

    def put(self, thing: T) -> None:
        """A method taking the type parameter.

        Args:
            thing: What to shelve.

        Raises:
            OverflowError: If the shelf is full.
        """
        if len(self._held) >= self._capacity:
            raise OverflowError(self.name)
        self._held.append(thing)

    class Divider:
        """A nested class: a card between runs of the shelf."""

        def __init__(self, text: str) -> None:
            self.text = text
            """What the card says."""


@dataclass
class Catalogue(Store):
    """A dataclass with a base, its members of every kind.

    Args:
        items: The items to start with.
        path: Where the catalogue is saved; None keeps it in memory only.
    """

    items: dict[Mark, Item] = field(default_factory=dict)
    path: Path | None = None

    @classmethod
    def load(cls, path: Path) -> "Catalogue":
        """A class method, with parameters, a return and what it raises.

        Args:
            path: The JSON file to read.

        Returns:
            The catalogue, which saves back to the same file.

        Raises:
            FileNotFoundError: If nothing is at path.
            ValueError: If the file is not a catalogue.
        """
        raise NotImplementedError

    @staticmethod
    def normalise(mark: str) -> Mark:
        """A static method: a shelf mark in its canonical form.

        Args:
            mark: The shelf mark as written.

        Returns:
            Upper case, without spaces.
        """
        return mark.replace(" ", "").upper()

    def save(self, path: Path | None = None) -> None:
        """An override of the abstract method.

        Args:
            path: Where to write; the catalogue's own path if None.

        Raises:
            ValueError: If neither path is set.
        """

    @overload
    def find(self, mark: Mark) -> Item: ...
    @overload
    def find(self, mark: Mark, default: Item) -> Item: ...
    def find(self, mark: Mark, default: Item | None = None) -> Item:
        """An overloaded method, its signatures listed.

        Args:
            mark: The shelf mark to look up.
            default: What to return when nothing has it.

        Returns:
            The item, or the default.

        Raises:
            NotCatalogued: If nothing has it and there is no default.
        """
        if mark in self.items:
            return self.items[mark]
        if default is None:
            raise NotCatalogued(mark)
        return default

    def search(self, *words: str, limit: int = DEFAULT_LIMIT, **filters: str) -> list[Item]:
        """Variadic and keyword-only parameters, other parameters and notes.

        Words match case-insensitively, anywhere in the title or an author's
        name. Results come in shelf-mark order.

        Args:
            *words: The words to look for.
            limit: The most results to return.

        Other Parameters:
            **filters: Fields an item must match exactly, such as format="book".

        Returns:
            Up to limit items.

        Note:
            A note section, drawn as an admonition.

        Warning:
            A warning section: a search with no words returns nothing.

        See Also:
            [find][library.catalogue.Catalogue.find] for one item by its mark.
        """
        return []

    def walk(self) -> Generator[Item, int, None]:
        """A generator: what it yields, and what it receives.

        Yields:
            Each item in shelf-mark order.

        Receives:
            How many items to skip before the next.

        Returns:
            Nothing, once every item is walked.
        """
        yield from ()

    async def stream(self) -> AsyncIterator[Item]:
        """An async method, labelled so.

        Yields:
            Each item, as it is read.
        """
        for item in self.items.values():
            yield item

    def add(self, item: Item) -> None:
        """A method that warns.

        Args:
            item: The item to add.

        Warns:
            UserWarning: If an item with its mark is replaced.
        """
        if item.mark in self.items:
            warnings.warn(f"replaced {item.mark}", stacklevel=2)
        self.items[item.mark] = item


def first[T](things: Iterable[T]) -> T:
    """A generic function with a type parameter, its source shown below.

    Type Parameters:
        T: The things' type.

    Args:
        things: Any iterable.

    Returns:
        The first thing.

    Raises:
        StopIteration: If there is nothing.
    """
    return next(iter(things))
