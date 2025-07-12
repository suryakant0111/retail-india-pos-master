import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentGatewayService } from '@/services/payment-gateway';
import { AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    payment_gateway: 'cashfree' as 'cashfree' | 'razorpay' | 'phonepe',
    api_key: '',
    api_secret: '',
    webhook_secret: '',
    merchant_id: '',
    cashfree_app_id: '',
    cashfree_secret_key: '',
    cashfree_environment: 'TEST' as 'TEST' | 'PROD'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const paymentService = new PaymentGatewayService();

  useEffect(() => {
    if (profile?.shop_id) {
      loadCurrentSettings();
    }
  }, [profile?.shop_id]);

  const loadCurrentSettings = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    try {
      const current = await paymentService.getShopPaymentSettings(profile.shop_id);
      if (current) {
        setCurrentSettings(current);
        setSettings({
          payment_gateway: current.payment_gateway,
          api_key: current.api_key,
          api_secret: current.api_secret,
          webhook_secret: current.webhook_secret || '',
          merchant_id: current.merchant_id || '',
          cashfree_app_id: current.cashfree_app_id || '',
          cashfree_secret_key: current.cashfree_secret_key || '',
          cashfree_environment: current.cashfree_environment || 'TEST'
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.shop_id) return;

    setSaving(true);
    try {
      await paymentService.saveShopPaymentSettings({
        shop_id: profile.shop_id,
        ...settings
      });

      toast({
        title: "Settings Saved",
        description: "Payment gateway settings have been updated successfully.",
        variant: "default",
      });

      await loadCurrentSettings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getGatewayInfo = (gateway: string) => {
    switch (gateway) {
      case 'cashfree':
        return {
          name: 'Cashfree',
          description: 'Popular payment gateway with free UPI transactions',
          setupUrl: 'https://www.cashfree.com/developers',
          features: ['Free UPI payments', 'Instant settlements', 'Webhook support']
        };
      case 'razorpay':
        return {
          name: 'Razorpay',
          description: 'Leading payment gateway with excellent UPI support',
          setupUrl: 'https://razorpay.com/docs/payments/',
          features: ['Free UPI payments', 'Advanced analytics', 'Multi-currency support']
        };
      case 'phonepe':
        return {
          name: 'PhonePe',
          description: 'Native UPI payment gateway',
          setupUrl: 'https://developer.phonepe.com/',
          features: ['Native UPI support', 'Zero transaction fees', 'Instant confirmations']
        };
      default:
        return {
          name: 'Unknown',
          description: '',
          setupUrl: '',
          features: []
        };
    }
  };

  const gatewayInfo = getGatewayInfo(settings.payment_gateway);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground">Configure your payment gateway for UPI transactions</p>
        </div>
        <CreditCard className="h-8 w-8 text-blue-600" />
      </div>

      {/* Current Status */}
      {currentSettings && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Payment gateway configured: {gatewayInfo.name}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gateway Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Payment Gateway</CardTitle>
          <CardDescription>
            Choose a payment gateway for UPI transactions. All listed gateways offer free UPI payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gateway">Payment Gateway</Label>
            <Select
              value={settings.payment_gateway}
              onValueChange={(value: 'cashfree' | 'razorpay' | 'phonepe') => 
                setSettings(prev => ({ ...prev, payment_gateway: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashfree">Cashfree</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="phonepe">PhonePe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gateway Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">{gatewayInfo.name}</h3>
            <p className="text-blue-800 text-sm mb-3">{gatewayInfo.description}</p>
            <div className="space-y-1">
              {gatewayInfo.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  {feature}
                </div>
              ))}
            </div>
            <a
              href={gatewayInfo.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Setup Guide →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your payment gateway API credentials. These will be encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Enter your API key"
            />
          </div>

          <div>
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              value={settings.api_secret}
              onChange={(e) => setSettings(prev => ({ ...prev, api_secret: e.target.value }))}
              placeholder="Enter your API secret"
            />
          </div>

          <div>
            <Label htmlFor="merchant_id">Merchant ID / UPI ID</Label>
            <Input
              id="merchant_id"
              value={settings.merchant_id}
              onChange={(e) => setSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
              placeholder="Enter your merchant ID or UPI ID"
            />
          </div>

          <div>
            <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
            <Input
              id="webhook_secret"
              type="password"
              value={settings.webhook_secret}
              onChange={(e) => setSettings(prev => ({ ...prev, webhook_secret: e.target.value }))}
              placeholder="Enter webhook secret for enhanced security"
            />
          </div>

          {/* Cashfree-specific fields */}
          {settings.payment_gateway === 'cashfree' && (
            <>
              <div>
                <Label htmlFor="cashfree_app_id">Cashfree App ID</Label>
                <Input
                  id="cashfree_app_id"
                  type="password"
                  value={settings.cashfree_app_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, cashfree_app_id: e.target.value }))}
                  placeholder="Enter your Cashfree App ID"
                />
              </div>

              <div>
                <Label htmlFor="cashfree_secret_key">Cashfree Secret Key</Label>
                <Input
                  id="cashfree_secret_key"
                  type="password"
                  value={settings.cashfree_secret_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, cashfree_secret_key: e.target.value }))}
                  placeholder="Enter your Cashfree Secret Key"
                />
              </div>

              <div>
                <Label htmlFor="cashfree_environment">Environment</Label>
                <Select
                  value={settings.cashfree_environment}
                  onValueChange={(value: 'TEST' | 'PROD') => 
                    setSettings(prev => ({ ...prev, cashfree_environment: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEST">Test (Sandbox)</SelectItem>
                    <SelectItem value="PROD">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Security Notice</h3>
              <p className="text-amber-700 text-sm">
                Your API credentials are encrypted and stored securely in our database. 
                We never store sensitive data in plain text. Each shop has their own 
                isolated payment gateway configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || !settings.api_key || !settings.api_secret}
          className="min-w-[120px]"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create Account</h4>
            <p className="text-sm text-muted-foreground">
              Sign up for a {gatewayInfo.name} merchant account at their official website.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Get API Credentials</h4>
            <p className="text-sm text-muted-foreground">
              Generate API key and secret from your {gatewayInfo.name} dashboard.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Configure Webhooks</h4>
            <p className="text-sm text-muted-foreground">
              Set up webhook URL: <code className="bg-gray-100 px-1 rounded">https://your-domain.com/api/webhooks/{settings.payment_gateway}</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Test Integration</h4>
            <p className="text-sm text-muted-foreground">
              Make a test transaction to verify everything is working correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettings; 