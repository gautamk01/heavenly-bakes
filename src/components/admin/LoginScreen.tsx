import { useState, useRef } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function getAuthErrorMessage(code: string) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Login failed. Please try again.";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      setError(getAuthErrorMessage(firebaseErr.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-logo">Heavenly Bakes</h1>
        <p className="login-subtitle">Admin Portal</p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              ref={emailRef}
              type="email"
              id="login-email"
              required
              placeholder="admin@heavenlybakes.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              ref={passwordRef}
              type="password"
              id="login-password"
              required
              placeholder="Enter password"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            <span className="material-icons">login</span>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
