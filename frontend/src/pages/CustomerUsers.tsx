import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createUser, updateUser, deleteUser, fetchCustomers } from "../api";
import { 
  Plus, Search, Edit2, Trash2, ChevronRight, User, Mail, Phone, Calendar, Shield, Lock, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function CustomerUsers({ customerId }: { customerId: number }) {
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", customerId],
    queryFn: () => fetchUsers(customerId),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const customer = customers.find((c: any) => c.Customer_ID === customerId);

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", customerId] });
      setIsSheetOpen(false);
      toast.success("User added successfully");
    },
    onError: () => toast.error("Failed to add user")
  });

  const updateMut = useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: any }) => updateUser(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", customerId] });
      if (selectedUser?.User_ID === data.User_ID) {
        setSelectedUser(data);
      }
      setIsSheetOpen(false);
      toast.success("User updated successfully");
    },
    onError: () => toast.error("Failed to update user")
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", customerId] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success("User removed successfully");
    },
    onError: () => toast.error("Failed to remove user")
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchesSearch = 
        (u.Full_Name || "").toLowerCase().includes(search.toLowerCase()) || 
        (u.Email || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = roleFilter === "All" ? true : u.User_Type === roleFilter;
        
      return matchesSearch && matchesFilter;
    });
  }, [users, search, roleFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => u.Status === "Active").length;
  const inactiveUsers = users.filter((u: any) => u.Status === "Inactive").length;
  const admins = users.filter((u: any) => ["Admin", "Super Admin"].includes(u.User_Type)).length;
  const uniqueRoles = new Set(users.map((u: any) => u.User_Type)).size;

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      Customer_ID: customerId,
      Username: formData.get("Username"),
      Email: formData.get("Email"),
      Full_Name: formData.get("Full_Name"),
      Phone: formData.get("Phone"),
      User_Type: formData.get("User_Type"),
      Status: formData.get("Status") === "on" ? "Active" : "Inactive",
    };
    
    if (editingUser) {
      updateMut.mutate({ userId: editingUser.User_ID, data });
    } else {
      (data as any).Password = formData.get("Password");
      createMut.mutate(data);
    }
  };

  const toggleUserStatus = (checked: boolean) => {
    if (!selectedUser) return;
    updateMut.mutate({
      userId: selectedUser.User_ID,
      data: { Status: checked ? "Active" : "Inactive" }
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "UN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Super Admin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Admin": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Developer": return "bg-teal-100 text-teal-800 border-teal-200";
      case "Client": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Validator": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">User Management</h2>
        <Button onClick={() => { setEditingUser(null); setIsSheetOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Total Users</div><div className="text-2xl font-bold">{totalUsers}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Active</div><div className="text-2xl font-bold text-emerald-600">{activeUsers}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Inactive</div><div className="text-2xl font-bold text-slate-600">{inactiveUsers}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Admins</div><div className="text-2xl font-bold text-purple-600">{admins}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Roles Used</div><div className="text-2xl font-bold">{uniqueRoles}</div></CardContent></Card>
      </div>

      {/* Two panel layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel: Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "Super Admin", "Admin", "Developer", "Client", "Validator"].map(role => (
                  <Button 
                    key={role} 
                    variant={roleFilter === role ? "default" : "outline"} 
                    size="sm"
                    className="h-8 rounded-full"
                    onClick={() => setRoleFilter(role)}
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUsersLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading users...</TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">No users found.</TableCell></TableRow>
                ) : (
                  filteredUsers.map((u: any) => (
                    <TableRow 
                      key={u.User_ID} 
                      className={`cursor-pointer transition-colors ${selectedUser?.User_ID === u.User_ID ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
                            {getInitials(u.Full_Name)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{u.Full_Name}</div>
                            <div className="text-xs text-muted-foreground">{u.Email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(u.User_Type)}>{u.User_Type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${u.Status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-sm">{u.Status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.Last_Login_At ? new Date(u.Last_Login_At).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Right Panel: Detail View */}
        {selectedUser ? (
          <Card className="w-full lg:w-96 flex flex-col h-fit shrink-0 animate-in slide-in-from-right-8 duration-300">
            <CardHeader className="text-center border-b pb-6 bg-slate-50/50">
              <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl mb-4">
                {getInitials(selectedUser.Full_Name)}
              </div>
              <CardTitle className="text-xl">{selectedUser.Full_Name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className={getRoleColor(selectedUser.User_Type)}>{selectedUser.User_Type}</Badge>
                <Badge variant="outline" className={selectedUser.Status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100"}>
                  {selectedUser.Status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground"><User className="h-4 w-4"/> <span className="text-foreground">{selectedUser.Username}</span></div>
                  <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4"/> <span className="text-foreground">{selectedUser.Email}</span></div>
                  <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4"/> <span className="text-foreground">{selectedUser.Phone || 'Not provided'}</span></div>
                  <div className="flex items-center gap-3 text-muted-foreground"><Calendar className="h-4 w-4"/> <span className="text-foreground">Joined {new Date(selectedUser.Created_Date).toLocaleDateString()}</span></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Access Control</h3>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-sm">Active Account</Label>
                    </div>
                  </div>
                  <Switch 
                    checked={selectedUser.Status === "Active"} 
                    onCheckedChange={toggleUserStatus}
                    disabled={updateMut.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setEditingUser(selectedUser); setIsSheetOpen(true); }}>
                  <Edit2 className="h-4 w-4" /> Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.success("Password reset link sent!")}>
                  <Lock className="h-4 w-4" /> Reset Password
                </Button>
                <Button variant="destructive" className="w-full justify-start gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Remove User
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full lg:w-96 flex flex-col items-center justify-center p-12 text-center h-96 shrink-0 bg-slate-50/50 border-dashed">
            <User className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No user selected</h3>
            <p className="text-sm text-slate-500 mt-2">Select a user from the table to view their details and manage access.</p>
          </Card>
        )}
      </div>

      {/* Add/Edit User Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingUser ? "Edit User Profile" : "Add New User"}</SheetTitle>
            <SheetDescription>{editingUser ? "Make changes to the user's profile details." : "Create a new user account for this customer."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 mt-6" key={editingUser?.User_ID || "new"}>
            <div className="space-y-2">
              <Label htmlFor="Full_Name">Full Name</Label>
              <Input id="Full_Name" name="Full_Name" required defaultValue={editingUser?.Full_Name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Username">Username</Label>
              <Input id="Username" name="Username" required defaultValue={editingUser?.Username} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Email">Email Address</Label>
              <Input id="Email" name="Email" type="email" required defaultValue={editingUser?.Email} />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="Password">Password</Label>
                <Input id="Password" name="Password" type="password" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="Phone">Phone Number</Label>
              <Input id="Phone" name="Phone" defaultValue={editingUser?.Phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="User_Type">Role</Label>
              <Select name="User_Type" defaultValue={editingUser?.User_Type || "Client"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Validator">Validator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-lg p-4 mt-4">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <div className="text-sm text-muted-foreground">{editingUser ? "User account is active" : "User can log in immediately"}</div>
              </div>
              <Switch name="Status" defaultChecked={editingUser ? editingUser.Status === "Active" : true} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editingUser ? "Save Changes" : "Add User"}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.Full_Name}? They will lose all access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(selectedUser?.User_ID)}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
