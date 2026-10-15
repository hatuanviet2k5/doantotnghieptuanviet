import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { BookListPage } from '@/pages/BookListPage';
import { BookDetailPage } from '@/pages/BookDetailPage';
import { BookHoldPage } from '@/pages/BookHoldPage';
import { MyTicketsPage } from '@/pages/MyTicketsPage';
import { ShelfMgmtPage } from '@/pages/ShelfMgmtPage';
import { QRVerifyPage } from '@/pages/QRVerifyPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketManagementPage } from '@/pages/TicketManagementPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { ReaderCardPage } from '@/pages/ReaderCardPage';
import { BookManagementPage } from '@/pages/BookManagementPage';
import { AuditLogPage } from '@/pages/AuditLogPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Routes wrapped in Main Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/books" replace />} />
        
        {/* All Authenticated Users */}
        <Route path="books" element={<BookListPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />

        {/* Borrower Routes */}
        <Route
          path="hold/:bookId"
          element={
            <ProtectedRoute allowedRoles={['BORROWER', 'ADMIN', 'LIBRARIAN']}>
              <BookHoldPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-tickets"
          element={
            <ProtectedRoute allowedRoles={['BORROWER']}>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />

        {/* Librarian & Admin Routes */}
        <Route
          path="qr-verify"
          element={
            <ProtectedRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
              <QRVerifyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tickets"
          element={
            <ProtectedRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
              <TicketManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shelves"
          element={
            <ProtectedRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
              <ShelfMgmtPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="book-management"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BookManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reader-cards"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ReaderCardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback inside authenticated app */}
        <Route path="*" element={<Navigate to="/books" replace />} />
      </Route>

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
