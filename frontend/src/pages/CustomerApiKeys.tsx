import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchApiKeys, createApiKey, updateApiKey, revokeApiKey, deleteApiKey,
  fetchApiKeyScopes, addApiKeyScope, deleteApiKeyScope,
  fetchCustomerProjectsModels
} from "../api";
import {
  Plus, Search, Key, Copy, Check, Eye, EyeOff, ShieldCheck, ShieldOff,
  Trash2, Edit2, X, FolderTree, Clock, ShieldAlert,
  BookOpen, ArrowRight, Send, Activity, Download, Terminal, ExternalLink, Globe, Lock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function CustomerApiKeys({ customerId }: { customerId: number }) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [editingKey, setEditingKey] = useState<any>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Scope picker state
  const [scopeProjectId, setScopeProjectId] = useState<string>("");
  const [scopeModelId, setScopeModelId] = useState<string>("");

  // --- Queries ---
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys", customerId],
    queryFn: () => fetchApiKeys(customerId),
  });

  const { data: scopes = [], isLoading: isScopesLoading } = useQuery({
    queryKey: ["api-key-scopes", selectedKey?.API_Key_ID],
    queryFn: () => fetchApiKeyScopes(selectedKey!.API_Key_ID),
    enabled: !!selectedKey,
  });

  const { data: projectsModels = [] } = useQuery({
    queryKey: ["projects-models", customerId],
    queryFn: () => fetchCustomerProjectsModels(customerId),
    enabled: !!selectedKey,
  });

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: (data: any) => createApiKey(customerId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", customerId] });
      setIsSheetOpen(false);
      setSelectedKey(data);
      // Auto-reveal the newly created key
      setRevealedKeys(prev => new Set(prev).add(data.API_Key_ID));
      toast.success("API key created successfully! The key is shown in the detail panel.");
    },
    onError: () => toast.error("Failed to create API key"),
  });

  const updateMut = useMutation({
    mutationFn: ({ apiKeyId, data }: { apiKeyId: number; data: any }) =>
      updateApiKey(customerId, apiKeyId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", customerId] });
      if (selectedKey?.API_Key_ID === data.API_Key_ID) {
        setSelectedKey(data);
      }
      setIsSheetOpen(false);
      toast.success("API key updated successfully");
    },
    onError: () => toast.error("Failed to update API key"),
  });

  const revokeMut = useMutation({
    mutationFn: (apiKeyId: number) => revokeApiKey(customerId, apiKeyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", customerId] });
      setSelectedKey(data);
      setIsRevokeDialogOpen(false);
      toast.success("API key revoked");
    },
    onError: () => toast.error("Failed to revoke API key"),
  });

  const deleteMut = useMutation({
    mutationFn: (apiKeyId: number) => deleteApiKey(customerId, apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", customerId] });
      setIsDeleteDialogOpen(false);
      setSelectedKey(null);
      toast.success("API key deleted");
    },
    onError: () => toast.error("Failed to delete API key"),
  });

  const addScopeMut = useMutation({
    mutationFn: (data: any) => addApiKeyScope(selectedKey!.API_Key_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-key-scopes", selectedKey?.API_Key_ID] });
      setScopeProjectId("");
      setScopeModelId("");
      toast.success("Scope added");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add scope"),
  });

  const removeScopeMut = useMutation({
    mutationFn: (scopeId: number) => deleteApiKeyScope(scopeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-key-scopes", selectedKey?.API_Key_ID] });
      toast.success("Scope removed");
    },
    onError: () => toast.error("Failed to remove scope"),
  });

  // --- Helpers ---
  const getKeyStatus = (k: any) => {
    if (!k.Is_Active) return "Revoked";
    if (k.Expiry_Date && new Date(k.Expiry_Date) < new Date()) return "Expired";
    return "Active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Revoked": return "bg-red-50 text-red-700 border-red-200";
      case "Expired": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // --- Computed ---
  const filteredKeys = useMemo(() => {
    return apiKeys.filter((k: any) => {
      const matchesSearch =
        (k.Label || "").toLowerCase().includes(search.toLowerCase()) ||
        (k.Key || "").toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "All") return true;
      return getKeyStatus(k) === statusFilter;
    });
  }, [apiKeys, search, statusFilter]);

  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter((k: any) => getKeyStatus(k) === "Active").length;
  const revokedKeys = apiKeys.filter((k: any) => getKeyStatus(k) === "Revoked").length;
  const expiredKeys = apiKeys.filter((k: any) => getKeyStatus(k) === "Expired").length;

  const selectedProjectModels = projectsModels.find(
    (p: any) => String(p.Project_ID) === scopeProjectId
  )?.Models || [];

  const maskKey = (key: string) => {
    if (!key || key.length <= 7) return key;
    return key.substring(0, 3) + "••••••••••" + key.substring(key.length - 4);
  };

  const handleCopyKey = async (key: string, keyId: number) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(key);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
      toast.success("API key copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy API key");
      console.error("Copy failed:", err);
    }
  };

  const toggleRevealKey = (keyId: number) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const handleSaveKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      Label: formData.get("Label") || null,
    };
    const expiry = formData.get("Expiry_Date");
    if (expiry) {
      data.Expiry_Date = new Date(expiry as string).toISOString();
    }

    if (editingKey) {
      updateMut.mutate({ apiKeyId: editingKey.API_Key_ID, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleAddScope = () => {
    if (!scopeProjectId) {
      toast.error("Please select a project");
      return;
    }
    addScopeMut.mutate({
      Project_ID: Number(scopeProjectId),
      Model_ID: scopeModelId ? Number(scopeModelId) : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* API Quick Reference */}
      <Card className="overflow-hidden border-slate-200">
        <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">REST API</h3>
              <p className="text-sm text-muted-foreground">Base URL: <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">http://localhost:5001</code></p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setIsDocDialogOpen(true)}>
            <BookOpen className="h-4 w-4" /> View API Documentation
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {/* Endpoint 1: Submit */}
            <div className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2.5 mt-0.5 shrink-0 w-28">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-mono text-[11px] px-2 py-0.5">POST</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-slate-800">/api/v1/jobs</code>
                <p className="text-sm text-muted-foreground mt-0.5">Submit a document for extraction. Returns <code className="text-xs bg-slate-100 px-1 rounded">execution_id</code> for tracking.</p>
              </div>
              <Send className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
            </div>
            {/* Endpoint 2: Status */}
            <div className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2.5 mt-0.5 shrink-0 w-28">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-mono text-[11px] px-2 py-0.5">GET</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-slate-800">/api/v1/jobs/:id</code>
                <p className="text-sm text-muted-foreground mt-0.5">Check the processing status, audit logs, and pipeline stage of a submitted job.</p>
              </div>
              <Activity className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
            </div>
            {/* Endpoint 3: Result */}
            <div className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2.5 mt-0.5 shrink-0 w-28">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-mono text-[11px] px-2 py-0.5">GET</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-slate-800">/api/v1/jobs/:id/result</code>
                <p className="text-sm text-muted-foreground mt-0.5">Retrieve the final extracted JSON payload once the job is completed.</p>
              </div>
              <Download className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
            </div>
          </div>
          {/* Auth reminder footer */}
          <div className="px-6 py-3 bg-amber-50/60 border-t border-amber-100 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-700">All endpoints require an active API key passed via the <code className="font-mono bg-amber-100/70 px-1 rounded">Authorization</code> header.</span>
          </div>
        </CardContent>
      </Card>

      {/* Top action bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">API Key Management</h2>
        <Button onClick={() => { setEditingKey(null); setIsSheetOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Total Keys</div><div className="text-2xl font-bold">{totalKeys}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Active</div><div className="text-2xl font-bold text-emerald-600">{activeKeys}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Revoked</div><div className="text-2xl font-bold text-red-600">{revokedKeys}</div></CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col justify-center"><div className="text-sm font-medium text-muted-foreground">Expired</div><div className="text-2xl font-bold text-amber-600">{expiredKeys}</div></CardContent></Card>
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
                  placeholder="Search API keys..."
                  className="pl-8"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "Active", "Revoked", "Expired"].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-full"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading API keys...</TableCell></TableRow>
                ) : filteredKeys.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No API keys found.</TableCell></TableRow>
                ) : (
                  filteredKeys.map((k: any) => {
                    const status = getKeyStatus(k);
                    return (
                      <TableRow
                        key={k.API_Key_ID}
                        className={`cursor-pointer transition-colors ${selectedKey?.API_Key_ID === k.API_Key_ID ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedKey(k)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{k.Label || "Untitled Key"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            {maskKey(k.Key)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(status)}>{status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {k.Created_Date ? new Date(k.Created_Date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {k.Expiry_Date ? new Date(k.Expiry_Date).toLocaleDateString() : "Never"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Right Panel: Detail View */}
        {selectedKey ? (
          <Card className="w-full lg:w-[420px] flex flex-col h-fit shrink-0 animate-in slide-in-from-right-8 duration-300">
            <CardHeader className="border-b bg-slate-50/50 pb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Key className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl text-center">{selectedKey.Label || "Untitled Key"}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className={getStatusColor(getKeyStatus(selectedKey))}>
                  {getKeyStatus(selectedKey)}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Key display */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">API Key</h3>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                  <code className="flex-1 text-sm font-mono break-all">
                    {revealedKeys.has(selectedKey.API_Key_ID) ? selectedKey.Key : maskKey(selectedKey.Key)}
                  </code>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => toggleRevealKey(selectedKey.API_Key_ID)}
                    title={revealedKeys.has(selectedKey.API_Key_ID) ? "Hide key" : "Reveal key"}
                  >
                    {revealedKeys.has(selectedKey.API_Key_ID) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => handleCopyKey(selectedKey.Key, selectedKey.API_Key_ID)}
                    title="Copy key"
                  >
                    {copiedKeyId === selectedKey.API_Key_ID ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Dates info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-foreground">Created: {selectedKey.Created_Date ? new Date(selectedKey.Created_Date).toLocaleString() : "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-foreground">Expires: {selectedKey.Expiry_Date ? new Date(selectedKey.Expiry_Date).toLocaleString() : "Never"}</span>
                  </div>
                  {selectedKey.Last_Used_Date && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-foreground">Last used: {new Date(selectedKey.Last_Used_Date).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedKey.Revoked_Date && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      <span className="text-foreground">Revoked: {new Date(selectedKey.Revoked_Date).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scopes section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FolderTree className="h-4 w-4" /> Scopes
                </h3>
                {isScopesLoading ? (
                  <div className="text-sm text-muted-foreground py-2">Loading scopes...</div>
                ) : scopes.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 text-center border rounded-lg p-4 bg-slate-50/50 border-dashed">
                    No scopes assigned yet. Add a project/model scope below.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {scopes.map((s: any) => (
                      <Badge key={s.Scope_ID} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-1 py-1.5">
                        <span>{s.Project_Name}</span>
                        <span className="text-blue-400 mx-0.5">›</span>
                        <span>{s.Model_Name || "All Models"}</span>
                        <button
                          className="ml-1 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
                          onClick={(e) => { e.stopPropagation(); removeScopeMut.mutate(s.Scope_ID); }}
                          title="Remove scope"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add scope inline form */}
                {selectedKey.Is_Active && (
                  <div className="flex flex-col gap-2 p-3 border rounded-lg bg-white">
                    <div className="text-xs font-medium text-muted-foreground">Add Scope</div>
                    <Select value={scopeProjectId} onValueChange={(val) => { setScopeProjectId(val); setScopeModelId(""); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectsModels.map((p: any) => (
                          <SelectItem key={p.Project_ID} value={String(p.Project_ID)}>{p.Project_Name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {scopeProjectId && (
                      <Select value={scopeModelId} onValueChange={setScopeModelId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All models (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Models</SelectItem>
                          {selectedProjectModels.map((m: any) => (
                            <SelectItem key={m.Model_ID} value={String(m.Model_ID)}>{m.Model_Name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" className="w-full gap-2" onClick={handleAddScope} disabled={addScopeMut.isPending || !scopeProjectId}>
                      <Plus className="h-3.5 w-3.5" /> Grant Access
                    </Button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setEditingKey(selectedKey); setIsSheetOpen(true); }}>
                  <Edit2 className="h-4 w-4" /> Edit Key Details
                </Button>
                {selectedKey.Is_Active && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => setIsRevokeDialogOpen(true)}
                  >
                    <ShieldOff className="h-4 w-4" /> Revoke Key
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete Key
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full lg:w-[420px] flex flex-col items-center justify-center p-12 text-center h-96 shrink-0 bg-slate-50/50 border-dashed">
            <Key className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No API key selected</h3>
            <p className="text-sm text-slate-500 mt-2">Select an API key from the table to view details and manage scopes.</p>
          </Card>
        )}
      </div>

      {/* Create/Edit API Key Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingKey ? "Edit API Key" : "Create New API Key"}</SheetTitle>
            <SheetDescription>
              {editingKey
                ? "Update the label or expiry date for this API key."
                : "Create a new API key. A secure key with the 'dz-' prefix will be generated automatically."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveKey} className="space-y-4 mt-6" key={editingKey?.API_Key_ID || "new"}>
            <div className="space-y-2">
              <Label htmlFor="Label">Label</Label>
              <Input id="Label" name="Label" placeholder="e.g. Production API Key" defaultValue={editingKey?.Label || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Expiry_Date">Expiry Date (optional)</Label>
              <Input
                id="Expiry_Date" name="Expiry_Date" type="date"
                defaultValue={editingKey?.Expiry_Date ? new Date(editingKey.Expiry_Date).toISOString().split('T')[0] : ""}
              />
            </div>
            {!editingKey && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <span>A unique API key with the <code className="font-mono bg-blue-100 px-1 rounded">dz-</code> prefix will be auto-generated.</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editingKey ? "Save Changes" : "Create Key"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Revoke Confirmation */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke <strong>{selectedKey?.Label || "this key"}</strong>? Any applications using this key will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revokeMut.isPending}
              onClick={() => revokeMut.mutate(selectedKey?.API_Key_ID)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedKey?.Label || "this key"}</strong>? This action cannot be undone and all associated scopes will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(selectedKey?.API_Key_ID)}>
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full API Documentation Dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">API Developer Documentation</DialogTitle>
                <DialogDescription>Complete guide to integrating with the AgenticDocuZone REST API</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8 api-doc-content">
            {/* Base URL */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Base URL
              </h3>
              <div className="bg-slate-900 text-slate-100 px-4 py-3 rounded-lg font-mono text-sm">
                http://localhost:5001
              </div>
            </section>

            {/* Authentication */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Authentication
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-2">
                <p>All API endpoints require authentication via an API Key.</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Pass your API Key in the <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-xs">Authorization</code> HTTP header.</li>
                  <li>The API Key must have active permissions and scope access for the specific <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-xs">model_id</code> being queried.</li>
                </ul>
              </div>
            </section>

            {/* Endpoint 1: Submit Document */}
            <section className="border rounded-lg overflow-hidden">
              <div className="px-5 py-4 bg-white border-b flex items-center gap-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-mono text-xs px-2.5 py-1">POST</Badge>
                <code className="font-mono text-sm font-medium text-slate-800">/api/v1/jobs</code>
                <span className="text-sm text-muted-foreground ml-auto">Submit Document</span>
              </div>
              <div className="p-5 space-y-4 bg-slate-50/30">
                <p className="text-sm text-slate-600">Submit a PDF or Excel document to the core extraction engine. Requires <code className="font-mono bg-slate-100 px-1 rounded text-xs">multipart/form-data</code> content type.</p>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Headers</h4>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-100"><th className="text-left px-3 py-2 font-medium text-slate-600">Header</th><th className="text-left px-3 py-2 font-medium text-slate-600">Description</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">Authorization</td><td className="px-3 py-2 text-slate-600">Your API Key (e.g., <code className="bg-slate-100 px-1 rounded text-xs">dz-your-api-key</code>)</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">dz-user</td><td className="px-3 py-2 text-slate-600">Identifier for the user or system triggering the job (for audit logging)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Form Parameters</h4>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-100"><th className="text-left px-3 py-2 font-medium text-slate-600">Field</th><th className="text-left px-3 py-2 font-medium text-slate-600">Type</th><th className="text-left px-3 py-2 font-medium text-slate-600">Description</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">file</td><td className="px-3 py-2 text-slate-500">File</td><td className="px-3 py-2 text-slate-600">Document to extract (.pdf or .xlsx)</td></tr>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">model_id</td><td className="px-3 py-2 text-slate-500">Integer</td><td className="px-3 py-2 text-slate-600">Target Model ID configuration</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> cURL Example</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed"><code>{`curl -X POST http://localhost:5001/api/v1/jobs \\
  -H "Authorization: dz-your-api-key-here" \\
  -H "dz-user: john_doe" \\
  -F "file=@/path/to/invoice.pdf" \\
  -F "model_id=3008"`}</code></pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Success Response <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">202</Badge></h4>
                  <pre className="bg-slate-900 text-emerald-300 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed"><code>{`{
  "execution_id": 12345,
  "doc_id": 9876,
  "status": "Processing"
}`}</code></pre>
                </div>
              </div>
            </section>

            {/* Endpoint 2: Check Job Status */}
            <section className="border rounded-lg overflow-hidden">
              <div className="px-5 py-4 bg-white border-b flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-mono text-xs px-2.5 py-1">GET</Badge>
                <code className="font-mono text-sm font-medium text-slate-800">/api/v1/jobs/:execution_id</code>
                <span className="text-sm text-muted-foreground ml-auto">Check Job Status</span>
              </div>
              <div className="p-5 space-y-4 bg-slate-50/30">
                <p className="text-sm text-slate-600">Poll this endpoint to monitor the progress of a submitted extraction job. Returns the current status, timestamps, document details, and real-time audit logs of pipeline stages.</p>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Headers</h4>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-100"><th className="text-left px-3 py-2 font-medium text-slate-600">Header</th><th className="text-left px-3 py-2 font-medium text-slate-600">Description</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">Authorization</td><td className="px-3 py-2 text-slate-600">Your API Key</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> cURL Example</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed"><code>{`curl -X GET http://localhost:5001/api/v1/jobs/12345 \\
  -H "Authorization: dz-your-api-key-here"`}</code></pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Response Statuses</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* Endpoint 3: Retrieve Job Result */}
            <section className="border rounded-lg overflow-hidden">
              <div className="px-5 py-4 bg-white border-b flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-mono text-xs px-2.5 py-1">GET</Badge>
                <code className="font-mono text-sm font-medium text-slate-800">/api/v1/jobs/:execution_id/result</code>
                <span className="text-sm text-muted-foreground ml-auto">Retrieve Result</span>
              </div>
              <div className="p-5 space-y-4 bg-slate-50/30">
                <p className="text-sm text-slate-600">Once a job's status is <code className="font-mono bg-slate-100 px-1 rounded text-xs">Completed</code>, use this endpoint to retrieve the final structured JSON payload containing the extracted Headers and Tables.</p>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Headers</h4>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-100"><th className="text-left px-3 py-2 font-medium text-slate-600">Header</th><th className="text-left px-3 py-2 font-medium text-slate-600">Description</th></tr></thead>
                      <tbody>
                        <tr className="border-t"><td className="px-3 py-2 font-mono text-xs">Authorization</td><td className="px-3 py-2 text-slate-600">Your API Key</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5" /> cURL Example</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed"><code>{`curl -X GET http://localhost:5001/api/v1/jobs/12345/result \\
  -H "Authorization: dz-your-api-key-here"`}</code></pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expected Responses</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 text-[10px] px-1.5 py-0">200</Badge>
                      <span className="text-slate-600">Completed — Returns the complete nested JSON structure of extracted data.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0 text-[10px] px-1.5 py-0">202</Badge>
                      <span className="text-slate-600">Still Processing — Returns a message indicating the job is still running.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shrink-0 text-[10px] px-1.5 py-0">500</Badge>
                      <span className="text-slate-600">Failed — Returns the failure traceback/remark from the failed stage.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
