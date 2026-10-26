"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckSquare,
  Users,
  FileText,
  Home,
  LogOut,
} from "lucide-react";
import { useSession } from "@/providers/session-provider";

export function AdminSidebar() {
  const router = useRouter();
  const { user, logout } = useSession();

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 text-white flex flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Admin <span className="text-rose-400">Portal</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav
          aria-label="Điều hướng Quản trị"
          className="flex flex-col gap-1.5 text-sm font-medium text-slate-300"
        >
          <Link
            href="/admin"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <CheckSquare className="size-4 text-rose-400" />
            <span>Duyệt sự kiện</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Users className="size-4 text-rose-400" />
            <span>Duyệt hồ sơ BTC</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <FileText className="size-4 text-rose-400" />
            <span>Nhật ký kiểm toán</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors text-slate-400"
          >
            <Home className="size-4" />
            <span>Về trang chủ</span>
          </Link>
        </nav>
      </div>

      {/* User info and Logout */}
      <div className="border-t border-slate-800 pt-4 mt-6">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="size-8 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/30">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user?.fullName || "Quản trị viên"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "admin@tickethub.vn"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer text-left"
        >
          <LogOut className="size-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
