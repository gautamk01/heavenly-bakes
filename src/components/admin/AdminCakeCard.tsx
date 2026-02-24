interface AdminCakeCardProps {
  cake: {
    id: string;
    title: string;
    description?: string;
    src?: string;
    images?: string[];
    alt?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export default function AdminCakeCard({
  cake,
  onEdit,
  onDelete,
}: AdminCakeCardProps) {
  const imgCount = cake.images ? cake.images.length : 1;

  return (
    <div className="cake-card">
      <img
        className="cake-card-img"
        src={cake.src || cake.images?.[0] || ""}
        alt={cake.alt || cake.title}
        loading="lazy"
      />
      <div className="cake-card-body">
        <h3 className="cake-card-title">{cake.title}</h3>
        <p className="cake-card-desc">{cake.description || "No description"}</p>
        <div className="cake-card-meta">
          <span className="material-icons" style={{ fontSize: "0.9rem" }}>
            photo
          </span>
          {imgCount} image{imgCount > 1 ? "s" : ""}
        </div>
      </div>
      <div className="cake-card-actions">
        <button className="edit-btn" onClick={onEdit}>
          <span className="material-icons">edit</span> Edit
        </button>
        <button className="delete-btn" onClick={onDelete}>
          <span className="material-icons">delete</span> Delete
        </button>
      </div>
    </div>
  );
}
