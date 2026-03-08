import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Ingredient {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
}

const UNIT_OPTIONS = ["kg", "liter", "piece"];

type PanelView = "home" | "setup" | "manage";

export default function IngredientsPanel() {
  const [view, setView] = useState<PanelView>("home");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add form
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addUnit, setAddUnit] = useState("kg");
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("kg");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Ingredient[];
      setIngredients(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(
    () =>
      search
        ? ingredients.filter((i) =>
            i.name.toLowerCase().includes(search.toLowerCase()),
          )
        : ingredients,
    [ingredients, search],
  );

  const handleAdd = async () => {
    const name = addName.trim();
    const price = parseFloat(addPrice);
    if (!name || isNaN(price) || price <= 0) return;
    setAddSaving(true);
    try {
      await addDoc(collection(db, "ingredients"), {
        name,
        pricePerUnit: price,
        unit: addUnit,
        updatedAt: serverTimestamp(),
      });
      setAddName("");
      setAddPrice("");
      setAddUnit("kg");
      setAddMsg("✓ Added!");
      setTimeout(() => setAddMsg(""), 2000);
    } catch {
      setAddMsg("Failed to add.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editId) return;
    const name = editName.trim();
    const price = parseFloat(editPrice);
    if (!name || isNaN(price) || price <= 0) return;
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "ingredients", editId), {
        name,
        pricePerUnit: price,
        unit: editUnit,
        updatedAt: serverTimestamp(),
      });
      setEditId(null);
    } catch {
      /* ignore */
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "ingredients", id));
      setDeleteId(null);
    } catch {
      /* ignore */
    }
  };

  const startEdit = (item: Ingredient) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.pricePerUnit));
    setEditUnit(item.unit);
  };

  // ── Home: 2 action cards ────────────────────────────────────────────────
  if (view === "home") {
    return (
      <div className="ing-home">
        <button className="ing-card" onClick={() => setView("setup")}>
          <span className="material-icons ing-card-icon">add_circle</span>
          <span className="ing-card-title">Add Ingredient</span>
          <span className="ing-card-desc">
            Set up a new ingredient with its unit price
          </span>
        </button>
        <button className="ing-card" onClick={() => setView("manage")}>
          <span className="material-icons ing-card-icon">inventory_2</span>
          <span className="ing-card-title">Manage Ingredients</span>
          <span className="ing-card-desc">
            {loading
              ? "Loading…"
              : `${ingredients.length} ingredient${ingredients.length !== 1 ? "s" : ""} stored`}
          </span>
        </button>
      </div>
    );
  }

  // ── Setup: Add form ──────────────────────────────────────────────────────
  if (view === "setup") {
    return (
      <div className="ing-panel">
        <div className="ing-panel-header">
          <button className="ing-back" onClick={() => setView("home")}>
            <span className="material-icons">arrow_back</span>
          </button>
          <h3 className="ing-panel-title">Add Ingredient</h3>
        </div>

        <div className="ing-form-card">
          <div className="ing-form-row">
            <div className="ing-field ing-field-grow">
              <label className="ing-label">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Chocolate"
                className="ing-input"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="ing-field ing-field-sm">
              <label className="ing-label">Price (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                placeholder="100"
                className="ing-input"
              />
            </div>
            <div className="ing-field ing-field-xs">
              <label className="ing-label">Per</label>
              <select
                value={addUnit}
                onChange={(e) => setAddUnit(e.target.value)}
                className="ing-input"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="ing-form-footer">
            {addMsg && <span className="ing-msg">{addMsg}</span>}
            <button
              onClick={handleAdd}
              disabled={addSaving || !addName.trim() || !addPrice}
              className="ing-btn-add"
            >
              <span className="material-icons">add</span>
              {addSaving ? "Adding…" : "Add Ingredient"}
            </button>
          </div>
        </div>

        {/* Quick list preview */}
        {ingredients.length > 0 && (
          <p className="ing-hint">
            <span className="material-icons" style={{ fontSize: "14px" }}>
              info
            </span>
            {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}{" "}
            already stored.{" "}
            <button className="ing-link" onClick={() => setView("manage")}>
              View all →
            </button>
          </p>
        )}
      </div>
    );
  }

  // ── Manage: Table view ───────────────────────────────────────────────────
  return (
    <div className="ing-panel">
      <div className="ing-panel-header">
        <button className="ing-back" onClick={() => setView("home")}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h3 className="ing-panel-title">Manage Ingredients</h3>
        <button className="ing-btn-small" onClick={() => setView("setup")}>
          <span className="material-icons">add</span>
          Add
        </button>
      </div>

      {ingredients.length > 0 && (
        <div className="ing-search-wrap">
          <span className="material-icons ing-search-icon">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            className="ing-search"
          />
        </div>
      )}

      {loading ? (
        <div className="ing-empty">
          <div className="ing-spinner" />
          <p>Loading…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ing-empty">
          <span
            className="material-icons"
            style={{ fontSize: "40px", opacity: 0.25 }}
          >
            inventory_2
          </span>
          <p>{search ? "No results found." : "No ingredients yet."}</p>
        </div>
      ) : (
        <div className="ing-table-wrap">
          <table className="ing-table">
            <thead>
              <tr className="ing-thead-row">
                <th>Ingredient</th>
                <th className="text-right">Price</th>
                <th className="text-center">Unit</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) =>
                editId === item.id ? (
                  <tr key={item.id} className="ing-row ing-row-edit">
                    <td>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="ing-inline-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="ing-inline-input ing-inline-right"
                      />
                    </td>
                    <td className="text-center">
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="ing-inline-input"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="ing-row-actions">
                        <button
                          onClick={handleEdit}
                          disabled={editSaving}
                          className="ing-save-btn"
                        >
                          {editSaving ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="ing-cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="ing-row">
                    <td className="ing-cell-name">{item.name}</td>
                    <td className="ing-cell-price text-right">
                      Rs {item.pricePerUnit}
                    </td>
                    <td className="ing-cell-unit text-center">/{item.unit}</td>
                    <td>
                      {deleteId === item.id ? (
                        <div className="ing-row-actions">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="ing-delete-confirm-btn"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="ing-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="ing-row-actions ing-row-actions-hover">
                          <button
                            onClick={() => startEdit(item)}
                            className="ing-icon-btn"
                            title="Edit"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="ing-icon-btn ing-icon-btn-danger"
                            title="Delete"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
