import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tableRows,
  paginate,
  getFilterOptions,
  processTableData,
} from "../src/lib/admin-table";

test("admin table intersects normalized search and exact filters without mutating rows", () => {
  const rows = [
    { id: "1", cells: ["Pasar Atas", "Aktif", 10] },
    { id: "2", cells: ["Pasar Bawah", "Nonaktif", 20] },
    { id: "3", cells: ["Taman Kota", "Aktif", 5] },
  ];

  // Search
  assert.deepEqual(
    tableRows(rows, " pasar ", {}, null).map((r) => r.id),
    ["1", "2"],
  );

  // Search + Filter
  assert.deepEqual(
    tableRows(rows, "pasar", { 1: "Aktif" }, null).map((r) => r.id),
    ["1"],
  );

  // Sorting asc and desc
  assert.deepEqual(
    tableRows(rows, "", {}, { column: 0, direction: 1 }).map((r) => r.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    tableRows(rows, "", {}, { column: 0, direction: -1 }).map((r) => r.id),
    ["3", "2", "1"],
  );
  assert.deepEqual(
    tableRows(rows, "", {}, { column: 2, direction: 1 }).map((r) => r.id),
    ["3", "1", "2"],
  );

  // Original array untouched
  assert.equal(rows.length, 3);
});

test("paginate slices correctly and bounds current page", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    cells: [i],
  }));

  const page1 = paginate(items, 1, 10);
  assert.equal(page1.page, 1);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.items.length, 10);
  assert.equal(page1.items[0]?.id, "0");

  const page3 = paginate(items, 3, 10);
  assert.equal(page3.page, 3);
  assert.equal(page3.items.length, 5);

  // Out of bound clamped
  const clamped = paginate(items, 99, 10);
  assert.equal(clamped.page, 3);
  assert.equal(clamped.items.length, 5);

  const empty = paginate([], 1, 10);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.items.length, 0);
});

test("getFilterOptions extracts distinct sorted options", () => {
  const rows = [
    { id: "1", cells: ["A", "Aktif"] },
    { id: "2", cells: ["B", "Nonaktif"] },
    { id: "3", cells: ["C", "Aktif"] },
    { id: "4", cells: ["D", ""] },
  ];
  const options = getFilterOptions(rows, 1);
  assert.deepEqual(options, ["Aktif", "Nonaktif"]);
});

test("processTableData handles search, multi-filter, sort, and pagination end-to-end", () => {
  interface Item {
    id: string;
    name: string;
    status: string;
    category: string;
    count: number;
  }

  const items: Item[] = [
    {
      id: "a",
      name: "Pasar Senen",
      status: "Aktif",
      category: "Limbah Basah",
      count: 12,
    },
    {
      id: "b",
      name: "Pasar Baru",
      status: "Non-Aktif",
      category: "Limbah Kering",
      count: 4,
    },
    {
      id: "c",
      name: "Taman Suropati",
      status: "Aktif",
      category: "Limbah Basah",
      count: 8,
    },
    {
      id: "d",
      name: "Taman Menteng",
      status: "Aktif",
      category: "Limbah B3",
      count: 15,
    },
  ];

  const columns = [
    {
      header: "Nama",
      accessor: (i: Item) => i.name,
      searchValue: (i: Item) => i.name,
      sortValue: (i: Item) => i.name,
    },
    {
      header: "Status",
      accessor: (i: Item) => i.status,
      filterable: true,
      filterValue: (i: Item) => i.status,
    },
    {
      header: "Kategori",
      accessor: (i: Item) => i.category,
      filterable: true,
      filterValue: (i: Item) => i.category,
    },
    {
      header: "Jumlah",
      accessor: (i: Item) => i.count,
      sortValue: (i: Item) => i.count,
    },
  ];

  // Test search
  const resSearch = processTableData({
    items,
    columns,
    query: "taman",
    filters: {},
    sort: null,
    page: 1,
    pageSize: 10,
  });
  assert.equal(resSearch.totalItems, 2);
  assert.deepEqual(
    resSearch.items.map((x) => x.id),
    ["c", "d"],
  );

  // Test search + filter
  const resFiltered = processTableData({
    items,
    columns,
    query: "taman",
    filters: { 2: "Limbah B3" },
    sort: null,
    page: 1,
    pageSize: 10,
  });
  assert.equal(resFiltered.totalItems, 1);
  assert.equal(resFiltered.items[0]?.id, "d");

  // Test sorting numeric
  const resSort = processTableData({
    items,
    columns,
    query: "",
    filters: {},
    sort: { column: 3, direction: 1 },
    page: 1,
    pageSize: 10,
  });
  assert.deepEqual(
    resSort.items.map((x) => x.id),
    ["b", "c", "a", "d"],
  );

  // Test sorting string desc
  const resSortStr = processTableData({
    items,
    columns,
    query: "",
    filters: {},
    sort: { column: 0, direction: -1 },
    page: 1,
    pageSize: 10,
  });
  assert.deepEqual(
    resSortStr.items.map((x) => x.id),
    ["c", "d", "a", "b"],
  );
});
