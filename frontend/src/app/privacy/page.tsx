'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-20">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-[#FFF7ED] p-8 md:p-12 border-b border-[#FDBA74]/15 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#F59E0B] p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1F2937] tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-12">Last Updated: June 2026</p>
          </div>
          <Link href="/login" className="hidden md:flex items-center gap-2 text-sm font-black text-[#F59E0B] hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        
        <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">1. Data Collection</h2>
            <p className="text-sm font-medium">
              SentimentSync AI collects minimal personal data required for enterprise workspace authentication and sentiment analysis. This includes name, work email, and interaction history within the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">2. Use of Information</h2>
            <p className="text-sm font-medium">
              We use collected data strictly to provide AI-driven sentiment insights, generate reports, and maintain workspace security. Your data is never sold to third parties or used for external advertising.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">3. AI Processing</h2>
            <p className="text-sm font-medium">
              Messages processed by our sentiment engine are analyzed in real-time. We employ industry-standard encryption and anonymization protocols to ensure your enterprise communication remains private.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">4. Security Infrastructure</h2>
            <p className="text-sm font-medium">
              Our infrastructure is protected by multi-layer security protocols, including JWT-based authentication and SSL encryption for all data transmissions.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-100 flex justify-center">
             <Link href="/login" className="md:hidden flex items-center gap-2 text-sm font-black text-[#F59E0B] hover:gap-3 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back to Workspace
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
