import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  /* ---------------- state ---------------- */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const { signIn, resetPasswordForEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  /* -------------- handlers -------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Login successful', description: 'Welcome!' });
        navigate('/pos');
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetStatus(null);
    try {
      // Use your auth provider's password reset function
      const { error } = await resetPasswordForEmail(resetEmail);
      if (error) {
        setResetStatus('error');
        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
      } else {
        setResetStatus('success');
        toast({ title: 'Reset email sent', description: 'Check your inbox for reset instructions.', variant: 'default' });
      }
    } catch (err) {
      setResetStatus('error');
      toast({ title: 'Reset failed', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage: "url('/login-bg.jpg')"
      }}
    >
      <Card className="mx-auto w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center mb-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2954e0] text-white font-bold mr-2 text-lg">Z:</span>
              <span className="text-[#2954e0] font-semibold text-2xl px-4 py-2 bg-white rounded-xl">zapretail</span>
            </div>
            <span className="text-sm text-muted-foreground">Retail POS</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {forgotPasswordMode ? 'Reset Password' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {forgotPasswordMode
              ? 'Enter your email to receive a password reset link.'
              : 'Enter your credentials to sign in to your account'}
          </CardDescription>
        </CardHeader>
        {forgotPasswordMode ? (
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              {resetStatus === 'success' && (
                <div className="text-green-600 text-sm">Reset email sent! Check your inbox.</div>
              )}
              {resetStatus === 'error' && (
                <div className="text-red-600 text-sm">Failed to send reset email. Try again.</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-xs"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setResetStatus(null);
                }}
              >
                Back to login
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    tabIndex={-1}
                    onClick={() => setForgotPasswordMode(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
