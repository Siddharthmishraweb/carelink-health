import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card } from '../components/ui';

const features = [
  ['Digital queue', 'Wait from home. Live token, patients ahead, and a continuously updated arrival window.'],
  ['AI consultation notes', 'Draft summaries from what the clinician actually said. Doctor review is always required.'],
  ['Health timeline', 'See consultations, labs, prescriptions and follow-ups in one chronological journey.'],
  ['Family health', 'Book, track and remind for every member from one account.'],
  ['Health camps', 'Discover free camps, register, and walk in with a QR pass.'],
  ['Hospital command center', 'Beds, revenue, queues and departments on one live dashboard.'],
];

const plans = [
  ['Starter', '₹4,999', 'Clinics starting digital OPD, appointments and queue.'],
  ['Professional', '₹14,999', 'AI notes, pharmacy, laboratory, billing, camps and analytics.'],
  ['Enterprise', '₹39,999', 'Multi-branch, custom branding, advanced audit and dedicated support.'],
];

export default function Landing() {
  const user = useSelector((s) => s.auth.user);
  if (user) {
    const dest = {
      SUPER_ADMIN: '/super',
      HOSPITAL_ADMIN: '/admin',
      DOCTOR: '/doctor',
      PATIENT: '/app',
      RECEPTIONIST: '/reception',
      NURSE: '/nurse',
      PHARMACIST: '/pharmacy',
      LAB_TECHNICIAN: '/lab',
    }[user.role] || '/app';
    return <Navigate to={dest} replace />;
  }
  return (
    <div>
      <header className="d-flex justify-content-between align-items-center px-4 py-3 bg-white border-bottom">
        <strong className="display" style={{ fontSize: 26 }}>CareLink</strong>
        <div className="d-flex gap-2">
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
          <Link className="btn btn-navy" to="/register">Get started</Link>
        </div>
      </header>

      <section className="hero px-4 py-5">
        <div className="page-narrow py-5">
          <div className="chip mb-3">Hospital + patient + queue + records</div>
          <h1 className="hero-title">Healthcare,<br />connected.</h1>
          <p className="mt-4" style={{ maxWidth: 560, fontSize: 18, color: '#4b5563' }}>
            One intelligent platform for hospitals, doctors and patients — from booking and waiting at home to consultation, prescription, labs and follow-up.
          </p>
          <div className="d-flex gap-2 mt-4 flex-wrap">
            <Link className="btn btn-navy btn-lg" to="/register">Get started</Link>
            <Link className="btn btn-ghost btn-lg" to="/login">Book a demo</Link>
          </div>
        </div>
      </section>

      <section className="page-narrow py-5 px-3">
        <div className="row g-3">
          {features.map(([title, body]) => (
            <div className="col-md-4" key={title}>
              <Card>
                <h4>{title}</h4>
                <p className="muted mb-0">{body}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section className="page-narrow px-3 pb-5">
        <h2 className="mb-4">Built for every role in the hospital</h2>
        <div className="row g-3">
          {['Patients', 'Doctors', 'Reception', 'Nursing', 'Pharmacy', 'Laboratory', 'Administrators'].map((role) => (
            <div className="col-6 col-md-3" key={role}>
              <Card><strong>{role}</strong><div className="muted">Dedicated workspace</div></Card>
            </div>
          ))}
        </div>
      </section>

      <section className="page-narrow px-3 pb-5">
        <h2 className="mb-4">Hospital plans</h2>
        <div className="row g-3">
          {plans.map(([name, price, body]) => (
            <div className="col-md-4" key={name}>
              <Card>
                <div className="muted">{name}</div>
                <div className="stat-number my-2">{price}</div>
                <p className="muted">{body}</p>
                <Link className="btn btn-teal" to="/register">Start with {name}</Link>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section className="page-narrow px-3 pb-5">
        <Card>
          <h3>Is patient data isolated between hospitals?</h3>
          <p className="muted">Yes. CareLink is multi-tenant. A hospital cannot see another hospital’s private records unless an explicit, authorized sharing step is taken.</p>
          <h3>Does the AI prescribe?</h3>
          <p className="muted mb-0">No. It only drafts from stated information. A doctor must review and approve before anything becomes part of the medical record.</p>
        </Card>
      </section>
    </div>
  );
}
