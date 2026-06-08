'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://sentimentsync-ai-1.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your enterprise workspace to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-500 p-4 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            icon={<Mail className="w-5 h-5" />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              />
              <div className="w-5 h-5 bg-slate-50 border-2 border-slate-200 rounded-md peer-checked:bg-[#F59E0B] peer-checked:border-[#F59E0B] transition-all"></div>
              <svg className="absolute w-3 h-3 text-white left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember Me</span>
          </label>
          <Link 
            href="/forgot-password" 
            className="text-xs font-bold text-[#F59E0B] hover:underline uppercase tracking-wider"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={isLoading}>
          <LogIn className="w-4 h-4" />
          {isLoading ? 'Verifying...' : 'Sign In to Workspace'}
        </Button>

        <div className="text-center pt-4">
          <p className="text-slate-400 font-medium">
            Don&apos;t have an account?{' '}
            <Link 
              href="/register" 
              className="text-[#F59E0B] font-bold hover:underline"
            >
              Create Enterprise Account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
