from typing import Annotated

from fastapi import Path, Query

MAX_INT = 2_147_483_647

IdPath = Annotated[int, Path(ge=1, le=MAX_INT)]
IdQuery = Annotated[int | None, Query(ge=1, le=MAX_INT)]
