'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-20">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-[#FFF7ED] p-8 md:p-12 border-b border-[#FDBA74]/15 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#F59E0B] p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1F2937] tracking-tight">Terms of Service</h1>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-12">Effective Date: June 2026</p>
          </div>
          <Link href="/login" className="hidden md:flex items-center gap-2 text-sm font-black text-[#F59E0B] hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        
        <div className="p-8 md:p-12 space-y-10 text-slate-600 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">1. Agreement to Terms</h2>
            <p className="text-sm font-medium">
              By accessing SentimentSync AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this enterprise platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">2. Use License</h2>
            <p className="text-sm font-medium">
              Permission is granted to use SentimentSync AI for enterprise sentiment analysis. This is a license, not a transfer of title, and under this license you may not attempt to decompile or reverse engineer any AI software contained on the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">3. AI Accuracy</h2>
            <p className="text-sm font-medium">
              While our AI engine is highly sophisticated, sentiment analysis results are provided for informational purposes. Users should exercise professional judgment when interpreting AI-generated insights and recommendations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1F2937] uppercase tracking-wider">4. Workspace Security</h2>
            <p className="text-sm font-medium">
              Users are responsible for maintaining the confidentiality of their enterprise credentials. Any suspicious activity should be reported to the workspace administrator immediately.
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
