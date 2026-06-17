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
  const [authUser, setAuthUser] = useState<any | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("superAdminAuthUser");
    if (storedUser) {
      try {
        setAuthUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("superAdminAuthUser");
      }
    }
  }, []);

  const handleLogin = (user: any) => {
    localStorage.setItem("superAdminAuthUser", JSON.stringify(user));
    setAuthUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminAuthUser");
    setAuthUser(null);
  };

  if (!authUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    );
  }

  const isSystemAdmin = authUser.User_ID === 0;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link to={isSystemAdmin ? "/" : `/customers/${authUser.Customer_ID}`} className="text-xl font-bold text-primary flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold">SA</div>
                Super Admin Panel
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:inline-block">Logged in as: <strong>{authUser.Username}</strong></span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {isSystemAdmin ? (
                <>
                  <Route path="/" element={<CustomerList />} />
                  <Route path="/customers/:id" element={<CustomerDetails />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  <Route path="/customers/:id" element={<CustomerDetails authUser={authUser} />} />
                  <Route path="*" element={<Navigate to={`/customers/${authUser.Customer_ID}`} replace />} />
                </>
              )}
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
