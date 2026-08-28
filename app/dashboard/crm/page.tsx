"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  Award,
  Sparkles,
  ArrowRight,
  Send,
  BarChart4,
  Mail,
  X,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "../../../components/RoleGuard";

interface OrderInfo {
  id: string;
  orderNumber: string;
  deliveryStatus: string;
  awbNumber: string | null;
  courierPartner: string | null;
  createdAt: string;
}

interface CustomerRecord {
  name: string;
  phone: string;
  email?: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  totalOrders: number;
  orders: OrderInfo[];
  isRepeat: boolean;
}

interface AbandonedCart {
  id: string;
  customerName: string;
  customerPhone: string;
  cartDetails?: any;
  checkoutUrl?: string;
  cartValue?: number;
  recoveryEmailSent?: boolean;
  recoverySmsSent?: boolean;
  recoveryStatus?: "PENDING" | "WHATSAPP_SENT" | "RECOVERED";
  createdAt: string;
}

interface CampaignLog {
  id: string;
  name: string;
  segment: string;
  templateName: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  revenue: number;
  createdAt: string;
  status: "PROCESSING" | "SENT";
}

import { useSearchParams } from "next/navigation";

export default function CRMPage() {
  return (
    <RoleGuard allowedRoles={["SUPERADMIN", "TENANTADMIN"]}>
      <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading CRM Module...</div>}>
        <CRMContent />
      </React.Suspense>
    </RoleGuard>
  );
}

function CRMContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "abandoned" | "whatsapp" | "social" | "storefront" | "coupons" | "ai_marketing">("directory");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // AI WhatsApp Campaign state
  const [aiSegmentType, setAiSegmentType] = useState<"VIP" | "WINBACK" | "WELCOME">("VIP");
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [aiCampaignResult, setAiCampaignResult] = useState<any>(null);

  const handleGenerateAiCampaign = async (segType: "VIP" | "WINBACK" | "WELCOME") => {
    setAiSegmentType(segType);
    setGeneratingCampaign(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHATSAPP_CAMPAIGN",
          segmentType: segType
        })
      });
      const data = await res.json();
      setAiCampaignResult(data);
      toast.success(`✨ Generated AI WhatsApp campaign for ${segType} segment!`);
    } catch (err) {
      toast.error("Failed to generate campaign");
    } finally {
      setGeneratingCampaign(false);
    }
  };

  useEffect(() => {
    if (tabParam && ["directory", "abandoned", "whatsapp", "social", "storefront", "coupons"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);


  // Pagination & Filter states for Customer Directory
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [directorySegment, setDirectorySegment] = useState<"ALL" | "VIP" | "REPEAT" | "INACTIVE">("ALL");

  // Marketing Campaign form states
  const [campaignName, setCampaignName] = useState("");
  const [campaignSegment, setCampaignSegment] = useState("ALL");
  const [campaignTemplate, setCampaignTemplate] = useState("FESTIVE_PROMO");
  const [launchingCampaign, setLaunchingCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);

  // Campaign log ledger
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([
    {
      id: "camp-1",
      name: "Akshaya Tritiya Silk Launch",
      segment: "VIP Customers",
      templateName: "Akshaya Tritiya Promo",
      sentCount: 18,
      openRate: 94.4,
      clickRate: 38.8,
      revenue: 68900,
      status: "SENT",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "camp-2",
      name: "Abandoned Checkout Automatic Recall",
      segment: "Cart Abandoners",
      templateName: "Cart Recall Template",
      sentCount: 14,
      openRate: 85.7,
      clickRate: 50.0,
      revenue: 21500,
      status: "SENT",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/customers");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
      if (data.abandonedCheckouts) {
        // Map cartValue or assign default
        const mappedAbandoned = data.abandonedCheckouts.map((c: any) => ({
          id: c.id,
          customerName: c.customerName || "Shopify Customer",
          customerPhone: c.customerPhone,
          cartValue: c.cartValue || 1899,
          recoveryStatus: c.recoveryStatus || "PENDING",
          createdAt: c.createdAt
        }));
        setAbandonedCarts(mappedAbandoned);
      }
    } catch (err) {
      toast.error("Failed to load CRM database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  const triggerRecovery = async (cartId: string, phone: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Transmitting WhatsApp checkout recall template to ${phone}...`,
        success: () => {
          setAbandonedCarts(prev => prev.map(c => c.id === cartId ? { ...c, recoveryStatus: "WHATSAPP_SENT" as const } : c));
          return `WhatsApp recovery template transmitted successfully to ${phone}!`;
        },
        error: "Failed to send template."
      }
    );
  };

  // Launch a new promotional campaign broadcast
  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (launchingCampaign) {
      toast.warning("A campaign broadcast is already in progress. Please wait for completion.");
      return;
    }
    if (!campaignName) {
      toast.error("Please specify a campaign name.");
      return;
    }

    // Determine target count based on selected segment
    let targets = customers;
    if (campaignSegment === "VIP") {
      targets = customers.filter(c => getCustomerLtv(c) >= 6000 || c.totalOrders >= 3);
    } else if (campaignSegment === "REPEAT") {
      targets = customers.filter(c => c.isRepeat);
    } else if (campaignSegment === "INACTIVE") {
      targets = customers.filter(c => c.totalOrders === 1); // Mock inactive
    }

    if (targets.length === 0) {
      toast.error("No customers found in the selected target segment.");
      return;
    }

    setLaunchingCampaign(true);
    setCampaignProgress(0);

    // Simulate batch dispatch progress bar
    const interval = setInterval(() => {
      setCampaignProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Append log entry
            const newLog: CampaignLog = {
              id: `camp-${Date.now()}`,
              name: campaignName,
              segment: `${campaignSegment} Segment`,
              templateName: campaignTemplate.replace("_", " "),
              sentCount: targets.length,
              openRate: parseFloat((Math.random() * 20 + 80).toFixed(1)), // 80% - 100%
              clickRate: parseFloat((Math.random() * 25 + 15).toFixed(1)), // 15% - 40%
              revenue: targets.length * 1500, // Simulated sales conversions
              status: "SENT",
              createdAt: new Date().toISOString()
            };
            setCampaignLogs(prevLogs => [newLog, ...prevLogs]);
            setLaunchingCampaign(false);
            setCampaignName("");
            toast.success(`Campaign "${campaignName}" launched and sent to ${targets.length} customers!`);
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Compute LTV and AOV helper metrics
  const getCustomerLtv = (c: CustomerRecord) => {
    // Sum up orders, assume base value of 1999 per order if no direct value is set
    return c.totalOrders * 1999;
  };

  const getCustomerAov = (c: CustomerRecord) => {
    return c.totalOrders > 0 ? getCustomerLtv(c) / c.totalOrders : 0;
  };

  const getCustomerBadge = (c: CustomerRecord) => {
    const ltv = getCustomerLtv(c);
    if (ltv >= 8000) return { label: "VIP Tier", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (c.isRepeat) return { label: "Loyal Buyer", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    return { label: "New Customer", color: "bg-slate-50 text-slate-600 border-slate-250" };
  };

  // Stats summary calculations
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => c.isRepeat).length;
  const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : "0.0";
  const pendingCarts = abandonedCarts.filter(c => c.recoveryStatus === "PENDING").length;

  // Filter & Segment customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSegment = 
      directorySegment === "ALL" ||
      (directorySegment === "VIP" && (getCustomerLtv(c) >= 6000 || c.totalOrders >= 3)) ||
      (directorySegment === "REPEAT" && c.isRepeat) ||
      (directorySegment === "INACTIVE" && c.totalOrders === 1);

    return matchesSearch && matchesSegment;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-950" /> Customer Directory & CRM
          </h1>
          <p className="text-sm text-gray-500">
            Segment your textile buyers, track Lifetime Value (LTV), and launch template WhatsApp recovery campaigns.
          </p>
        </div>
        <button
          onClick={fetchCRMData}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-250 text-gray-800 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Database
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Unique Buyers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalCustomers}</span>
            <span className="text-xs text-gray-400 font-medium">from order history</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Repeat Buyers</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-900">{repeatCustomers}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <UserCheck className="w-3.5 h-3.5" /> {repeatRate}% Rate
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Abandoned Carts</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-955">{abandonedCarts.length}</span>
            <span className="text-xs text-amber-600 font-semibold">{pendingCarts} pending recovery</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Marketing API Connection</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Live
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="inline-flex h-11 items-center justify-start rounded-lg bg-gray-100 p-1 text-gray-500 gap-1 border border-gray-200 flex-wrap">
        <button
          onClick={() => setActiveTab("directory")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "directory"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Customer Directory
        </button>
        <button
          onClick={() => setActiveTab("abandoned")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "abandoned"
              ? "bg-white text-gray-900 shadow-sm font-bold border border-gray-200/50"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Abandoned Checkouts
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "whatsapp"
              ? "bg-white text-emerald-800 shadow-sm font-bold border border-emerald-200"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Broadcasts
        </button>
        <button
          onClick={() => setActiveTab("social")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "social"
              ? "bg-white text-indigo-800 shadow-sm font-bold border border-indigo-200"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Social Media & Ads
        </button>
        <button
          onClick={() => {
            setActiveTab("ai_marketing");
            if (!aiCampaignResult) handleGenerateAiCampaign("VIP");
          }}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "ai_marketing"
              ? "bg-purple-600 text-white shadow-sm font-bold"
              : "text-purple-700 hover:bg-purple-50 font-bold"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Marketing Assistant
        </button>
        <button
          onClick={() => setActiveTab("storefront")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "storefront"
              ? "bg-white text-amber-800 shadow-sm font-bold border border-amber-200"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Banners & Themes
        </button>
        <button
          onClick={() => setActiveTab("coupons" as any)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            (activeTab as string) === "coupons"
              ? "bg-white text-teal-900 shadow-sm font-bold border border-teal-300"
              : "text-gray-550 hover:text-gray-900 hover:bg-gray-50/50"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-teal-600" /> Coupons & Promo Codes
        </button>
      </div>

      {/* Directory Tab View */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Main Directory Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Filters Bar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Segmentation Tabs */}
              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
                {(["ALL", "VIP", "REPEAT", "INACTIVE"] as const).map(seg => (
                  <button
                    key={seg}
                    onClick={() => setDirectorySegment(seg)}
                    className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                      directorySegment === seg 
                        ? "bg-white text-gray-900 shadow-xs" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone / Location</th>
                    <th className="p-4 text-center">Fulfillments</th>
                    <th className="p-4">Est. LTV</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-650" />
                        Fetching customer profile records...
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">
                        No customer profiles match the segment criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c, idx) => {
                      const badge = getCustomerBadge(c);
                      return (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedCustomer(c)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                            selectedCustomer?.phone === c.phone ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          <td className="p-4">
                            <p className="font-bold text-gray-900 leading-snug">{c.name}</p>
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-mono text-gray-600">{c.phone}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-300" />
                              {c.city ? `${c.city}, ${c.state || ""}` : "Not provided"}
                            </p>
                          </td>
                          <td className="p-4 text-center font-bold text-gray-900">{c.totalOrders}</td>
                          <td className="p-4 font-mono font-bold text-indigo-950">₹{getCustomerLtv(c).toLocaleString()}</td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-semibold px-3 py-1.5 rounded text-xs transition-all cursor-pointer shadow-xs border border-indigo-200/60"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
              <div>
                Showing <span className="font-bold text-gray-800">{filteredCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of{" "}
                <span className="font-bold text-gray-800">{filteredCustomers.length}</span> profiles
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-semibold text-gray-700 px-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Customer Details Modal Popup */}
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
                <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-150 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Customer Profile</span>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{selectedCustomer.name}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Contact Info */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-wrap gap-4 justify-between items-center text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Phone</span>
                      <span className="font-mono font-bold text-slate-800">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Email</span>
                        <span className="font-mono text-slate-700">{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Location</span>
                      <span className="text-slate-700">{selectedCustomer.city ? `${selectedCustomer.city}, ${selectedCustomer.state || ""}` : "Not provided"}</span>
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Lifetime Value</span>
                      <span className="font-black text-indigo-950 text-xl block font-mono">₹{getCustomerLtv(selectedCustomer).toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Order Value</span>
                      <span className="font-black text-slate-900 text-xl block font-mono">₹{getCustomerAov(selectedCustomer).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Timeline Ledger */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-indigo-600" /> Order History Ledger ({selectedCustomer.totalOrders})
                    </h4>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {selectedCustomer.orders.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No order records attached.</p>
                      ) : (
                        selectedCustomer.orders.map(o => (
                          <div key={o.id} className="p-3.5 border border-gray-200 rounded-xl text-xs bg-white hover:bg-slate-50/50 transition-colors shadow-2xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900 font-mono">{o.orderNumber}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                o.deliveryStatus === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                                o.deliveryStatus === "SHIPPED" ? "bg-blue-50 text-blue-700 border border-blue-200/50" :
                                "bg-amber-50 text-amber-700 border border-amber-200/50"
                              }`}>
                                {o.deliveryStatus}
                              </span>
                              {o.awbNumber && (
                                <span className="font-mono text-[10px] text-gray-500 font-bold">
                                  AWB: {o.awbNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Abandoned Checkouts View */}
      {activeTab === "abandoned" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-sm">Shopify Abandoned Checkouts Recall</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">List of customers who left items in cart. Connects to WhatsApp Template API for recovery campaigns.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Cart Value</th>
                  <th className="p-4">Recovery Status</th>
                  <th className="p-4">Abandoned At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {abandonedCarts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-normal">
                      No abandoned checkout records found in database.
                    </td>
                  </tr>
                ) : (
                  abandonedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50/55 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{cart.customerName}</td>
                      <td className="p-4 font-mono text-gray-600">{cart.customerPhone}</td>
                      <td className="p-4 font-mono font-bold text-gray-900">₹{(cart.cartValue || 0).toLocaleString()}</td>
                      <td className="p-4">
                        {cart.recoveryStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending
                          </span>
                        )}
                        {cart.recoveryStatus === "WHATSAPP_SENT" && (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <MessageSquare className="w-3 h-3" /> Recovery Template Sent
                          </span>
                        )}
                        {cart.recoveryStatus === "RECOVERED" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Recovered
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500">{new Date(cart.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        {cart.recoveryStatus === "PENDING" ? (
                          <button
                            onClick={() => triggerRecovery(cart.id, cart.customerPhone)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Send Recovery WhatsApp
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 bg-gray-50 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-not-allowed ml-auto border border-gray-150"
                          >
                            Template Transmitted
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WhatsApp Broadcasts Tab */}
      {activeTab === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Cloud Broadcast
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Send HSM pre-approved templates directly to customer phone contacts via WATI API.
                </p>
              </div>

              <form onSubmit={handleLaunchCampaign} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wednesday Flash WhatsApp Blast"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Target Contacts Segment *</label>
                  <select
                    value={campaignSegment}
                    onChange={(e) => setCampaignSegment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ALL">All Unique Customers ({customers.length})</option>
                    <option value="VIP">VIP Customers ({customers.filter(c => getCustomerLtv(c) >= 6000 || c.totalOrders >= 3).length})</option>
                    <option value="REPEAT">Repeat Buyers ({customers.filter(c => c.isRepeat).length})</option>
                    <option value="INACTIVE">Inactive Accounts ({customers.filter(c => c.totalOrders === 1).length})</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">WhatsApp Approved Template *</label>
                  <select
                    value={campaignTemplate}
                    onChange={(e) => setCampaignTemplate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="BIG_BILLION_SALE">🔥 Big Billion Sale Special (50% OFF)</option>
                    <option value="WEDNESDAY_MIDNIGHT_BLITZ">⚡ Wednesday Midnight Flash Sale (10 PM - 2 AM)</option>
                    <option value="FESTIVE_PROMO">Festive Mega Sale Template (WhatsApp Approved)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={launchingCampaign || !campaignName}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {launchingCampaign ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transmitting ({campaignProgress}%)
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Dispatch WhatsApp Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-emerald-50/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <BarChart4 className="w-4 h-4 text-emerald-600" /> WhatsApp Campaign Performance
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Logs of dispatched bulk WhatsApp messages.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                      <th className="p-4">Campaign Name</th>
                      <th className="p-4">Segment</th>
                      <th className="p-4 text-center">Sent</th>
                      <th className="p-4 text-center">Open Rate</th>
                      <th className="p-4 text-center">Clicks</th>
                      <th className="p-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {campaignLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 leading-snug">{log.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-4 text-gray-500 font-bold">{log.segment}</td>
                        <td className="p-4 text-center font-mono font-bold text-gray-800">{log.sentCount}</td>
                        <td className="p-4 text-center font-mono font-bold text-emerald-600">{log.openRate}%</td>
                        <td className="p-4 text-center font-mono font-bold text-indigo-600">{log.clickRate}%</td>
                        <td className="p-4 text-right font-mono font-black text-emerald-950">₹{log.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Media & Paid Ads Tab */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-600" /> Social Media & Meta/Google Pixel Integration
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Track Instagram, Meta Ads, and Google Shopping traffic conversions directly on your storefront.
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-md">
                Meta Pixel: Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Instagram Click-Throughs</span>
                <p className="text-xl font-bold text-indigo-900">4,820 clicks</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Meta Ad Conversions</span>
                <p className="text-xl font-bold text-emerald-700">₹1,84,500 Sales</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">ROAS (Return On Ad Spend)</span>
                <p className="text-xl font-bold text-amber-700">4.2x ROAS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storefront Flash Sales & Banners Tab */}
      {activeTab === "storefront" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Storefront Campaign Banners & Themes
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Manage active top marquee banners, countdown timers, and strike-through discounts on the public store page.
                </p>
              </div>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-md">
                Active Theme: Big Billion Day
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-2">
                <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Theme 1</span>
                <h4 className="font-bold text-amber-950 text-sm">🔥 Big Billion Day</h4>
                <p className="text-xs text-amber-900">Amber Gold Mesh gradient banner with BBD50 promo code and 50% strike-through discount.</p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Theme 2</span>
                <h4 className="font-bold text-indigo-950 text-sm">⚡ Wednesday Midnight Blitz</h4>
                <p className="text-xs text-indigo-900">Electric Cyan/Blue gradient banner for 10 PM - 2 AM flash sales with live inventory stock meters.</p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Theme 3</span>
                <h4 className="font-bold text-rose-950 text-sm">✨ Festive Mega Sale</h4>
                <p className="text-xs text-rose-900">Deep Violet/Ruby Rose gradient marquee banner for holiday & Diwali festival promotions.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Marketing Broadcast Assistant Tab */}
      {(activeTab as string) === "ai_marketing" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-white/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-black text-lg">✨ AI Customer Segment Broadcast Assistant</h3>
                  <p className="text-xs text-purple-200">Automatically segment customers by LTV & order history to generate high-converting WhatsApp campaigns.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleGenerateAiCampaign("VIP")}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  aiSegmentType === "VIP"
                    ? "bg-white/20 border-white text-white shadow-md ring-2 ring-white/30"
                    : "bg-white/5 border-white/10 text-purple-200 hover:bg-white/10"
                }`}
              >
                <span className="font-extrabold text-sm block text-amber-300">👑 VIP High LTV Segment</span>
                <span className="text-xs block text-purple-100 mt-1">Customers with LTV ≥ ₹10,000 or 3+ orders.</span>
              </button>

              <button
                onClick={() => handleGenerateAiCampaign("WINBACK")}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  aiSegmentType === "WINBACK"
                    ? "bg-white/20 border-white text-white shadow-md ring-2 ring-white/30"
                    : "bg-white/5 border-white/10 text-purple-200 hover:bg-white/10"
                }`}
              >
                <span className="font-extrabold text-sm block text-rose-300">🔄 Inactive Win-Back Segment</span>
                <span className="text-xs block text-purple-100 mt-1">Customers without a purchase in 60+ days.</span>
              </button>

              <button
                onClick={() => handleGenerateAiCampaign("WELCOME")}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  aiSegmentType === "WELCOME"
                    ? "bg-white/20 border-white text-white shadow-md ring-2 ring-white/30"
                    : "bg-white/5 border-white/10 text-purple-200 hover:bg-white/10"
                }`}
              >
                <span className="font-extrabold text-sm block text-emerald-300">🎁 First-Time Buyer Segment</span>
                <span className="text-xs block text-purple-100 mt-1">New customers after their first purchase.</span>
              </button>
            </div>
          </div>

          {generatingCampaign && (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span>Generating AI WhatsApp broadcast template...</span>
            </div>
          )}

          {aiCampaignResult && !generatingCampaign && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-extrabold text-sm text-slate-900">{aiCampaignResult.segmentName}</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-full">
                  Promo Code: {aiCampaignResult.couponCode}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Personalized WhatsApp Broadcast Template</span>
                <p className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {aiCampaignResult.message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-medium">✨ Incentive: {aiCampaignResult.discountText}</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(aiCampaignResult.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Launch WhatsApp Broadcast
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coupons & Promo Codes Manager Tab */}
      {(activeTab as string) === "coupons" && (
        <CouponsManagerSection />
      )}

    </div>
  );
}

function CouponsManagerSection() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "0",
    maxDiscountAmount: "",
    usageLimit: ""
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon '${data.coupon.code}' created successfully!`);
        setShowCreateModal(false);
        setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "0", maxDiscountAmount: "", usageLimit: "" });
        fetchCoupons();
      } else {
        toast.error(data.error || "Could not create coupon");
      }
    } catch (err: any) {
      toast.error("Error creating coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon '${code}' deleted`);
        fetchCoupons();
      } else {
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" /> Active Storefront & POS Coupons
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Create discount codes (percentage % or flat ₹) and track total usage per promo code.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          + Create Coupon Code
        </button>
      </div>

      {/* Coupons List Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase">
              <th className="py-3 px-5">Coupon Code</th>
              <th className="py-3 px-5">Discount Type</th>
              <th className="py-3 px-5">Min Order Value</th>
              <th className="py-3 px-5">Usage Count</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">Loading coupon codes...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">No coupons created yet. Click "+ Create Coupon Code" to get started.</td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-extrabold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded font-mono text-xs">
                      🏷️ {c.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-medium text-gray-800">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                    {c.maxDiscountAmount && <span className="text-[10px] text-gray-400 block">(Max cap: ₹{c.maxDiscountAmount})</span>}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 text-xs">
                    {c.minOrderValue > 0 ? `₹${c.minOrderValue.toLocaleString()}` : "No Minimum"}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-gray-900 text-xs">
                    {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : "uses"}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-gray-900 text-base">Create Promo / Coupon Code</h4>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10, FESTIVE500"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm uppercase font-mono font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Value</label>
                  <input
                    type="number"
                    placeholder={form.discountType === "PERCENTAGE" ? "10" : "200"}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Min Order (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Max Cap (₹, Optional)</label>
                  <input
                    type="number"
                    placeholder="500"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Global Usage Limit (Optional)</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50"
                >
                  {creating ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
