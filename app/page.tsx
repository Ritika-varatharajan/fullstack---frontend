"use client";

import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* HEADER NAVBAR */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/quill_logo.jpg" alt="Quill Logo" style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} />
          <h1 className={styles.logo}>Quill<span>Portal</span></h1>
        </div>

        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="#about">About</Link>
          <Link href="#features">Features</Link>
          <Link href="#portals">Role Portals</Link>

          <Link href="/login" className={styles.btnPrimary}>Login</Link>
          <Link href="/register" className={styles.btnSecondary}>Register</Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badgeTag}>
            🚀 Next-Gen Evaluation & Analytics Platform
          </div>
          <h2>
            Smart <span className={styles.highlight}>Assessment & Evaluation</span> with Quill
          </h2>
          <p>
            Create, manage, assign, and evaluate assessments with ease. Built with role-based features for educators, administrators, and students.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/register" className={styles.btnPrimary}>
              Get Started Now →
            </Link>
            <Link href="/login" className={styles.btnSecondary}>
              Sign In to Portal
            </Link>
          </div>
        </div>

        <img src="/home.jpg" alt="Quill Platform" className={styles.heroImage} />
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className={styles.section}>
        <h2>About Quill</h2>
        <p className={styles.sectionSub}>
          Streamlining education and automated assessment evaluation
        </p>

        <div className={styles.card} style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p>
            <strong>Quill</strong> is a smart, interactive platform designed for creating, delivering, and evaluating tests 📝. 
            Educators can design customized question banks, assign tests to students, and inspect performance analytics 📊. 
            Students benefit from timed test taking ⏳, instant auto-graded answer sheets, and personalized performance progress tracking 🚀.
          </p>
        </div>
      </section>

      {/* KEY FEATURES SECTION */}
      <section id="features" className={styles.section}>
        <h2>Key Platform Features</h2>
        <p className={styles.sectionSub}>
          Everything you need for seamless assessment lifecycle management
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconBox}>📝</div>
            <h3>Smart Test Creation</h3>
            <p>Design multi-format questions including MCQs, True/False, Short Answer, and Essays with customized mark allocation.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}>⚡</div>
            <h3>Instant Auto-Grading</h3>
            <p>Automated grading engine processes submissions instantly and generates itemized answer sheet feedback.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}>📈</div>
            <h3>Visual Analytics</h3>
            <p>Track student score improvement trends, class accuracy percentages, and subject mastery breakdown.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconBox}>🛡️</div>
            <h3>Role Access Control</h3>
            <p>Dedicated dashboard views customized specifically for Administrators, Educators, and Students.</p>
          </div>
        </div>
      </section>

      {/* ROLE PORTALS SHOWCASE SECTION */}
      <section id="portals" className={styles.section} style={{ background: "#f1f5f9" }}>
        <h2>Dedicated Role Portals</h2>
        <p className={styles.sectionSub}>
          Explore how each role interacts with the platform
        </p>

        <div className={styles.rolePortalsGrid}>
          <div className={styles.rolePortalCard} style={{ borderTopColor: "#f97316" }}>
            <div>
              <span className={portalStyle("#fff7ed", "#ea580c")}>👨‍🏫 Educator Portal</span>
              <h3>Educator Dashboard</h3>
              <p>Create assessment templates, manage student rosters, assign tests, track class completion, and view question-by-question student answer sheets.</p>
            </div>
            <Link href="/educator" className={styles.portalBtn}>
              Launch Educator View →
            </Link>
          </div>

          <div className={styles.rolePortalCard} style={{ borderTopColor: "#0d9488" }}>
            <div>
              <span className={portalStyle("#ccfbf1", "#0f766e")}>🎓 Student Portal</span>
              <h3>Student Dashboard</h3>
              <p>Take assigned tests with live countdown timers, review pending deadlines, track score improvement trends, and view detailed answer breakdown modals.</p>
            </div>
            <Link href="/student" className={styles.portalBtn}>
              Launch Student View →
            </Link>
          </div>

          <div className={styles.rolePortalCard} style={{ borderTopColor: "#e11d48" }}>
            <div>
              <span className={portalStyle("#fff1f2", "#be123c")}>🛡️ Administrator Portal</span>
              <h3>Admin Command Center</h3>
              <p>Global system management, role access control, user account roster management, system notification audit logs, and global platform reports.</p>
            </div>
            <Link href="/admin" className={styles.portalBtn}>
              Launch Admin View →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>© 2026 Quill Academic Evaluation System | All Rights Reserved.</p>
      </footer>
    </div>
  );
}

function portalStyle(bg: string, color: string) {
  return styles.portalBadge;
}
