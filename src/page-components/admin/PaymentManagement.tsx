import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CreditCard, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  icon_name: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  branch: string;
  is_active: boolean;
}

const PaymentManagement = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const methodForm = useForm<PaymentMethod>();
  const accountForm = useForm<BankAccount>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [methodsResponse, accountsResponse] = await Promise.all([
        supabase.from('payment_methods').select('*').order('name'),
        supabase.from('bank_accounts').select('*').order('bank_name')
      ]);

      if (methodsResponse.error) throw methodsResponse.error;
      if (accountsResponse.error) throw accountsResponse.error;

      setPaymentMethods(methodsResponse.data || []);
      setBankAccounts(accountsResponse.data || []);
    } catch (error) {
      toast.error('Failed to load payment data');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSubmit = async (data: PaymentMethod) => {
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(data)
          .eq('id', editingMethod.id);
        if (error) throw error;
        toast.success('Payment method updated successfully');
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([data]);
        if (error) throw error;
        toast.success('Payment method added successfully');
      }
      
      setIsMethodDialogOpen(false);
      setEditingMethod(null);
      methodForm.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to save payment method');
      console.error('Error:', error);
    }
  };

  const handleAccountSubmit = async (data: BankAccount) => {
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(data)
          .eq('id', editingAccount.id);
        if (error) throw error;
        toast.success('Bank account updated successfully');
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([data]);
        if (error) throw error;
        toast.success('Bank account added successfully');
      }
      
      setIsAccountDialogOpen(false);
      setEditingAccount(null);
      accountForm.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to save bank account');
      console.error('Error:', error);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Payment method deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete payment method');
      console.error('Error:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Bank account deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete bank account');
      console.error('Error:', error);
    }
  };

  const openMethodDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      methodForm.reset(method);
    } else {
      setEditingMethod(null);
      methodForm.reset({
        name: '',
        code: '',
        description: '',
        is_active: true,
        icon_name: ''
      });
    }
    setIsMethodDialogOpen(true);
  };

  const openAccountDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      accountForm.reset(account);
    } else {
      setEditingAccount(null);
      accountForm.reset({
        bank_name: '',
        account_name: '',
        account_number: '',
        routing_number: '',
        swift_code: '',
        branch: '',
        is_active: true
      });
    }
    setIsAccountDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex items-center justify-center h-64">
          <div className="text-lg">Loading payment data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">
            Manage payment methods and bank account details
          </p>
        </div>

        <Tabs defaultValue="methods" className="space-y-4">
          <TabsList>
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Payment Methods</CardTitle>
                <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openMethodDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...methodForm}>
                      <form onSubmit={methodForm.handleSubmit(handleMethodSubmit)} className="space-y-4">
                        <FormField
                          control={methodForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Payment method name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methodForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code</FormLabel>
                              <FormControl>
                                <Input placeholder="payment_code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methodForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Payment method description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methodForm.control}
                          name="icon_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon Name</FormLabel>
                              <FormControl>
                                <Input placeholder="lucide-icon-name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methodForm.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Active</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Enable this payment method for use
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsMethodDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingMethod ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{method.name}</h3>
                          <Badge variant={method.is_active ? 'default' : 'secondary'}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Code: {method.code}
                        </p>
                        {method.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {method.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMethodDialog(method)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Bank Accounts</CardTitle>
                <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openAccountDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="bank_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Bank name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={accountForm.control}
                            name="account_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Account holder name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="account_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Account number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={accountForm.control}
                            name="routing_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Routing Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Routing number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="swift_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SWIFT Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="SWIFT/BIC code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={accountForm.control}
                            name="branch"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Branch</FormLabel>
                                <FormControl>
                                  <Input placeholder="Branch name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={accountForm.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Active</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Enable this bank account for use
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingAccount ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{account.bank_name}</h3>
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.account_name} - {account.account_number}
                        </p>
                        {account.branch && (
                          <p className="text-sm text-muted-foreground">
                            Branch: {account.branch}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAccountDialog(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PaymentManagement;