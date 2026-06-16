import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "../api";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMut = useMutation({
    mutationFn: () => loginAdmin({ username, password }),
    onSuccess: () => {
      toast.success("Login successful");
      onLogin();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid credentials");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    loginMut.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-100 z-0 overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <Card className="w-full max-w-md z-10 shadow-xl border-slate-200/60 bg-white/90 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2 shadow-sm">
            <div className="text-white font-bold text-xl tracking-tighter">SA</div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Super Admin Portal</CardTitle>
          <CardDescription className="text-slate-500">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMut.isPending}
                className="bg-white"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMut.isPending}
                className="bg-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-6 shadow-sm" 
              disabled={loginMut.isPending}
            >
              {loginMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} DocuZone. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
