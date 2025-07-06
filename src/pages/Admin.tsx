import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Customer, Invoice } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminPage = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [pendingEmployees, setPendingEmployees] = useState<any[]>([]);
  const { toast } = useToast();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [newUserShopId, setNewUserShopId] = useState(profile?.shop_id || '');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    fetchPendingEmployees();
  }, [profile?.shop_id]);

  const fetchAll = async () => {
    if (!profile?.shop_id) return;
    const { data: productsData } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    const { data: customersData } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
    const { data: invoicesData } = await supabase.from('invoices').select('*').eq('shop_id', profile.shop_id);
    setProducts(productsData || []);
    setCustomers(customersData || []);
    setInvoices(invoicesData || []);
  };

  const fetchPendingEmployees = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('status', 'pending').eq('shop_id', profile.shop_id);
    setPendingEmployees(data || []);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
    if (!error) {
      toast({ title: 'Employee Approved', description: 'The employee has been approved.' });
      fetchPendingEmployees();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
    if (!error) {
      toast({ title: 'Employee Rejected', description: 'The employee has been rejected.' });
      fetchPendingEmployees();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // --- Product Edit/Delete ---
  const handleProductEditSave = async () => {
    if (!editProduct) return;
    const { id, ...fields } = editProduct;
    const { error } = await supabase.from('products').update(fields).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product Updated', description: 'Product updated successfully.' });
      setEditProduct(null);
      fetchAll();
    }
  };
  const handleProductDelete = async () => {
    if (!deleteProduct) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteProduct.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product Deleted', description: 'Product deleted successfully.' });
      setDeleteProduct(null);
      fetchAll();
    }
  };

  // --- Customer Edit/Delete ---
  const handleCustomerEditSave = async () => {
    if (!editCustomer) return;
    const { id, ...fields } = editCustomer;
    const { error } = await supabase.from('customers').update(fields).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Customer Updated', description: 'Customer updated successfully.' });
      setEditCustomer(null);
      fetchAll();
    }
  };
  const handleCustomerDelete = async () => {
    if (!deleteCustomer) return;
    const { error } = await supabase.from('customers').delete().eq('id', deleteCustomer.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Customer Deleted', description: 'Customer deleted successfully.' });
      setDeleteCustomer(null);
      fetchAll();
    }
  };

  // --- Invoice Edit/Delete ---
  const handleInvoiceEditSave = async () => {
    if (!editInvoice) return;
    const { id, ...fields } = editInvoice;
    const { error } = await supabase.from('invoices').update(fields).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice Updated', description: 'Invoice updated successfully.' });
      setEditInvoice(null);
      fetchAll();
    }
  };
  const handleInvoiceDelete = async () => {
    if (!deleteInvoice) return;
    const { error } = await supabase.from('invoices').delete().eq('id', deleteInvoice.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invoice Deleted', description: 'Invoice deleted successfully.' });
      setDeleteInvoice(null);
      fetchAll();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);
    try {
      const response = await fetch('http://localhost:3001/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          shop_id: newUserShopId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create user');
      setCreateUserSuccess('User created successfully!');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('employee');
    } catch (err: any) {
      setCreateUserError(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="mb-4 flex justify-end">
        <Link to="/shop">
          <Button variant="secondary">View Shop Details</Button>
        </Link>
      </div>
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your inventory and products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.barcode || '-'}</TableCell>
                      <TableCell className="text-right">₹{product.price}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditProduct(product)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Edit Product Dialog */}
          <Dialog open={!!editProduct} onOpenChange={open => !open && setEditProduct(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
              {editProduct && (
                <div className="space-y-2">
                  <Input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} placeholder="Name" />
                  <Input value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} placeholder="Category" />
                  <Input value={editProduct.barcode || ''} onChange={e => setEditProduct({ ...editProduct, barcode: e.target.value })} placeholder="Barcode" />
                  <Input type="number" value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })} placeholder="Price" />
                  <Input type="number" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: Number(e.target.value) })} placeholder="Stock" />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
                <Button onClick={handleProductEditSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Delete Product Dialog */}
          <Dialog open={!!deleteProduct} onOpenChange={open => !open && setDeleteProduct(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
              <p>Are you sure you want to delete <b>{deleteProduct?.name}</b>?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteProduct(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleProductDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Loyalty Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell className="text-right">{customer.loyaltyPoints || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditCustomer(customer)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteCustomer(customer)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Edit Customer Dialog */}
          <Dialog open={!!editCustomer} onOpenChange={open => !open && setEditCustomer(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
              {editCustomer && (
                <div className="space-y-2">
                  <Input value={editCustomer.name} onChange={e => setEditCustomer({ ...editCustomer, name: e.target.value })} placeholder="Name" />
                  <Input value={editCustomer.phone} onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} placeholder="Phone" />
                  <Input value={editCustomer.email || ''} onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} placeholder="Email" />
                  <Input value={editCustomer.address || ''} onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} placeholder="Address" />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCustomer(null)}>Cancel</Button>
                <Button onClick={handleCustomerEditSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Delete Customer Dialog */}
          <Dialog open={!!deleteCustomer} onOpenChange={open => !open && setDeleteCustomer(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Delete Customer</DialogTitle></DialogHeader>
              <p>Are you sure you want to delete <b>{deleteCustomer?.name}</b>?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteCustomer(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleCustomerDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage order history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customer ? invoice.customer.name : 'Walk-in Customer'}</TableCell>
                      <TableCell>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">₹{invoice.total}</TableCell>
                      <TableCell className="text-right">{invoice.paymentStatus}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditInvoice(invoice)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteInvoice(invoice)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Edit Invoice Dialog */}
          <Dialog open={!!editInvoice} onOpenChange={open => !open && setEditInvoice(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
              {editInvoice && (
                <div className="space-y-2">
                  <Input value={editInvoice.invoiceNumber} onChange={e => setEditInvoice({ ...editInvoice, invoiceNumber: e.target.value })} placeholder="Invoice #" />
                  <Input value={editInvoice.paymentStatus} onChange={e => setEditInvoice({ ...editInvoice, paymentStatus: e.target.value as Invoice["paymentStatus"] })} placeholder="Status" />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditInvoice(null)}>Cancel</Button>
                <Button onClick={handleInvoiceEditSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Delete Invoice Dialog */}
          <Dialog open={!!deleteInvoice} onOpenChange={open => !open && setDeleteInvoice(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Delete Invoice</DialogTitle></DialogHeader>
              <p>Are you sure you want to delete invoice <b>{deleteInvoice?.invoiceNumber}</b>?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteInvoice(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleInvoiceDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Pending Employees</CardTitle>
              <CardDescription>Approve or reject new employee accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEmployees.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">No pending employees.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEmployees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell>{emp.name || '-'}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell>{emp.status}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(emp.id)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(emp.id)}>Reject</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <div className="mb-6">
            <Button onClick={() => setShowCreateUser(v => !v)}>{showCreateUser ? 'Hide' : 'Create New User'}</Button>
            {showCreateUser && (
              <form onSubmit={handleCreateUser} className="mt-4 flex flex-col gap-2 max-w-md p-4 border rounded">
                <label>Email<input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="border p-2 rounded w-full" /></label>
                <label>Password<input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="border p-2 rounded w-full" /></label>
                <label>Role<select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="border p-2 rounded w-full">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select></label>
                <label>Shop ID<input type="text" value={newUserShopId} onChange={e => setNewUserShopId(e.target.value)} required className="border p-2 rounded w-full" /></label>
                <Button type="submit" disabled={creatingUser}>{creatingUser ? 'Creating...' : 'Create User'}</Button>
                {createUserError && <div className="text-red-600">{createUserError}</div>}
                {createUserSuccess && <div className="text-green-600">{createUserSuccess}</div>}
              </form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
