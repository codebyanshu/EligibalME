import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Mail, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { appAuthApi } from "@/lib/appApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { completeLogin } = useAuth();
  const destination = safeReturnTo();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const result = await appAuthApi.register(name, email, password);
      completeLogin(result);
      window.location.assign(destination);
    } catch (err) { setError(err.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Sign up to save your scheme applications" footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>}>
      {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" /></div></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" /></div><p className="text-xs text-muted-foreground">Use 12–128 characters.</p></div>
        <div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12" /></div>
        <Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthLayout>
  );
}
