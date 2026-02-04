'use client';

import { Suspense } from 'react';
import { StatCard, RecentActivity, Charts, Overview } from './AdminDashboardClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Welcome to the admin dashboard, manage your tuning portal here.
        </p>
      </div>

      {/* Stats section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Overview
        </h2>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        }>
          <Overview />
        </Suspense>
      </section>

      {/* Charts section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Analytics
        </h2>
        <Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow p-4"><LoadingSpinner /></div>}>
          <Charts />
        </Suspense>
      </section>

      {/* Recent activity section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <Suspense fallback={<div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-[300px]"><LoadingSpinner /></div>}>
          <RecentActivity />
        </Suspense>
      </section>
    </div>
  );
}
