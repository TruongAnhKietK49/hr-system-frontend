import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  Building2,
  Lock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ApiResponse } from "@/types/auth";

const Index = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const getLoginErrorMessage = (error: unknown) => {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;

    if (axiosError.response?.status === 401) {
      return "Tên đăng nhập hoặc mật khẩu không đúng.";
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    return "Không thể đăng nhập. Vui lòng kiểm tra backend hoặc kết nối mạng.";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      const user = await login({
        username: trimmedUsername,
        password: trimmedPassword,
      });

      setSuccessMessage("Đăng nhập thành công. Đang chuyển hướng...");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch (error) {
      setError(getLoginErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-[var(--shadow-card)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Building2
              className="h-8 w-8 text-primary-foreground"
              strokeWidth={2.2}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            HR Management System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống quản lý nhân sự
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-2xl p-8"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              Đăng nhập
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div
              role="alert"
              aria-live="polite"
              className={`min-h-[2.5rem] transition-opacity ${
                error || successMessage ? "opacity-100" : "opacity-0"
              }`}
            >
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-medium shadow-[var(--shadow-soft)] transition-transform active:scale-[0.99]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {successMessage
                    ? "Đang chuyển hướng..."
                    : "Đang đăng nhập..."}
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 HR Management System · Database Security Course Project
        </p>
      </div>
    </main>
  );
};

export default Index;
