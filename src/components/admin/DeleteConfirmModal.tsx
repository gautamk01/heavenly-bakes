import { useState, useEffect, useCallback } from "react";

interface DeleteConfirmModalProps {
  open: boolean;
  cakeName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  open,
  cakeName,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete. Check console.");
    } finally {
      setDeleting(false);
    }
  }, [onConfirm, onClose]);

  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card modal-small">
        <div className="modal-header">
          <h2>Delete Cake</h2>
          <button className="btn-icon" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <p className="delete-msg">
          Are you sure you want to delete <strong>{cakeName}</strong>? This will
          also remove all images. This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={deleting}
            onClick={handleConfirm}
          >
            <span className="material-icons">
              {deleting ? "hourglass_empty" : "delete"}
            </span>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
