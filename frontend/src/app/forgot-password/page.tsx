'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check Your Email" 
        subtitle={`We've sent recovery instructions to ${email}`}
      >
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-[#FFF7ED] p-6 rounded-[2rem] border-2 border-[#FDBA74]/20 shadow-xl shadow-orange-500/5">
              <KeyRound className="w-12 h-12 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Please check your inbox and follow the secure link to reset your workspace access credentials.
          </p>
          <div className="pt-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-[#F59E0B] hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Recover Access" 
      subtitle="Enter your email to reset your enterprise credentials."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <Input
          label="Work Email Address"
          type="email"
          placeholder="name@company.com"
          icon={<Mail className="w-5 h-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Processing Request...' : 'Send Recovery Link'}
        </Button>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-[#F59E0B] transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Remembered credentials?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
