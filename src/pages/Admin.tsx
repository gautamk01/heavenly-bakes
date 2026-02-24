import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  getCountFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  serverTimestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import LoginScreen from "@/components/admin/LoginScreen";
import AdminCakeCard from "@/components/admin/AdminCakeCard";
import CakeFormModal from "@/components/admin/CakeFormModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

const PAGE_SIZE = 12;

interface FirestoreCake {
  id: string;
  title: string;
  description?: string;
  src?: string;
  images?: string[];
  alt?: string;
  order?: number;
  [key: string]: unknown;
}

export default function Admin() {
  const [user, setUser] = useState<unknown>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cakes, setCakes] = useState<FirestoreCake[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState<DocumentSnapshot | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editCake, setEditCake] = useState<FirestoreCake | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreCake | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  const cakesRef = collection(db, "cakes");

  // Fetch total count
  const fetchCount = useCallback(async () => {
    try {
      const snap = await getCountFromServer(collection(db, "cakes"));
      setTotalCount(snap.data().count);
    } catch {
      /* ignore */
    }
  }, []);

  // Load first page
  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(cakesRef, orderBy("order", "asc"), limit(PAGE_SIZE));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FirestoreCake[];
      setCakes(data);
      setPage(1);
      setFirstDoc(snapshot.docs[0] ?? null);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
    } catch (err) {
      console.error("Error loading cakes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load next page
  const loadNextPage = async () => {
    if (!lastDoc) return;
    setLoading(true);
    try {
      const q = query(
        cakesRef,
        orderBy("order", "asc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FirestoreCake[];
      setCakes(data);
      setPage((p) => p + 1);
      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error("Error loading next page:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load previous page
  const loadPrevPage = async () => {
    if (!firstDoc || page <= 1) return;
    setLoading(true);
    try {
      const q = query(
        cakesRef,
        orderBy("order", "asc"),
        endBefore(firstDoc),
        limitToLast(PAGE_SIZE),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FirestoreCake[];
      setCakes(data);
      setPage((p) => p - 1);
      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error("Error loading prev page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCount();
      loadFirstPage();
    }
  }, [user, fetchCount, loadFirstPage]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Save (add/edit)
  const handleSave = async (data: {
    title: string;
    description: string;
    images: string[];
    isEdit: boolean;
    id?: string;
  }) => {
    const alt = data.title.substring(0, 60);
    const cakeData = {
      title: data.title,
      description: data.description,
      src: data.images[0],
      images: data.images,
      alt,
      updatedAt: serverTimestamp(),
    };

    if (data.isEdit && data.id) {
      const docRef = doc(db, "cakes", data.id);
      await updateDoc(docRef, cakeData);
    } else {
      await addDoc(collection(db, "cakes"), {
        ...cakeData,
        order: -Date.now(),
        createdAt: serverTimestamp(),
      });
    }

    await fetchCount();
    // After add, go to page 1 so the new cake is visible
    if (!data.isEdit) {
      await loadFirstPage();
    } else {
      // Re-fetch current page for edits
      await loadFirstPage();
      // Navigate back to current page if needed
      // For simplicity, just reload first page
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, "cakes", deleteTarget.id));
    await fetchCount();
    await loadFirstPage();
  };

  if (!authChecked) {
    return (
      <div className="admin-page">
        <div className="loading">
          <div className="spinner" />
          <p>Checking auth...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <LoginScreen onLogin={() => {}} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1 className="header-logo">Heavenly Bakes</h1>
          <span className="header-badge">Admin</span>
        </div>
        <div className="header-right">
          <Link to="/" className="btn-ghost">
            <span className="material-icons">home</span>
            <span>View Site</span>
          </Link>
          <button className="btn-ghost" onClick={() => signOut(auth)}>
            <span className="material-icons">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="material-icons">photo_library</span>
          <span>{totalCount}</span> Total Cakes
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditCake(null);
            setFormOpen(true);
          }}
        >
          <span className="material-icons">add</span>
          Add New Cake
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading cakes...</p>
        </div>
      ) : cakes.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">cake</span>
          <p>No cakes yet. Add your first creation!</p>
        </div>
      ) : (
        <>
          <div className="cake-grid">
            {cakes.map((cake) => (
              <AdminCakeCard
                key={cake.id}
                cake={cake}
                onEdit={() => {
                  setEditCake(cake);
                  setFormOpen(true);
                }}
                onDelete={() => {
                  setDeleteTarget(cake);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-ghost"
                onClick={loadPrevPage}
                disabled={!hasPrev}
              >
                <span className="material-icons">chevron_left</span>
                Prev
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-ghost"
                onClick={loadNextPage}
                disabled={!hasNext}
              >
                Next
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <CakeFormModal
        open={formOpen}
        editData={
          editCake
            ? {
                id: editCake.id,
                title: editCake.title,
                description: editCake.description || "",
                images: editCake.images || (editCake.src ? [editCake.src] : []),
              }
            : null
        }
        onClose={() => {
          setFormOpen(false);
          setEditCake(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={deleteOpen}
        cakeName={deleteTarget?.title || ""}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
