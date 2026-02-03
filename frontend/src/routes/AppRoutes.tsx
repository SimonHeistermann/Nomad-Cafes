import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import About from '@/pages/About';
import Account from '@/pages/Account';
import Favorites from '@/pages/Favorites';
import MyReviews from '@/pages/MyReviews';
import ListingDetail from '@/pages/ListingDetail';
import ListingReviews from '@/pages/ListingReviews';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import FAQ from '@/pages/FAQ';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public routes with feature error boundaries */}
    <Route path="/" element={<FeatureErrorBoundary feature="home"><Home /></FeatureErrorBoundary>} />
    <Route path="/explore" element={<FeatureErrorBoundary feature="explore"><Explore /></FeatureErrorBoundary>} />
    <Route path="/about" element={<FeatureErrorBoundary feature="content"><About /></FeatureErrorBoundary>} />
    <Route path="/listing/:id" element={<FeatureErrorBoundary feature="listing"><ListingDetail /></FeatureErrorBoundary>} />
    <Route path="/listing/:id/reviews" element={<FeatureErrorBoundary feature="reviews"><ListingReviews /></FeatureErrorBoundary>} />

    {/* Auth routes with error boundaries */}
    <Route path="/login" element={<FeatureErrorBoundary feature="auth"><Login /></FeatureErrorBoundary>} />
    <Route path="/register" element={<FeatureErrorBoundary feature="auth"><Register /></FeatureErrorBoundary>} />
    <Route path="/forgot-password" element={<FeatureErrorBoundary feature="auth"><ForgotPassword /></FeatureErrorBoundary>} />
    <Route path="/reset-password" element={<FeatureErrorBoundary feature="auth"><ResetPassword /></FeatureErrorBoundary>} />
    <Route path="/verify-email" element={<FeatureErrorBoundary feature="auth"><VerifyEmail /></FeatureErrorBoundary>} />

    {/* Static pages with error boundaries */}
    <Route path="/faq" element={<FeatureErrorBoundary feature="content"><FAQ /></FeatureErrorBoundary>} />
    <Route path="/terms" element={<FeatureErrorBoundary feature="content"><TermsOfService /></FeatureErrorBoundary>} />
    <Route path="/privacy" element={<FeatureErrorBoundary feature="content"><PrivacyPolicy /></FeatureErrorBoundary>} />

    {/* Protected routes - require authentication + feature error boundaries */}
    <Route path="/account" element={
      <ProtectedRoute>
        <FeatureErrorBoundary feature="account">
          <Account />
        </FeatureErrorBoundary>
      </ProtectedRoute>
    } />
    <Route path="/favorites" element={
      <ProtectedRoute>
        <FeatureErrorBoundary feature="favorites">
          <Favorites />
        </FeatureErrorBoundary>
      </ProtectedRoute>
    } />
    <Route path="/bookmarks" element={<Navigate to="/favorites" replace />} />
    <Route path="/my-reviews" element={
      <ProtectedRoute>
        <FeatureErrorBoundary feature="reviews">
          <MyReviews />
        </FeatureErrorBoundary>
      </ProtectedRoute>
    } />

    {/* Redirects */}
    <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
