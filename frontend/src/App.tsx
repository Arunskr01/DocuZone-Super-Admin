import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomerList from "./pages/CustomerList";
import CustomerDetails from "./pages/CustomerDetails";
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const authStatus = localStorage.getItem("superAdminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem("superAdminAuth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminAuth");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold">SA</div>
                Super Admin Panel
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
