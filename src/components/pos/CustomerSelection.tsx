
import React, { useState } from 'react';
import { UserRound, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Customer } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CustomerSelectionProps {
  customer: Customer | null;
  customers: Customer[];
  setCustomer: (customer: Customer | null) => void;
  onNewCustomerClick: () => void;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  customer,
  customers,
  setCustomer,
  onNewCustomerClick
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredCustomers = customers.filter(cust =>
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cust.phone && cust.phone.includes(searchTerm)) ||
    (cust.email && cust.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCustomer = (customer: Customer | null) => {
    setCustomer(customer);
    toast({
      title: "Customer Selected",
      description: customer ? `${customer.name} added to transaction` : "Walk-in customer selected",
    });
    // Close the dialog automatically after selection
    setIsDialogOpen(false);
    // Clear search term when dialog closes
    setSearchTerm('');
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex-grow flex items-center justify-between" size="sm">
            <div className="flex items-center">
              <UserRound className="h-4 w-4 mr-2" />
              {customer ? customer.name : 'Select Customer'}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            placeholder="Search customers by name, phone, or email"
            className="w-full mb-2 px-3 py-2 border rounded text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleSelectCustomer(null)}
            >
              Walk-in Customer
            </Button>
            {filteredCustomers.map((cust) => (
              <Card key={cust.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectCustomer(cust)}>
                <CardContent className="p-4">
                  <div className="font-medium">{cust.name}</div>
                  <div className="text-sm text-muted-foreground">{cust.phone}</div>
                  {cust.email && <div className="text-sm text-muted-foreground">{cust.email}</div>}
                  {cust.loyaltyPoints !== undefined && (
                    <div className="mt-1 text-xs">Loyalty Points: {cust.loyaltyPoints}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="outline" 
        size="icon"
        onClick={onNewCustomerClick}
        title="Add new customer"
      >
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  );
};
