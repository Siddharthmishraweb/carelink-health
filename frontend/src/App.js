import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppLayout from './layouts/AppLayout';
import PatientLayout from './layouts/PatientLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientHome from './pages/patient/Home';
import PatientSearch from './pages/patient/Search';
import PatientQueue from './pages/patient/Queue';
import PatientRecords from './pages/patient/Records';
import PatientFamily from './pages/patient/Family';
import PatientCamps from './pages/patient/Camps';
import PatientEmergency from './pages/patient/Emergency';
import PatientBills from './pages/patient/Bills';
import PatientDocs from './pages/patient/Documents';
import DoctorHome from './pages/doctor/Home';
import DoctorConsult from './pages/doctor/Consult';
import DoctorPatients from './pages/doctor/Patients';
import AdminHome from './pages/admin/Home';
import AdminPeople from './pages/admin/People';
import AdminOps from './pages/admin/Ops';
import ReceptionHome from './pages/staff/Reception';
import NurseHome from './pages/staff/Nurse';
import PharmacyHome from './pages/staff/Pharmacy';
import LabHome from './pages/staff/Lab';
import SuperHome from './pages/super/Home';
import Display from './pages/Display';

function Guard({ roles, children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function homeFor(role) {
  return {
    SUPER_ADMIN: '/super',
    HOSPITAL_ADMIN: '/admin',
    DOCTOR: '/doctor',
    PATIENT: '/app',
    RECEPTIONIST: '/reception',
    NURSE: '/nurse',
    PHARMACIST: '/pharmacy',
    LAB_TECHNICIAN: '/lab',
  }[role] || '/login';
}

export default function App() {
  const user = useSelector((s) => s.auth.user);
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/display/:hospitalId?" element={<Display />} />

      <Route path="/app" element={<Guard roles={['PATIENT']}><PatientLayout /></Guard>}>
        <Route index element={<PatientHome />} />
        <Route path="search" element={<PatientSearch />} />
        <Route path="queue/:appointmentId" element={<PatientQueue />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="family" element={<PatientFamily />} />
        <Route path="camps" element={<PatientCamps />} />
        <Route path="emergency" element={<PatientEmergency />} />
        <Route path="bills" element={<PatientBills />} />
        <Route path="documents" element={<PatientDocs />} />
      </Route>

      <Route element={<Guard roles={['DOCTOR']}><AppLayout /></Guard>}>
        <Route path="/doctor" element={<DoctorHome />} />
        <Route path="/doctor/queue" element={<DoctorHome />} />
        <Route path="/doctor/consult/:appointmentId" element={<DoctorConsult />} />
        <Route path="/doctor/patients" element={<DoctorPatients />} />
        <Route path="/doctor/referrals" element={<DoctorPatients mode="referrals" />} />
      </Route>

      <Route element={<Guard roles={['HOSPITAL_ADMIN']}><AppLayout /></Guard>}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/staff" element={<AdminPeople />} />
        <Route path="/admin/patients" element={<AdminPeople mode="patients" />} />
        <Route path="/admin/appointments" element={<AdminOps mode="appointments" />} />
        <Route path="/admin/beds" element={<AdminOps mode="beds" />} />
        <Route path="/admin/pharmacy" element={<AdminOps mode="pharmacy" />} />
        <Route path="/admin/labs" element={<AdminOps mode="labs" />} />
        <Route path="/admin/billing" element={<AdminOps mode="billing" />} />
        <Route path="/admin/camps" element={<AdminOps mode="camps" />} />
        <Route path="/admin/inventory" element={<AdminOps mode="inventory" />} />
        <Route path="/admin/announcements" element={<AdminOps mode="announcements" />} />
      </Route>

      <Route element={<Guard roles={['RECEPTIONIST']}><AppLayout /></Guard>}>
        <Route path="/reception" element={<ReceptionHome />} />
        <Route path="/reception/patients" element={<AdminPeople mode="patients" />} />
        <Route path="/reception/billing" element={<AdminOps mode="billing" />} />
      </Route>

      <Route element={<Guard roles={['NURSE']}><AppLayout /></Guard>}>
        <Route path="/nurse" element={<NurseHome />} />
        <Route path="/nurse/beds" element={<AdminOps mode="beds" />} />
      </Route>

      <Route element={<Guard roles={['PHARMACIST']}><AppLayout /></Guard>}>
        <Route path="/pharmacy" element={<PharmacyHome />} />
        <Route path="/pharmacy/stock" element={<AdminOps mode="inventory" />} />
      </Route>

      <Route element={<Guard roles={['LAB_TECHNICIAN']}><AppLayout /></Guard>}>
        <Route path="/lab" element={<LabHome />} />
        <Route path="/lab/catalog" element={<AdminOps mode="labs" />} />
      </Route>

      <Route element={<Guard roles={['SUPER_ADMIN']}><AppLayout /></Guard>}>
        <Route path="/super" element={<SuperHome />} />
        <Route path="/super/hospitals" element={<SuperHome tab="hospitals" />} />
        <Route path="/super/users" element={<SuperHome tab="users" />} />
        <Route path="/super/plans" element={<SuperHome tab="plans" />} />
        <Route path="/super/camps" element={<SuperHome tab="camps" />} />
        <Route path="/super/tickets" element={<SuperHome tab="tickets" />} />
        <Route path="/super/audit" element={<SuperHome tab="audit" />} />
      </Route>
    </Routes>
  );
}
