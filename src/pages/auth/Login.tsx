import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDataset } from '../../context/DatasetContext';
import { Logo } from '../../components/ui/Logo';
import { ArrowRight, Eye, EyeOff, Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { addDemoDataset } = useDataset();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
        setIsSubmitting(false);
      }
    }, 400);
  };

  const handleDemoAccess = () => {
    setIsSubmitting(true);
    setError('');
    setTimeout(() => {
      const result = login('demo@minddash.ai', 'demo123');
      if (result.success) {
        addDemoDataset();
        navigate('/dashboard');
      } else {
        setError('Could not access demo. Please sign up first.');
        setIsSubmitting(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your MindDash account</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {isDemo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
              <Sparkles size={14} /> Try the demo — click below to explore
            </div>
          )}

          {error && (
            <div className="px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input pl-10 pr-10"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          {isDemo && (
            <button type="button" onClick={handleDemoAccess} disabled={isSubmitting} className="w-full py-2.5 bg-card border border-card-border text-foreground rounded-lg hover:border-primary/40 transition-all cursor-pointer font-medium text-sm disabled:opacity-50 active:scale-[0.98]">
              Explore Demo Dashboard
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground pt-2">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="text-primary hover:underline cursor-pointer font-medium">
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}