import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import Header from './components/Header';
import Landing from './pages/Landing';
import Submit from './pages/Submit';
import FindingsView from './pages/FindingsView';
import ReviewWorkflow from './pages/ReviewWorkflow';
import GuidelinesView from './pages/GuidelinesView';
import PrivacySettings from './pages/PrivacySettings';

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/submissions/:id/findings" element={<FindingsView />} />
              <Route path="/submissions/:id/review" element={<ReviewWorkflow />} />
              <Route path="/guidelines" element={<GuidelinesView />} />
              <Route path="/settings" element={<PrivacySettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-200">BrandWarden</span>
                <span>— Evidence-First Brand Governance</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Northwind Outdoor Reference Implementation · 48-Hour Hackathon Build
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </RoleProvider>
  );
}
