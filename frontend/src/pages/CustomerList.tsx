import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api";
import { Link } from "react-router-dom";
import { 
  Plus, Search, Edit2, Trash2, Eye, User, 
  MoreHorizontal, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CustomerList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const createMut = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsSheetOpen(false);
      toast.success("Customer created successfully");
    },
    onError: () => toast.error("Failed to create customer")
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsSheetOpen(false);
      toast.success("Customer updated successfully");
    },
    onError: () => toast.error("Failed to update customer")
  });

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDeleteDialogOpen(false);
      toast.success("Customer deleted successfully");
    },
    onError: () => toast.error("Failed to delete customer")
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      const matchesSearch = 
        (c.Customer_Name || "").toLowerCase().includes(search.toLowerCase()) || 
        (c.Customer_Code || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === "All" ? true : 
        filter === "Active" ? c.Status === "Active" : 
        c.Status === "Inactive";
        
      return matchesSearch && matchesFilter;
    });
  }, [customers, search, filter]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c: any) => c.Status === "Active").length;
  const inactiveCustomers = customers.filter((c: any) => c.Status === "Inactive").length;
  const superAdmins = customers.filter((c: any) => c.Super_Admin).length;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      Customer_Name: formData.get("Customer_Name"),
      Customer_Code: formData.get("Customer_Code"),
      Contact_Person: formData.get("Contact_Person"),
      Country: formData.get("Country"),
      Super_Admin: formData.get("Super_Admin") === "on",
      Status: formData.get("Status") === "on" ? "Active" : "Inactive",
    };

    if (editingCustomer) {
      updateMut.mutate({ id: editingCustomer.Customer_ID, data });
    } else {
      createMut.mutate(data);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "UN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">Manage your customer accounts and settings.</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setIsSheetOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center text-[10px] text-purple-700 font-bold">SA</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search by name or code..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "All" ? "default" : "outline"} size="sm" onClick={() => setFilter("All")}>All</Button>
            <Button variant={filter === "Active" ? "default" : "outline"} size="sm" onClick={() => setFilter("Active")}>Active</Button>
            <Button variant={filter === "Inactive" ? "default" : "outline"} size="sm" onClick={() => setFilter("Inactive")}>Inactive</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : paginatedCustomers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">No customers found.</TableCell></TableRow>
            ) : (
              paginatedCustomers.map((c: any) => (
                <TableRow key={c.Customer_ID} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                        {getInitials(c.Customer_Name)}
                      </div>
                      <div>
                        <div className="font-medium">{c.Customer_Name}</div>
                        <div className="text-xs text-muted-foreground">{c.Customer_Code || "No Code"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.Contact_Person || "-"}</TableCell>
                  <TableCell>{c.Country || "-"}</TableCell>
                  <TableCell>
                    {c.Super_Admin ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">Yes</Badge> : <span className="text-muted-foreground text-sm">No</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.Status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"}>
                      {c.Status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/customers/${c.Customer_ID}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCustomer(c); setIsSheetOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setCustomerToDelete(c); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-4 flex items-center justify-between border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredCustomers.length)} of {filteredCustomers.length} results
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="text-sm border rounded p-1 mr-4"
              value={rowsPerPage} 
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(p => p + 1)} disabled={page * rowsPerPage >= filteredCustomers.length}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</SheetTitle>
            <SheetDescription>
              {editingCustomer ? "Make changes to the customer profile here." : "Enter the details for the new customer."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="Customer_Name">Customer Name</Label>
                <Input id="Customer_Name" name="Customer_Name" required defaultValue={editingCustomer?.Customer_Name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Customer_Code">Customer Code</Label>
                <Input id="Customer_Code" name="Customer_Code" defaultValue={editingCustomer?.Customer_Code} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Contact_Person">Contact Person</Label>
                <Input id="Contact_Person" name="Contact_Person" defaultValue={editingCustomer?.Contact_Person} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Country">Country</Label>
                <Input id="Country" name="Country" defaultValue={editingCustomer?.Country} />
              </div>
              
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label>Super Admin</Label>
                  <div className="text-sm text-muted-foreground">Grant super admin privileges</div>
                </div>
                <Switch name="Super_Admin" defaultChecked={editingCustomer?.Super_Admin} />
              </div>
              
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <div className="text-sm text-muted-foreground">Customer account is active</div>
                </div>
                <Switch name="Status" defaultChecked={editingCustomer ? editingCustomer.Status === "Active" : true} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {customerToDelete?.Customer_Name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(customerToDelete.Customer_ID)}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
