import { Outlet } from "react-router-dom";
import { ReceiptText, BarChart3, ShieldCheck, Globe } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT PANEL - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0">
              <ReceiptText className="text-indigo-600" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Invonit</span>
          </div>

          <div className="max-w-md space-y-6">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Manage your business with <span className="text-indigo-200">ease.</span>
            </h1>
            <p className="text-lg text-indigo-100 font-medium leading-relaxed">
              The all-in-one platform for professional invoicing, client management, and real-time financial reporting.
            </p>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="relative z-10 grid grid-cols-1 gap-6">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/15">
            <div className="p-2 bg-indigo-500/30 rounded-lg">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Bank-level Security</h3>
              <p className="text-sm text-indigo-100/80">Your data is encrypted and protected with enterprise-grade security protocols.</p>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/15">
            <div className="p-2 bg-indigo-500/30 rounded-lg">
              <Globe className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Global Reach</h3>
              <p className="text-sm text-indigo-100/80">Support for multi-currency invoicing and automatic tax calculations worldwide.</p>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/15">
            <div className="p-2 bg-indigo-500/30 rounded-lg">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Powerful Analytics</h3>
              <p className="text-sm text-indigo-100/80">Gain insights into your business performance with real-time financial dashboards.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-indigo-200 text-sm font-medium">
          © {new Date().getFullYear()} Invonit Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </div>
      </div>
    </div>
  );
}