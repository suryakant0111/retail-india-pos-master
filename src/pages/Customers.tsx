
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, UserPlus, Phone, Mail, MapPin, Edit, UserRound } from 'lucide-react';
import { mockCustomers } from '@/data/mockData';
import { Customer } from '@/types';
import { useToast } from '@/components/ui/use-toast';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load customers from localStorage
    try {
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        const parsedCustomers = JSON.parse(storedCustomers);
        
        // Convert string dates back to Date objects
        const processedCustomers = parsedCustomers.map((customer: any) => ({
          ...customer,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }));
        
        setCustomers([...mockCustomers, ...processedCustomers]);
      } else {
        setCustomers([...mockCustomers]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([...mockCustomers]);
    }
  }, []);
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleAddNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Missing Information",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }
    
    const now = new Date();
    const newCustomerId = `CUST${Date.now().toString().slice(-6)}`;
    
    const customerToAdd: Customer = {
      id: newCustomerId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      address: newCustomer.address || undefined,
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    // Update state with new customer
    const updatedCustomers = [...customers, customerToAdd];
    setCustomers(updatedCustomers);
    
    // Get only the user-added customers for localStorage
    const currentStoredCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    localStorage.setItem('customers', JSON.stringify([...currentStoredCustomers, customerToAdd]));
    
    setNewCustomerDialog(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    
    toast({
      title: "Customer Added",
      description: `${customerToAdd.name} has been added to your customer database.`,
      variant: "success",
    });
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Added On</TableHead>
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
                    <TableCell>{customer.createdAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserRound className="h-10 w-10 mb-2" />
                      <p>No customers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
