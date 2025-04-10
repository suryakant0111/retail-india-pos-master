
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Building, User, CreditCard, Store, Wallet, SaveIcon } from 'lucide-react';

interface PaymentSettings {
  upiId: string;
  accountName: string;
  enableUpi: boolean;
  enableCash: boolean;
  enableCard: boolean;
}

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('payments');
  
  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: '7259538046@ybl',
    accountName: 'Retail POS Account',
    enableUpi: true,
    enableCash: true, 
    enableCard: true
  });
  
  // Business settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Retail POS',
    address: '123 Main Street, City',
    phone: '123-456-7890',
    email: 'contact@retailpos.com',
    gstNumber: 'GST1234567890',
  });
  
  useEffect(() => {
    // Load settings from localStorage
    try {
      const storedPaymentSettings = localStorage.getItem('paymentSettings');
      if (storedPaymentSettings) {
        setPaymentSettings(JSON.parse(storedPaymentSettings));
      }
      
      const storedBusinessSettings = localStorage.getItem('businessSettings');
      if (storedBusinessSettings) {
        setBusinessSettings(JSON.parse(storedBusinessSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);
  
  const handlePaymentSettingChange = (field: keyof PaymentSettings, value: string | boolean) => {
    setPaymentSettings({
      ...paymentSettings,
      [field]: value
    });
  };
  
  const handleBusinessSettingChange = (field: keyof BusinessSettings, value: string) => {
    setBusinessSettings({
      ...businessSettings,
      [field]: value
    });
  };
  
  const savePaymentSettings = () => {
    try {
      localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
      toast({
        title: "Settings Saved",
        description: "Payment settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings.",
        variant: "destructive",
      });
    }
  };
  
  const saveBusinessSettings = () => {
    try {
      localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
      toast({
        title: "Settings Saved",
        description: "Business settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: "Error",
        description: "Failed to save business settings.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="payments" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Settings
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building className="h-4 w-4 mr-2" />
            Business Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Configure your payment options and UPI details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">UPI Payment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                      id="upiId" 
                      value={paymentSettings.upiId}
                      onChange={(e) => handlePaymentSettingChange('upiId', e.target.value)}
                      placeholder="username@bankcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input 
                      id="accountName" 
                      value={paymentSettings.accountName}
                      onChange={(e) => handlePaymentSettingChange('accountName', e.target.value)}
                      placeholder="Name on UPI Account"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Enabled Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4" />
                      <Label htmlFor="enableUpi" className="font-normal">UPI Payments</Label>
                    </div>
                    <Switch 
                      id="enableUpi" 
                      checked={paymentSettings.enableUpi}
                      onCheckedChange={(checked) => handlePaymentSettingChange('enableUpi', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4" />
                      <Label htmlFor="enableCash" className="font-normal">Cash Payments</Label>
                    </div>
                    <Switch 
                      id="enableCash" 
                      checked={paymentSettings.enableCash}
                      onCheckedChange={(checked) => handlePaymentSettingChange('enableCash', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <Label htmlFor="enableCard" className="font-normal">Card Payments</Label>
                    </div>
                    <Switch 
                      id="enableCard" 
                      checked={paymentSettings.enableCard}
                      onCheckedChange={(checked) => handlePaymentSettingChange('enableCard', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={savePaymentSettings}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Configure your business details for receipts and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    value={businessSettings.businessName}
                    onChange={(e) => handleBusinessSettingChange('businessName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input 
                    id="gstNumber" 
                    value={businessSettings.gstNumber}
                    onChange={(e) => handleBusinessSettingChange('gstNumber', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={businessSettings.address}
                  onChange={(e) => handleBusinessSettingChange('address', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={businessSettings.phone}
                    onChange={(e) => handleBusinessSettingChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={businessSettings.email}
                    onChange={(e) => handleBusinessSettingChange('email', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveBusinessSettings}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Business Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
