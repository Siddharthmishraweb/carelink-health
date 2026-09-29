import React from 'react';
import { Spinner, Toast, ToastContainer } from 'react-bootstrap';

export function Card({ children, className = '' }) {
  return <div className={`card-soft ${className}`}>{children}</div>;
}

export function Stat({ label, value, hint }) {
  return (
    <Card>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      <div className="stat-number mt-2">{value}</div>
      {hint ? <div className="muted mt-2" style={{ fontSize: 12 }}>{hint}</div> : null}
    </Card>
  );
}

export function Empty({ title = 'Nothing here yet', body }) {
  return (
    <div className="empty">
      <h4>{title}</h4>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton mb-3" style={{ height: 48 }} />
      ))}
    </div>
  );
}

export function Notice({ show, onClose, message, variant = 'success' }) {
  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast bg={variant === 'success' ? 'light' : 'danger'} show={show} onClose={onClose} delay={2800} autohide>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export function Chip({ children, tone = '' }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}
