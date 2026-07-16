import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers, fetchCustomerBillingSummary, fetchModelBillingChart, fetchModelExecutions } from "../api";
import { ChevronRight, Calendar as CalendarIcon, FileText, Layers, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CustomerUsers from "./CustomerUsers";
import CustomerApiKeys from "./CustomerApiKeys";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Navigate } from "react-router-dom";

export default function CustomerDetails({ authUser }: { authUser?: any }) {
  const { id } = useParams();
  const customerId = Number(id);
  
  // Guard: if a Customer Admin tries to view another customer, bounce them to their own
  if (authUser && authUser.User_ID !== 0 && customerId !== authUser.Customer_ID) {
    return <Navigate to={`/customers/${authUser.Customer_ID}`} replace />;
  }

  const [activeTab, setActiveTab] = useState<"billing" | "users" | "apis">("billing");
  
  // Date filters for billing
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Initially set dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format to YYYY-MM-DD
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const customer = customers.find((c: any) => c.Customer_ID === customerId);

  // Fetch Billing Summary
  const { data: billingSummary = [], isLoading: isBillingLoading } = useQuery({
    queryKey: ["billing-summary", customerId, startDate, endDate],
    queryFn: () => fetchCustomerBillingSummary(customerId, startDate || undefined, endDate || undefined),
    enabled: !!customerId,
  });

  // Fetch Chart Data for selected model
  const { data: chartData = [], isLoading: isChartLoading } = useQuery({
    queryKey: ["billing-chart", selectedModelId, startDate, endDate],
    queryFn: () => fetchModelBillingChart(selectedModelId!, startDate || undefined, endDate || undefined),
    enabled: !!selectedModelId,
  });

  // Fetch Executions for selected model
  const { data: executionsData = [], isLoading: isExecutionsLoading } = useQuery({
    queryKey: ["model-executions", selectedModelId, startDate, endDate],
    queryFn: () => fetchModelExecutions(selectedModelId!, startDate || undefined, endDate || undefined),
    enabled: !!selectedModelId,
  });

  const getInitials = (name: string) => {
    if (!name) return "UN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleDateClear = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground gap-2">
        <Link to="/" className="hover:text-foreground transition-colors">Customers</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{customer?.Customer_Name || "Loading..."}</span>
      </div>

      {/* Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
            {getInitials(customer?.Customer_Name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {customer?.Customer_Name}
              <Badge variant="outline" className={customer?.Status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100"}>
                {customer?.Status || "Active"}
              </Badge>
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>Code: {customer?.Customer_Code || "N/A"}</span>
              <span>•</span>
              <span>Country: {customer?.Country || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "billing" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("billing")}
        >
          Billing Dashboard
          {activeTab === "billing" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "users" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("users")}
        >
          Manage Users
          {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "apis" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("apis")}
        >
          APIs
          {activeTab === "apis" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "billing" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter Section */}
            <Card>
              <div className="p-4 flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium">End Date</label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleDateClear}>Show All Time</Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col justify-center">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Total Documents
                  </div>
                  <div className="text-2xl font-bold mt-2 text-primary">
                    {billingSummary.reduce((sum: any, item: any) => sum + item.Total_Documents, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col justify-center">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Total Pages
                  </div>
                  <div className="text-2xl font-bold mt-2 text-primary">
                    {billingSummary.reduce((sum: any, item: any) => sum + item.Total_Pages, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Models Summary Table */}
              <Card className="flex-1 lg:max-w-[35%] flex flex-col overflow-hidden">
                <CardHeader className="shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" /> Model Consumption
                  </CardTitle>
                  <CardDescription>Click a model to view detailed charts</CardDescription>
                </CardHeader>
                <div className="overflow-auto border-t flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project / Model</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead className="text-right">Pages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isBillingLoading ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8">Loading data...</TableCell></TableRow>
                      ) : billingSummary.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8">No consumption data found for this period.</TableCell></TableRow>
                      ) : (
                        billingSummary.map((item: any, idx: number) => (
                          <TableRow 
                            key={`${item.Model_ID}-${idx}`}
                            className={`cursor-pointer transition-colors ${selectedModelId === item.Model_ID ? 'bg-primary/5' : ''}`}
                            onClick={() => setSelectedModelId(item.Model_ID)}
                          >
                            <TableCell>
                              <div className="font-medium text-primary">{item.Model_Name}</div>
                              <div className="text-xs text-muted-foreground">{item.Project_Name}</div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.Total_Documents.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.Total_Pages.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Right Side Stack: Chart & Execution Details */}
              <div className="flex-1 lg:max-w-[65%] flex flex-col gap-6">
                {/* Chart Panel */}
                {selectedModelId ? (
                  <Card className="flex flex-col h-[350px] shrink-0 animate-in slide-in-from-right-8 duration-300">
                    <CardHeader className="border-b shrink-0 py-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-primary" /> Daily Trend
                      </CardTitle>
                      <CardDescription>
                        {billingSummary.find((s: any) => s.Model_ID === selectedModelId)?.Model_Name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 min-h-0">
                      {isChartLoading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
                      ) : chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                          <BarChart2 className="h-10 w-10 opacity-20" />
                          <p>No daily data available.</p>
                        </div>
                      ) : (
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="Date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickMargin={10} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Area type="monotone" dataKey="Total_Documents" name="Documents" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDocs)" />
                              <Area type="monotone" dataKey="Total_Pages" name="Pages" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorPages)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center shrink-0 bg-slate-50/50 border-dashed min-h-[500px]">
                    <BarChart2 className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No model selected</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Select a model from the consumption table to view the daily processing trends and statistics.</p>
                  </Card>
                )}

                {/* Execution Details Panel */}
                {selectedModelId && (
                  <Card className="flex flex-col h-[350px] shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-300 overflow-hidden">
                    <CardHeader className="shrink-0 py-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Execution Details
                      </CardTitle>
                      <CardDescription>
                        Execution logs and runtime metrics for {billingSummary.find((s: any) => s.Model_ID === selectedModelId)?.Model_Name}
                      </CardDescription>
                    </CardHeader>
                    <div className="overflow-auto flex-1 min-h-0 border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">ID</TableHead>
                            <TableHead className="whitespace-nowrap">Trigger Source</TableHead>
                            <TableHead className="whitespace-nowrap">Triggered By</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Documents</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Pages</TableHead>
                            <TableHead className="whitespace-nowrap">Start Time</TableHead>
                            <TableHead className="whitespace-nowrap">End Time</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Runtime (s)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isExecutionsLoading ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading execution details...</TableCell></TableRow>
                          ) : executionsData.length === 0 ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No execution logs found for this model in the selected period.</TableCell></TableRow>
                          ) : (
                            executionsData.map((exec: any) => (
                              <TableRow key={exec.Execution_ID}>
                                <TableCell className="font-mono text-xs whitespace-nowrap">{exec.Execution_ID}</TableCell>
                                <TableCell className="whitespace-nowrap">{exec.Trigger_Source || "—"}</TableCell>
                                <TableCell className="whitespace-nowrap">{exec.Triggered_By || "—"}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge variant="outline" className={
                                    exec.Execution_Status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    exec.Execution_Status === "Failed" ? "bg-red-50 text-red-700 border-red-200" :
                                    exec.Execution_Status === "Running" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    exec.Execution_Status === "Partial" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-slate-50 text-slate-700 border-slate-200"
                                  }>
                                    {exec.Execution_Status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">{exec.No_of_Documents ?? "—"}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{exec.No_of_page ?? "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{exec.Start_Time ? new Date(exec.Start_Time).toLocaleString() : "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{exec.End_Time ? new Date(exec.End_Time).toLocaleString() : "—"}</TableCell>
                                <TableCell className="text-right font-mono text-xs whitespace-nowrap">{exec.Runtime_Seconds ?? "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "users" && (
          <div className="animate-in fade-in duration-300">
            <CustomerUsers customerId={customerId} />
          </div>
        )}
        
        {activeTab === "apis" && (
          <div className="animate-in fade-in duration-300">
            <CustomerApiKeys customerId={customerId} />
          </div>
        )}
      </div>
    </div>
  );
}
