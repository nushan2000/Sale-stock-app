import React, { useState, useEffect, useCallback } from "react";
import API, { fmt, today } from "../api";
import DataTable from "../components/DataTable";
import FormDialog from "../components/FormDialog";
import Select from "react-select";

const EMPTY_ITEM = { productId: "", quantity: 1, unitCost: "", newPrice: "" };

const STATUS_COLORS = {
  PAID: "#22c55e",
  UNPAID: "#ef4444",
  PARTIAL: "#f59e0b",
};

const Purchases = () => {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState("");

  // View GRN details state
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [form, setForm] = useState({
    supplierId: "",
    purchaseDate: today(),
    paymentStatus: "UNPAID",
    paymentMethod: "CASH",
    notes: "",
    items: [{ ...EMPTY_ITEM }],
  });

  const load = useCallback(() => {
    setLoading(true);
    API.get("/purchases", { params: { search, from, to, page, size: 10 } })
      .then((r) => {
        setRows(r.data.content);
        setTotalPages(r.data.totalPages);
      })
      .catch(() => setError("Failed to load purchases"))
      .finally(() => setLoading(false));
  }, [search, from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    API.get("/suppliers/all")
      .then((r) => setSuppliers(r.data))
      .catch(() => {});

    // Fetch all products so products are always available in the GRN form
    API.get("/products/all")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : (r.data.content || []);
        setAllProducts(list);
        setProducts(list);
      })
      .catch(() => {
        API.get("/products", { params: { size: 1000 } })
          .then((r) => {
            const list = r.data.content || r.data || [];
            setAllProducts(list);
            setProducts(list);
          })
          .catch(() => {});
      });
  }, []);

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === "productId") {
      const availableList = products.length > 0 ? products : allProducts;
      const prod = availableList.find((p) => p.id == value);
      if (prod) {
        items[idx].unitCost = prod.cost !== undefined && prod.cost !== null ? prod.cost : 0;
        items[idx].newPrice = prod.retail !== undefined && prod.retail !== null ? prod.retail : "";
      }
    }
    setForm((f) => ({ ...f, items }));
  };

  const grandTotal = form.items.reduce(
    (s, i) => s + parseFloat(i.unitCost || 0) * parseInt(i.quantity || 1),
    0,
  );

  const submit = (e) => {
    e.preventDefault();
    API.post("/purchases", {
      ...form,
      items: form.items.map((i) => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        unitCost: parseFloat(i.unitCost || 0),
        newPrice:
          i.newPrice !== "" && i.newPrice !== undefined && i.newPrice !== null
            ? parseFloat(i.newPrice)
            : undefined,
      })),
    })
      .then(() => {
        setDialog(false);
        setForm({
          supplierId: "",
          purchaseDate: today(),
          paymentStatus: "UNPAID",
          paymentMethod: "CASH",
          notes: "",
          items: [{ ...EMPTY_ITEM }],
        });
        load();
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Purchase failed"),
      );
  };

  const supplierProducts = (supplierName) => {
    if (!supplierName) {
      setProducts(allProducts);
      return;
    }
    API.get(`/products/vendor/${supplierName}`)
      .then((r) => {
        if (r.data && r.data.length > 0) {
          setProducts(r.data);
        } else {
          setProducts(allProducts);
        }
      })
      .catch(() => setProducts(allProducts));
  };

  const viewPurchase = (id) => {
    API.get(`/purchases/${id}`)
      .then((r) => {
        setSelectedPurchase(r.data);
        setViewDialog(true);
      })
      .catch(() => setError("Failed to load GRN details"));
  };

  const activeProductList = products.length > 0 ? products : allProducts;
  const productOptions = [...activeProductList]
    .sort((a, b) => (a.stockNo || "").localeCompare(b.stockNo || ""))
    .map((p) => ({
      value: p.id,
      label: p.stockNo || "(no stock #)",
      description: p.description || "",
      stockNo: p.stockNo || "",
      cost: p.cost,
      retail: p.retail,
    }));

  const columns = [
    { key: "grnNumber", label: "GRN #" },
    {
      key: "supplier",
      label: "Supplier",
      render: (r) => r.supplier?.name || "Direct",
    },
    { key: "purchaseDate", label: "Date" },
    {
      key: "totalAmount",
      label: "Total",
      render: (r) => `$${fmt(r.totalAmount)}`,
    },
    {
      key: "paymentStatus",
      label: "Status",
      render: (r) => (
        <span
          className="badge"
          style={{
            background: STATUS_COLORS[r.paymentStatus] || "#64748b",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {r.paymentStatus}
        </span>
      ),
    },
    { key: "paymentMethod", label: "Method" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">📦 Purchases (GRN)</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setProducts(allProducts);
            setDialog(true);
          }}
        >
          + New GRN
        </button>
      </div>
      {error && (
        <div className="alert-error" onClick={() => setError("")}>
          {error} ✕
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        total={totalPages}
        page={page}
        onPageChange={setPage}
        onSearch={(s) => {
          setSearch(s);
          setPage(0);
        }}
        searchPlaceholder="Search GRN or supplier…"
        loading={loading}
        actions={(row) => (
          <button
            className="btn-icon"
            title="View GRN Products"
            onClick={() => viewPurchase(row.id)}
            style={{ fontSize: "15px", cursor: "pointer" }}
          >
            👁️
          </button>
        )}
        filters={
          <div className="dt-filter-row">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(0);
              }}
              className="filter-date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(0);
              }}
              className="filter-date"
            />
          </div>
        }
      />

      {/* New Purchase (GRN) Dialog */}
      <FormDialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="New Purchase (GRN)"
        size="xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDialog(false)}>
              Cancel
            </button>
            <button className="btn-primary" form="grn-form" type="submit">
              Save GRN
            </button>
          </>
        }
      >
        <form id="grn-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier</label>
              <select
                value={form.supplierId}
                onChange={(e) => {
                  const supplierId = e.target.value;
                  setForm((f) => ({ ...f, supplierId }));
                  const matchedSupplier = suppliers.find(
                    (s) => s.id.toString() === supplierId,
                  );
                  if (matchedSupplier) {
                    setSupplier(matchedSupplier.name);
                    supplierProducts(matchedSupplier.name);
                  } else {
                    setSupplier("");
                    setProducts(allProducts);
                  }
                }}
              >
                <option value="">No Supplier (Direct)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Purchase Date *</label>
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentStatus: e.target.value }))
                }
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentMethod: e.target.value }))
                }
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CREDIT">Credit</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <input
                type="text"
                placeholder="Optional notes or invoice reference..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 16 }}>Items</div>
          <table className="line-items-table">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Product</th>
                <th style={{ width: 75 }}>Qty</th>
                <th style={{ width: 110 }}>Unit Cost</th>
                <th style={{ width: 115 }}>New Price</th>
                <th style={{ width: 100 }}>Line Total</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <Select
                      options={productOptions}
                      isSearchable
                      placeholder="Search by code or description..."
                      value={
                        productOptions.find(
                          (o) => o.value === item.productId,
                        ) || null
                      }
                      filterOption={(option, input) => {
                        const searchInput = input.toLowerCase();
                        return (
                          (option.data.stockNo || "")
                            .toLowerCase()
                            .includes(searchInput) ||
                          (option.data.description || "")
                            .toLowerCase()
                            .includes(searchInput)
                        );
                      }}
                      formatOptionLabel={(option) => (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <strong>{option.stockNo}</strong>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              Cost: ${fmt(option.cost)} | Sell: ${fmt(option.retail)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {option.description}
                          </div>
                        </div>
                      )}
                      onChange={(selected) =>
                        updateItem(idx, "productId", selected?.value || "")
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                      style={{ width: 65 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Cost"
                      title="Unit Cost (updates product cost in inventory)"
                      value={item.unitCost}
                      onChange={(e) =>
                        updateItem(idx, "unitCost", e.target.value)
                      }
                      style={{ width: 95 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Selling"
                      title="New selling price (updates product retail price)"
                      value={item.newPrice}
                      onChange={(e) =>
                        updateItem(idx, "newPrice", e.target.value)
                      }
                      style={{ width: 95 }}
                    />
                  </td>
                  <td style={{ color: "white", fontWeight: 600 }}>
                    $
                    {fmt(
                      parseFloat(item.unitCost || 0) *
                        parseInt(item.quantity || 1),
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          items: f.items.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="btn-secondary btn-sm mt-2"
            onClick={() =>
              setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
            }
          >
            + Add Item
          </button>
          <div className="invoice-totals">
            <div className="totals-row">
              <span>Grand Total:</span>
              <strong style={{ color: "white" }}>${fmt(grandTotal)}</strong>
            </div>
          </div>
        </form>
      </FormDialog>

      {/* View GRN Details Dialog */}
      {selectedPurchase && (
        <FormDialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          title={`📦 GRN: ${selectedPurchase.grnNumber}`}
          size="lg"
          footer={
            <button className="btn-secondary" onClick={() => setViewDialog(false)}>
              Close
            </button>
          }
        >
          <div className="invoice-view">
            <div className="form-grid">
              <div>
                <strong>GRN #:</strong> {selectedPurchase.grnNumber}
              </div>
              <div>
                <strong>Supplier:</strong> {selectedPurchase.supplier?.name || "Direct"}
              </div>
              <div>
                <strong>Date:</strong> {selectedPurchase.purchaseDate}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className="badge"
                  style={{
                    background: STATUS_COLORS[selectedPurchase.paymentStatus] || "#64748b",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {selectedPurchase.paymentStatus}
                </span>
              </div>
              <div>
                <strong>Payment Method:</strong> {selectedPurchase.paymentMethod}
              </div>
              <div>
                <strong>Total Amount:</strong>{" "}
                <strong style={{ color: "#22c55e" }}>
                  ${fmt(selectedPurchase.totalAmount)}
                </strong>
              </div>
            </div>

            {selectedPurchase.notes && (
              <div className="info-box mt-2">
                <strong>Notes:</strong> {selectedPurchase.notes}
              </div>
            )}

            <div className="section-label mt-2" style={{ fontWeight: 600, fontSize: 14 }}>
              GRN Products ({selectedPurchase.items?.length || 0})
            </div>
            <div className="dt-table-wrap">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>#</th>
                    <th>Stock #</th>
                    <th>Product Description</th>
                    <th style={{ textAlign: "right", width: 70 }}>Qty</th>
                    <th style={{ textAlign: "right", width: 110 }}>Unit Cost</th>
                    <th style={{ textAlign: "right", width: 110 }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedPurchase.items || selectedPurchase.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="dt-empty">
                        No products found in this GRN
                      </td>
                    </tr>
                  ) : (
                    selectedPurchase.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{item.product?.stockNo || "—"}</strong>
                        </td>
                        <td>{item.product?.description || "—"}</td>
                        <td style={{ textAlign: "right" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>${fmt(item.unitCost)}</td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          ${fmt(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="invoice-totals">
              <div className="totals-row">
                <span>Total GRN Amount:</span>
                <strong style={{ color: "#22c55e", fontSize: 18 }}>
                  ${fmt(selectedPurchase.totalAmount)}
                </strong>
              </div>
            </div>
          </div>
        </FormDialog>
      )}
    </div>
  );
};

export default Purchases;
