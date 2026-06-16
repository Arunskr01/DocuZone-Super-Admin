import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CustomerList from "./pages/CustomerList";
import CustomerDetails from "./pages/CustomerDetails";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="container mx-auto px-4 h-16 flex items-center">
              <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold">SA</div>
                Super Admin Panel
              </Link>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
