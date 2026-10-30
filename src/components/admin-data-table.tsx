"use client";
import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getFilterOptions,
  paginate,
  tableRows,
  type TableRow,
} from "@/lib/admin-table";

type Row = TableRow & { detail?: ReactNode; display?: ReactNode[] };
export function AdminDataTable({
  title,
  columns,
  rows,
  filterColumns = [],
}: {
  title: string;
  columns: string[];
  rows: Row[];
  filterColumns?: number[];
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<{
    column: number;
    direction: 1 | -1;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const result = tableRows(rows, query, filters, sort);
  const paged = paginate(result, page);
  const active = rows.find((r) => r.id === selected);
  function close() {
    dialog.current?.close();
    setSelected(null);
    opener.current?.focus();
  }
  return (
    <section className="admin-data-section" aria-label={title}>
      <div className="admin-data-toolbar">
        <label className="field" htmlFor={id}>
          Cari {title}
          <input
            id={id}
            type="search"
            value={query}
            placeholder="Nama, lokasi, referensi…"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {filterColumns.map((index) => (
          <label className="field" key={index}>
            {columns[index]}
            <select
              value={filters[index] || ""}
              onChange={(e) => {
                setFilters({ ...filters, [index]: e.target.value });
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              {getFilterOptions(rows, index).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setQuery("");
            setFilters({});
            setSort(null);
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>
      <p role="status" className="small-muted">
        {result.length} dari {rows.length} hasil ·{" "}
        {result.length ? paged.startIndex + 1 : 0}–{paged.endIndex}
      </p>
      <div
        className="admin-table-container"
        tabIndex={0}
        role="region"
        aria-label={`Tabel ${title}, gulir horizontal untuk kolom lainnya`}
      >
        <table className="admin-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  aria-sort={
                    sort?.column === index
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="admin-sort"
                    onClick={() => {
                      setSort({
                        column: index,
                        direction:
                          sort?.column === index && sort.direction === 1
                            ? -1
                            : 1,
                      });
                      setPage(1);
                    }}
                  >
                    {column}{" "}
                    {sort?.column === index
                      ? sort.direction === 1
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </button>
                </th>
              ))}
              {rows.some((r) => r.detail) && <th scope="col">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paged.items.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => (
                  <td key={index}>
                    {row.display?.[index] ?? String(cell ?? "—")}
                  </td>
                ))}
                {rows.some((r) => r.detail) && (
                  <td>
                    {row.detail && (
                      <button
                        type="button"
                        className="button secondary"
                        aria-label={`Detail ${row.cells[0]}`}
                        onClick={(e) => {
                          opener.current = e.currentTarget;
                          setSelected(row.id);
                          dialog.current?.showModal();
                        }}
                      >
                        Detail / kelola
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!paged.items.length && (
              <tr>
                <td colSpan={columns.length + 1}>
                  Tidak ada data yang cocok. Ubah pencarian atau reset filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-data-pagination">
        <button
          type="button"
          className="button secondary"
          disabled={paged.page === 1}
          onClick={() => setPage(paged.page - 1)}
        >
          Sebelumnya
        </button>
        <span>
          Halaman {paged.page} / {paged.totalPages}
        </span>
        <button
          type="button"
          className="button secondary"
          disabled={paged.page === paged.totalPages}
          onClick={() => setPage(paged.page + 1)}
        >
          Berikutnya
        </button>
      </div>
      <dialog
        ref={dialog}
        className="admin-data-dialog"
        aria-label={`Detail ${title}`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="admin-dialog-heading">
          <h2>Detail {title}</h2>
          <button type="button" className="button secondary" onClick={close}>
            Tutup
          </button>
        </div>
        {active?.detail}
      </dialog>
    </section>
  );
}
export function AdminList({
  admin,
  title,
  columns,
  rows,
  children,
  filterColumns,
}: {
  admin: boolean;
  title: string;
  columns: string[];
  rows: TableRow[];
  children: ReactNode;
  filterColumns?: number[];
}) {
  if (!admin) return children;
  const details = Children.toArray(children);
  return (
    <AdminDataTable
      title={title}
      columns={columns}
      rows={rows.map((r, i) => ({
        ...r,
        detail:
          details.find((d) => isValidElement(d) && d.key === r.id) ??
          details[i],
      }))}
      filterColumns={filterColumns}
    />
  );
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return text(node.props.children);
  return "";
}
// Adapter for existing administration tables: keep every cell and authorized action intact.
export function AdminTable({
  title,
  children,
  filterColumns = [],
}: {
  title: string;
  children: ReactNode;
  filterColumns?: number[];
}) {
  const table = Children.toArray(children).find(
    isValidElement,
  ) as React.ReactElement<{ children: ReactNode }>;
  const parts = Children.toArray(table.props.children).filter(
    isValidElement,
  ) as React.ReactElement<{ children: ReactNode }>[];
  const head = Children.toArray(
    parts[0].props.children,
  )[0] as React.ReactElement<{ children: ReactNode }>;
  const columns = Children.toArray(head.props.children).map(text);
  const body = Children.toArray(parts[1].props.children).filter(
    isValidElement,
  ) as React.ReactElement<{ children: ReactNode }>[];
  const rows = body
    .filter(
      (r) =>
        !Children.toArray(r.props.children).some(
          (c) => isValidElement<{ colSpan?: number }>(c) && c.props.colSpan,
        ),
    )
    .map((r, i) => {
      const tdElements = Children.toArray(r.props.children).filter(
        isValidElement,
      ) as React.ReactElement<{ children?: ReactNode }>[];
      const cellContents = tdElements.map((td) => td.props.children);
      const actionIndex = columns.findIndex((c) => c === "Tindakan");
      if (actionIndex >= 0) {
        return {
          id: String(r.key ?? i),
          cells: cellContents.filter((_, n) => n !== actionIndex).map(text),
          display: cellContents.filter((_, n) => n !== actionIndex),
          detail: cellContents[actionIndex],
        };
      }
      return {
        id: String(r.key ?? i),
        cells: cellContents.map(text),
        display: cellContents,
      };
    });
  return (
    <AdminDataTable
      title={title}
      columns={columns.filter((c) => c !== "Tindakan")}
      rows={rows}
      filterColumns={filterColumns}
    />
  );
}
