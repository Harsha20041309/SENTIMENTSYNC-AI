import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex bg-white font-sans text-[13px]">
      {/* Left Side: Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#FFF7ED] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#FBBF24]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-[#F59E0B]/5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="inline-block bg-[#F59E0B] p-4 rounded-3xl shadow-2xl shadow-orange-500/20 transform hover:scale-105 transition-transform">
            <BrainCircuit className="w-16 h-16 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-[#1F2937] tracking-tighter leading-none">
              SentimentSync <span className="text-[#F59E0B]">AI</span>
            </h1>
            <p className="text-lg font-medium text-slate-500 leading-relaxed">
              Analyze, synchronize, and master your workspace sentiment with enterprise-grade AI intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-[#FDBA74]/20 shadow-sm">
              <div className="text-2xl font-black text-[#F59E0B]">98%</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Accuracy</div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-[#FDBA74]/20 shadow-sm">
              <div className="text-2xl font-black text-[#F59E0B]">24/7</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>
        
        {/* Footer info for branding */}
        <div className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
          Powered by SentimentSync Enterprise Engine
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 bg-white">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12 flex flex-col items-center gap-4">
          <div className="bg-[#F59E0B] p-3 rounded-2xl shadow-lg">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#1F2937]">SentimentSync AI</h1>
        </div>

        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[#1F2937] tracking-tight">{title}</h2>
            <p className="text-slate-400 font-medium">{subtitle}</p>
          </div>

          {children}

          <div className="pt-6 text-center">
            <p className="text-slate-400 font-medium">
              &copy; 2024 SentimentSync AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
