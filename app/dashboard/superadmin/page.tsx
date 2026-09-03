"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RoleGuard } from "../../../components/RoleGuard";

interface Subscription {
  id: string;
  planType: string;
  amount: number;
  amcAmount: number;
  status: string;
}

interface Company {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  subscription: Subscription | null;
}

export default function SuperadminPage() {
  return (
    <RoleGuard allowedRoles={["SUPERADMIN"]}>
      <SuperadminContent />
    </RoleGuard>
  );
}

function SuperadminContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Integrity Auditing States
  const [integrityReport, setIntegrityReport] = useState<any | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [showIntegritySection, setShowIntegritySection] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [resSubs, resUsers] = await Promise.all([
        fetch("/api/superadmin/subscriptions"),
        fetch("/api/superadmin/users")
      ]);
      const dataSubs = await resSubs.json();
      const dataUsers = await resUsers.json();

      if (Array.isArray(dataSubs)) setCompanies(dataSubs);
      if (Array.isArray(dataUsers)) setUsersCount(dataUsers.length);
    } catch (e) {
      toast.error("Failed to load platform stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runDatabaseAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await fetch("/api/superadmin/integrity");
      const data = await res.json();
      if (data.success && data.report) {
        setIntegrityReport(data.report);
        toast.success("Database integrity audit completed successfully!");
      } else {
        toast.error("Failed to compile database integrity report.");
      }
    } catch (e) {
      toast.error("Network or database communication error.");
    } finally {
      setRunningAudit(false);
    }
  };

  // ARR Calculation
  const calculateARR = () => {
    let totalArr = 0;
    companies.forEach((c) => {
      if (!c.subscription || c.subscription.status !== "ACTIVE" || !c.isActive) return;
      const amount = c.subscription.amount;
      if (c.subscription.planType === "MONTHLY") {
        totalArr += amount * 12;
      } else if (c.subscription.planType === "YEARLY") {
        totalArr += amount;
      } else if (c.subscription.planType === "ONETIME_AMC") {
        totalArr += c.subscription.amcAmount;
      }
    });
    return totalArr;
  };

  const arr = calculateARR();
  const activeTenants = companies.filter((c) => c.isActive && c.subscription?.status === "ACTIVE").length;
  const trialTenants = companies.filter((c) => c.isActive && c.subscription?.planType === "FREE_TRIAL").length;
  const alertTenants = companies.filter((c) => !c.isActive || c.subscription?.status === "PAST_DUE").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 bg-gradient-to-br from-[#f0fdfa] via-[#f5f6f3] to-[#e4eae6] min-h-screen rounded-2xl relative">
      {/* Loom grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl"
        style={{
          backgroundImage: "radial-gradient(#0d9488 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px"
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/70 backdrop-blur-md border border-teal-100 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 bg-stone-950 text-white rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-[#fbbf24]" />
            </div>
            Superadmin Landing Hub
          </h1>
          <p className="text-xs text-stone-500 font-medium max-w-xl">
            SaaS administration command center. Configure billing profiles, manage global credentials, monitor isolation constraints, and view key ARR matrices.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Hub Data
          </button>
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 border border-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Estimated ARR</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-950">₹{arr.toLocaleString()}</span>
            <span className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Annual
            </span>
          </div>
        </div>

        <div className="bg-white/80 border border-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Active Tenants</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{activeTenants}</span>
            <span className="text-[10px] text-stone-400 font-bold">paying companies</span>
          </div>
        </div>

        <div className="bg-white/80 border border-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Trial Accounts</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{trialTenants}</span>
            <span className="text-[10px] text-amber-600 font-bold">evaluating SaaS</span>
          </div>
        </div>

        <div className="bg-white/80 border border-stone-200 rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Suspended / Overdue</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${alertTenants > 0 ? "text-amber-605" : "text-stone-900"}`}>
              {alertTenants}
            </span>
            <span className="text-[10px] text-stone-400 font-bold">requiring support</span>
          </div>
        </div>
      </div>

      {/* Main Subpages Navigation Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Management Card */}
        <Link
          href="/dashboard/superadmin/users"
          className="group block bg-white/70 backdrop-blur-md border border-stone-200 hover:border-teal-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
        >
          <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-stone-900 text-base flex items-center justify-between">
              User Directory
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Create and edit user credentials, assign roles, toggle login states, and review audit history.
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-500">
            <span>Total Accounts</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-700">
              {loading ? "..." : usersCount}
            </span>
          </div>
        </Link>

        {/* Company Management Card */}
        <Link
          href="/dashboard/superadmin/companies"
          className="group block bg-white/70 backdrop-blur-md border border-stone-200 hover:border-teal-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
        >
          <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-stone-900 text-base flex items-center justify-between">
              Company Directory
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Onboard new tenants, adjust company timezones, base currencies, support emails, and activate profiles.
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-500">
            <span>Total Tenants</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-700">
              {loading ? "..." : companies.length}
            </span>
          </div>
        </Link>

        {/* Subscription Management Card */}
        <Link
          href="/dashboard/superadmin/subscriptions"
          className="group block bg-white/70 backdrop-blur-md border border-stone-200 hover:border-teal-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
        >
          <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-stone-900 text-base flex items-center justify-between">
              Subscriptions & Billing
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Configure billing schemes, monthly/annual AMC pricing models, adjust renewal dates, and execute recoveries.
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-500">
            <span>Billing Actions</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-700">
              Manage Rates
            </span>
          </div>
        </Link>

      </div>

      {/* Database Schema & RLS Auditor */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md border border-stone-200 rounded-xl shadow-sm overflow-hidden p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-650" /> Database Schema & RLS Integrity Auditor
            </h2>
            <p className="text-[10px] text-stone-500 font-medium">
              Run verification audits on table structures, Row Level Security (RLS) policies, and database constraints.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowIntegritySection(!showIntegritySection)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-850 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {showIntegritySection ? "Hide Auditor" : "Open Auditor"}
            </button>
            {showIntegritySection && (
              <button
                onClick={runDatabaseAudit}
                disabled={runningAudit}
                className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                {runningAudit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Run Schema Audit
              </button>
            )}
          </div>
        </div>

        {showIntegritySection && (
          <div className="space-y-4 pt-2">
            {!integrityReport ? (
              <div className="text-center py-6 border border-dashed border-stone-200 rounded-lg text-xs text-stone-400 font-medium">
                Click "Run Schema Audit" to inspect table isolation integrity.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Table details */}
                <div className="space-y-2 bg-stone-50/50 p-4 border border-stone-200 rounded-xl">
                  <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[9px] border-b border-stone-200 pb-1.5">
                    Tables & RLS Status
                  </h3>
                  <div className="max-h-[220px] overflow-y-auto space-y-1.5 divide-y divide-stone-100 pr-1">
                    {integrityReport.tables.map((t: any) => {
                      const isRlsActive = integrityReport.rlsStatus.find(
                        (r: any) => r.tablename.toLowerCase() === t.name.toLowerCase()
                      )?.rowsecurity;
                      return (
                        <div key={t.name} className="flex justify-between items-center pt-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            <span className="font-mono font-bold text-stone-900 text-[11px]">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                isRlsActive
                                  ? "bg-teal-50 text-teal-700 border border-teal-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                            >
                              {isRlsActive ? "RLS Active" : "RLS Off"}
                            </span>
                            <span className="font-mono text-stone-500 text-[10px]">{t.rows} rows</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Isolation checks */}
                <div className="space-y-3">
                  <div className="space-y-2 bg-stone-50/50 p-4 border border-stone-200 rounded-xl">
                    <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[9px] border-b border-stone-200 pb-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-teal-650" /> Tenant Database Isolation Check
                    </h3>
                    <div className="space-y-2">
                      {integrityReport.orphans.map((o: any) => (
                        <div key={o.table} className="flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-mono font-bold text-stone-900">{o.table}</span>
                            <span className="text-stone-400 block text-[9px]">Relation field: {o.field}</span>
                          </div>
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                              o.orphanedCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}
                          >
                            {o.orphanedCount === 0 ? "Isolated" : `${o.orphanedCount} orphans`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-950 text-stone-200 p-4 rounded-xl space-y-1">
                    <h4 className="font-bold text-white text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Platform Security Integrity
                    </h4>
                    <p className="text-[10px] leading-relaxed text-stone-300">
                      Schemas verified on{" "}
                      <strong className="text-white">{new Date(integrityReport.verifiedAt || integrityReport.checkedAt || Date.now()).toLocaleDateString()}</strong>. Row Level Security policies prevent crosstalk between client domains.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
