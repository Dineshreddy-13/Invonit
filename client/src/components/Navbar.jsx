import React from "react";
import { Bell, HelpCircle, Search, Menu, Plus } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  // Basic path to info converter
  const getPageInfo = () => {
    const path = location.pathname.split("/").pop();
    if (!path || path === "dashboard") return { title: "Dashboard", subtitle: "Welcome back to Invonit" };

    if (path === "parties") {
      return { title: "Parties", subtitle: "Manage your customers and suppliers" };
    }

    if (path === "purchases") {
      return { title: "Purchases", subtitle: "Record inventory stock-in and supplier bills" };
    }

    if (path === "inventory") {
      return { title: "Inventory", subtitle: "Track stock and manage product catalog" };
    }

    if (path === "masters") {
      return { title: "Inventory Masters", subtitle: "Manage categories and tax slabs" };
    }

    const capitalized = path.charAt(0).toUpperCase() + path.slice(1);
    return { title: capitalized, subtitle: "Manage your " + path };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle (hidden on desktop) */}
        <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/parties?new=true"
          className="hidden md:flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Add Party</span>
        </Link>
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="Search anything..."
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
