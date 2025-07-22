
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, UserPlus, Phone, Mail, MapPin, Edit, UserRound, Trash2 } from 'lucide-react';
import { Customer } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  // Remove old loading state
  const [error, setError] = useState<string | null>(null);
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const { toast } = useToast();
  const { profile } = useProfile();
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!profile?.shop_id) {
        setCustomers([]);
        setLoadingCustomers(false);
        return;
      }
      console.log('Fetching customers for shop_id:', profile.shop_id);
      setLoadingCustomers(true);
      setError(null);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('createdAt', { ascending: false });
      if (error) {
        setError('Failed to load customers');
        setCustomers([]);
      } else {
        // Map date fields to Date objects
        setCustomers(
          (data || []).map((c: any) => ({
            ...c,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          }))
        );
      }
      setLoadingCustomers(false);
    };
    fetchCustomers();
  }, [profile?.shop_id]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Missing Information",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }
    const now = new Date();
    console.log('Add Customer: profile.shop_id', profile.shop_id);
    const customerToAdd = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || null,
      address: newCustomer.address || null,
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      shop_id: profile.shop_id,
    };
    console.log('Add Customer: customerToAdd', customerToAdd);
    // Check for existing customer with same phone/email in this shop only
    const { data: existing, error: existingError } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', profile.shop_id);
    if (existingError) {
      toast({
        title: 'Error',
        description: 'Failed to check for duplicates: ' + existingError.message,
        variant: 'destructive',
      });
      return;
    }
    const duplicate = (existing || []).find(
      c => c.phone === newCustomer.phone || (newCustomer.email && c.email === newCustomer.email)
    );
    if (duplicate) {
      toast({
        title: 'Customer Exists',
        description: 'A customer with this phone or email already exists in this shop.',
        variant: 'destructive',
      });
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .insert([customerToAdd])
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer: ' + error.message,
        variant: 'destructive',
      });
      return;
    }
    setCustomers([
      {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      },
      ...customers,
    ]);
    setNewCustomerDialog(false);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
    toast({
      title: 'Customer Added',
      description: `${data.name} has been added to your customer database.`,
      variant: 'success',
    });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    } else {
      setCustomers(customers.filter(c => c.id !== customerId));
      toast({ title: 'Customer Deleted', description: 'Customer has been deleted.', variant: 'success' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setNewCustomerDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Customer
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Customer Database</CardTitle>
              <CardDescription>Manage and view your customer information</CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCustomers ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={40} className="w-full mb-2" />
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(customer.totalPurchases || 0)}
                      </TableCell>
                      <TableCell>{customer.loyaltyPoints || 0}</TableCell>
                      <TableCell>{customer.createdAt instanceof Date ? customer.createdAt.toLocaleDateString() : ''}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer.id)} title="Delete Customer">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UserRound className="h-10 w-10 mb-2" />
                        <p>No customers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={newCustomerDialog} onOpenChange={setNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="Email address (optional)"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                value={newCustomer.address || ''}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Address (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCustomerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
