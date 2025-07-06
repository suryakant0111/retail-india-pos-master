
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon, ShoppingBag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState('shopkeeper');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignup) {
        const { error } = await signUp(email, password, role);
        if (error) {
          toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Signup successful', description: 'You can now log in.', variant: 'default' });
          setIsSignup(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Login successful', description: 'Welcome!', variant: 'default' });
          navigate('/pos');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-pos-blue text-white p-3 rounded-full">
              <ShoppingBag size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Retail POS</CardTitle>
          <CardDescription>
            {isSignup ? 'Create a new account' : 'Enter your credentials to sign in to your account'}
          </CardDescription>
        </CardHeader>
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
            </div>
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full border rounded px-2 py-2"
                >
                  <option value="shopkeeper">Shopkeeper</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isSignup ? 'Signing up...' : 'Signing in...') : (isSignup ? 'Sign up' : 'Sign in')}
            </Button>
            <div className="flex items-center w-full justify-center">
              <span className="text-xs text-muted-foreground">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <Button
                type="button"
                variant="link"
                className="ml-2 p-0 h-auto text-xs"
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
