import { useState, useRef, useEffect, useCallback } from "react";

// Cloudinary config from env
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface SelectedFile {
  file: File;
  preview: string;
}

interface CakeFormData {
  id?: string;
  title: string;
  description: string;
  images: string[];
}

interface CakeFormModalProps {
  open: boolean;
  editData?: CakeFormData | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    images: string[];
    isEdit: boolean;
    id?: string;
  }) => Promise<void>;
}

export default function CakeFormModal({
  open,
  editData,
  onClose,
  onSave,
}: CakeFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    visible: false,
    percent: 0,
    text: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editData?.id;

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (editData) {
        setTitle(editData.title);
        setDescription(editData.description);
        setExistingImages([...editData.images]);
        setSelectedFiles([]);
      } else {
        setTitle("");
        setDescription("");
        setExistingImages([]);
        setSelectedFiles([]);
      }
      setError("");
      setUploadProgress({ visible: false, percent: 0, text: "" });
    }
  }, [open, editData]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [selectedFiles]);

  const handleClose = useCallback(() => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
    onClose();
  }, [selectedFiles, onClose]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const handleFiles = (files: FileList) => {
    const totalCount = existingImages.length + selectedFiles.length;
    const remaining = 6 - totalCount;
    if (remaining <= 0) return;

    const newFiles = Array.from(files).slice(0, remaining);
    const newSelected: SelectedFile[] = [];
    newFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      newSelected.push({ file, preview: URL.createObjectURL(file) });
    });
    setSelectedFiles((prev) => [...prev, ...newSelected]);
  };

  const removeExisting = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeSelected = (idx: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Upload to Cloudinary
  async function uploadToCloudinary(
    file: File,
    onProgress: (p: number) => void,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "heavenly-bakes");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_UPLOAD_URL);
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      xhr.addEventListener("error", () =>
        reject(new Error("Upload network error")),
      );
      xhr.send(formData);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (existingImages.length === 0 && selectedFiles.length === 0) {
      setError("At least one image is required.");
      return;
    }

    setSaving(true);
    try {
      // Upload new images
      let newImageURLs: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadProgress({ visible: true, percent: 0, text: "Uploading..." });
        const total = selectedFiles.length;
        for (let i = 0; i < total; i++) {
          setUploadProgress({
            visible: true,
            percent: (i / total) * 100,
            text: `Uploading image ${i + 1} of ${total}...`,
          });
          const url = await uploadToCloudinary(
            selectedFiles[i].file,
            (fileProgress) => {
              const overall = ((i + fileProgress) / total) * 100;
              setUploadProgress((prev) => ({ ...prev, percent: overall }));
            },
          );
          newImageURLs.push(url);
        }
        setUploadProgress({ visible: false, percent: 0, text: "" });
      }

      const allImages = [...existingImages, ...newImageURLs];

      await onSave({
        title: title.trim(),
        description: description.trim(),
        images: allImages,
        isEdit,
        id: editData?.id,
      });

      handleClose();
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-card">
        <div className="modal-header">
          <h2>{isEdit ? "Edit Cake" : "Add New Cake"}</h2>
          <button className="btn-icon" onClick={handleClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="cake-title">Title *</label>
            <input
              type="text"
              id="cake-title"
              required
              placeholder="e.g. Chocolate Truffle Cake"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="cake-description">Description</label>
            <textarea
              id="cake-description"
              rows={3}
              placeholder="Describe this creation..."
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>
              Images *{" "}
              <span className="label-hint">
                (Max 6, first image is the cover)
              </span>
            </label>
            <div
              className={`drop-zone${dragOver ? " drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <span className="material-icons">cloud_upload</span>
              <p>
                Drag & drop images here or <strong>click to browse</strong>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Image Previews */}
            <div className="image-preview-grid">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="image-preview-item">
                  <img src={url} alt={`Image ${i + 1}`} />
                  <button
                    type="button"
                    className="remove-img"
                    onClick={() => removeExisting(i)}
                  >
                    ×
                  </button>
                  {i === 0 && selectedFiles.length === 0 && (
                    <span className="cover-badge">Cover</span>
                  )}
                </div>
              ))}
              {selectedFiles.map((f, i) => (
                <div key={`new-${i}`} className="image-preview-item">
                  <img src={f.preview} alt={`New image ${i + 1}`} />
                  <button
                    type="button"
                    className="remove-img"
                    onClick={() => removeSelected(i)}
                  >
                    ×
                  </button>
                  {i === 0 && existingImages.length === 0 && (
                    <span className="cover-badge">Cover</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.visible && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <p>{uploadProgress.text}</p>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <span className="material-icons">
                {saving ? "hourglass_empty" : "save"}
              </span>
              {saving ? "Saving..." : "Save Cake"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
