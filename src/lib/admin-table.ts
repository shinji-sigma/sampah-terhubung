export type TableRow = {
  id: string;
  cells: readonly (string | number | boolean | null | undefined)[];
};

export function tableRows<T extends TableRow>(
  rows: readonly T[],
  query: string,
  filters: Readonly<Record<number, string>>,
  sort: { column: number; direction: 1 | -1 } | null,
): T[] {
  const needle = query.trim().toLocaleLowerCase("id");
  const filtered = rows.filter((row) => {
    const matchesFilter = Object.entries(filters).every(([colIdx, val]) => {
      if (!val) return true;
      const cellVal = String(row.cells[Number(colIdx)] ?? "");
      return cellVal === val;
    });
    if (!matchesFilter) return false;
    if (!needle) return true;
    return row.cells.some((cell) =>
      String(cell ?? "")
        .toLocaleLowerCase("id")
        .includes(needle),
    );
  });

  if (!sort) return [...filtered];

  return [...filtered].sort((a, b) => {
    const valA = a.cells[sort.column];
    const valB = b.cells[sort.column];
    if (typeof valA === "number" && typeof valB === "number") {
      return (valA - valB) * sort.direction;
    }
    return (
      String(valA ?? "").localeCompare(String(valB ?? ""), "id", {
        numeric: true,
        sensitivity: "base",
      }) * sort.direction
    );
  });
}

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number = 10,
): {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  items: T[];
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const sliced = items.slice(startIndex, endIndex);

  return {
    page,
    totalPages,
    pageSize,
    totalItems,
    startIndex,
    endIndex,
    items: sliced,
  };
}

export function getFilterOptions<T extends TableRow>(
  rows: readonly T[],
  columnIndex: number,
): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const val = row.cells[columnIndex];
    if (val !== null && val !== undefined && String(val).trim() !== "") {
      values.add(String(val));
    }
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b, "id"));
}

export interface AdminTableColumn<T> {
  header: string;
  accessor: (item: T) => unknown;
  searchValue?: (item: T) => string | number | null | undefined;
  sortValue?: (item: T) => string | number | null | undefined;
  filterable?: boolean;
  filterValue?: (item: T) => string;
}

export function processTableData<T>({
  items,
  columns,
  query,
  filters,
  sort,
  page,
  pageSize = 10,
}: {
  items: readonly T[];
  columns: readonly AdminTableColumn<T>[];
  query: string;
  filters: Readonly<Record<number, string>>;
  sort: { column: number; direction: 1 | -1 } | null;
  page: number;
  pageSize?: number;
}): {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  filteredTotal: number;
  startIndex: number;
  endIndex: number;
  items: T[];
} {
  const needle = query.trim().toLocaleLowerCase("id");

  const filtered = items.filter((item) => {
    // Check filters
    for (const [colIndexStr, filterVal] of Object.entries(filters)) {
      if (!filterVal) continue;
      const colIdx = Number(colIndexStr);
      const col = columns[colIdx];
      if (!col) continue;
      const val = col.filterValue
        ? col.filterValue(item)
        : String(col.accessor(item) ?? "");
      if (val !== filterVal) return false;
    }

    // Check query
    if (!needle) return true;
    return columns.some((col) => {
      const val = col.searchValue ? col.searchValue(item) : col.accessor(item);
      if (val === null || val === undefined) return false;
      return String(val).toLocaleLowerCase("id").includes(needle);
    });
  });

  const sorted = [...filtered];
  if (sort && columns[sort.column]) {
    const col = columns[sort.column];
    sorted.sort((a, b) => {
      const valA = col.sortValue ? col.sortValue(a) : col.accessor(a);
      const valB = col.sortValue ? col.sortValue(b) : col.accessor(b);
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * sort.direction;
      }
      return (
        String(valA ?? "").localeCompare(String(valB ?? ""), "id", {
          numeric: true,
          sensitivity: "base",
        }) * sort.direction
      );
    });
  }

  const paged = paginate(sorted, page, pageSize);

  return {
    ...paged,
    filteredTotal: filtered.length,
  };
}
