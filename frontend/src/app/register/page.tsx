'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
      return;
    }
    
    setErrors({ ...errors, confirmPassword: '' });
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically login after registration or redirect to login
      // For now, let's just log them in if the backend returned a token (though my current backend register doesn't return a token, just the user)
      // Since my backend register only returns user, I'll redirect to login with a success message or just push to login.
      // Alternatively, I could modify the backend to return a token on register.
      // For simplicity, let's redirect to login.
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join SentimentSync AI and start synchronizing your workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-500 p-4 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Marcus Aurelius"
            icon={<User className="w-5 h-5" />}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
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
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            required
          />
        </div>

        <div className="px-1">
          <p className="text-[11px] text-slate-400 font-medium">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-[#F59E0B] hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-[#F59E0B] hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <Button type="submit" fullWidth disabled={isLoading}>
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating Workspace...' : 'Initialize Workspace Account'}
        </Button>

        <div className="text-center pt-4">
          <p className="text-slate-400 font-medium">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-[#F59E0B] font-bold hover:underline"
            >
              Sign In to Workspace
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
