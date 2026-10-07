"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import styles from "./login.module.css";
import { API } from "@/app/config/api";

export default function LoginPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false); 

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });



  
  useEffect(() => {
    setMounted(true);
    setFormData({ email: "", password: "" });
  }, []);

  if (!mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();

      // ✅ FIRST: API CALL
      const res = await axios.get(
        `${API}/users?email=${email}`
      );

      // ✅ THEN: GET USER
      const user = res.data?.[0];

      // ✅ THEN: CHECK PASSWORD
      if (user && user.password === password) {
        localStorage.setItem("user", JSON.stringify(user));

        switch (user.role) {
          case "Administrator":
            router.push("/admin");
            break;
          case "Educator":
            router.push("/educator");
            break;
          default:
            router.push("/student");
        }
      } else {
        alert("❌ Invalid email or password");
      }

    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      if (err.code === "ERR_NETWORK") {
        alert("⚠️ Unable to connect server");
      } else {
        alert("⚠️ Something went wrong");
      }
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.authCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#ea580c", fontWeight: 700, fontSize: "0.88rem", background: "#fff7ed", padding: "6px 12px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
            ← Back to Home
          </Link>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>Quill Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "0.5rem" }}>
          <img src="/quill_logo.jpg" alt="Quill Logo" style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover" }} />
          <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f97316" }}>Quill</span>
        </div>
        <h2>Sign In to Quill Portal</h2>

        <form onSubmit={handleLogin} autoComplete="off">
          <input
            name="email"
            type="email"
            placeholder="Enter email"
            value={formData.email || ""}
            onChange={handleChange}
            autoComplete="off"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Enter password"
            value={formData.password || ""}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <button type="submit">Login
           
          </button>
        </form>

        <p>
          New User? <Link href="/register">Signup</Link>
        </p>
      </div>
    </main>
  );
}