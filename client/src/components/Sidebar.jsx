import { NavLink } from "react-router-dom";
import Dropdown, { DropdownItem, DropdownDivider, DropdownHeader } from "./Dropdown";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  UserCircle,
  Plus,
  ClipboardList,
  Package,
  ShoppingCart
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useBusinessStore from "../store/businessStore";
import { cn } from "../lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Inv. Masters", href: "/inventory/masters", icon: ClipboardList },
  { name: "Parties", href: "/parties", icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { business } = useBusinessStore();

  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-slate-200 flex flex-col sticky top-0">
      {/* Sidebar Header: Business Profile */}
      <div className="px-4 py-2 border-b border-slate-200">
        <Dropdown
          align="bottom"
          trigger={
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
                <Building2 size={20} />
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <h2 className="text-sm font-semibold text-slate-900 truncate">
                  {business?.name || "Business Name"}
                </h2>
                <p className="text-xs text-slate-500 truncate">Business Profile</p>
              </div>
              <ChevronsUpDown size={16} className="ml-auto text-slate-400 group-hover:text-slate-600 shrink-0" />
            </div>
          }
        >
          <DropdownHeader>Manage Business</DropdownHeader>
          <DropdownItem icon={Settings} onClick={() => console.log("Business Settings")}>
            Business Settings
          </DropdownItem>
          <DropdownItem icon={Users} onClick={() => console.log("Team Members")}>
            Team Members
          </DropdownItem>
          <DropdownDivider />
          <DropdownHeader>Your Businesses</DropdownHeader>
          <DropdownItem icon={Building2} onClick={() => console.log("Switch")}>
            {business?.name || "Current Business"}
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem icon={Plus} onClick={() => console.log("Add Business")}>
            Add New Business
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Sidebar Navigation: Tabs */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto font-sans">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-colors" />
            <span>{item.name}</span>
            <ChevronRight className={cn(
              "ml-auto w-4 h-4 opacity-0 transition-all",
              "group-hover:opacity-100"
            )} />
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer: User Account */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/50">
        <Dropdown
          align="top"
          trigger={
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors group">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.fullName || user?.name || "User Name"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
              <ChevronsUpDown size={16} className="text-slate-400 group-hover:text-slate-600" />
            </div>
          }
        >
          <DropdownHeader>Account</DropdownHeader>
          <DropdownItem icon={UserCircle} onClick={() => console.log("Profile")}>
            My Profile
          </DropdownItem>
          <DropdownItem icon={Settings} onClick={() => console.log("Settings")}>
            Account Settings
          </DropdownItem>
          <DropdownItem icon={CreditCard} onClick={() => console.log("Billing")}>
            Billing & Plans
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={LogOut}
            variant="danger"
            onClick={logout}
          >
            Logout
          </DropdownItem>
        </Dropdown>
      </div>
    </aside>
  );
}
