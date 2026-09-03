import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getContextCompanyId } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Get company
    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    let ordersQuery = supabase
      .from("OrderFulfillment")
      .select("id, orderNumber, customerName, customerPhone, deliveryStatus, awbNumber, courierPartner, createdAt, totalWeightKg, shippingState, shippingCity, shippingCost, customerShippingFee")
      .eq("companyId", companyId)
      .order("createdAt", { ascending: false });


    let movementsQuery = supabase
      .from("StockMovement")
      .select("id, type, quantity, createdAt")
      .eq("companyId", companyId)
      .order("createdAt", { ascending: false });

    if (startDateParam) {
      const startISO = new Date(`${startDateParam}T00:00:00.000Z`).toISOString();
      ordersQuery = ordersQuery.gte("createdAt", startISO);
      movementsQuery = movementsQuery.gte("createdAt", startISO);
    }

    if (endDateParam) {
      const endISO = new Date(`${endDateParam}T23:59:59.999Z`).toISOString();
      ordersQuery = ordersQuery.lte("createdAt", endISO);
      movementsQuery = movementsQuery.lte("createdAt", endISO);
    }

    // Parallel fetch all data we need
    const [ordersRes, variantsRes, movementsRes] = await Promise.all([
      ordersQuery,
      supabase
        .from("ProductVariant")
        .select("id, sku, title, size, color, currentStockLevel, safetyStockLimit, thumbnailConfig")
        .eq("companyId", companyId),
      movementsQuery,
    ]);



    const orders = ordersRes.data || [];
    const variants = variantsRes.data || [];
    const movements = movementsRes.data || [];

    // ── KPI Stats ──
    const totalOrders = orders.length;
    const processingOrders = orders.filter((o: any) => o.deliveryStatus === "PROCESSING").length;
    const shippedOrders = orders.filter((o: any) => o.deliveryStatus === "SHIPPED").length;
    const deliveredOrders = orders.filter((o: any) => o.deliveryStatus === "DELIVERED").length;
    const rtoInitiated = orders.filter((o: any) => o.deliveryStatus === "RTO_INITIATED").length;
    const rtoReceived = orders.filter((o: any) => o.deliveryStatus === "RTO_RECEIVED").length;
    const totalRto = rtoInitiated + rtoReceived;
    const rtoPercentage = totalOrders > 0 ? ((totalRto / totalOrders) * 100).toFixed(2) : "0.00";

    const totalVariants = variants.length;
    const totalStockUnits = variants.reduce((sum: number, v: any) => sum + (v.currentStockLevel || 0), 0);
    const lowStockVariants = variants.filter((v: any) => v.currentStockLevel <= v.safetyStockLimit && v.currentStockLevel > 0);
    const outOfStockVariants = variants.filter((v: any) => v.currentStockLevel === 0);
    const healthyStockVariants = variants.filter((v: any) => v.currentStockLevel > v.safetyStockLimit);

    // ── Sales Overview (Dynamically bucketed by date range parameters) ──
    const startRange = startDateParam 
      ? new Date(`${startDateParam}T00:00:00.000Z`) 
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const endRange = endDateParam 
      ? new Date(`${endDateParam}T23:59:59.999Z`) 
      : new Date();
    
    // Calculate total days in selected filter range
    const diffTime = Math.abs(endRange.getTime() - startRange.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const salesData = [];
    const step = totalDays > 30 ? Math.ceil(totalDays / 7) : 1; // Group by week if range > 30 days

    for (let d = new Date(startRange); d <= endRange; d.setDate(d.getDate() + step)) {
      const currentDay = new Date(d);
      const nextStep = new Date(currentDay);
      nextStep.setDate(nextStep.getDate() + step);

      const bucketOrders = orders.filter((o: any) => {
        const created = new Date(o.createdAt);
        return created >= currentDay && created < nextStep;
      });

      const label = currentDay.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

      const totalBucketRevenue = bucketOrders.reduce((sum: number, o: any) => {
        const val = Number(o.customerShippingFee) || Number(o.shippingCost) || 1499;
        return sum + val;
      }, 0);

      salesData.push({
        name: label,
        revenue: totalBucketRevenue,
        orders: bucketOrders.length,
      });
    }

    // ── Inventory Distribution ──
    const inventoryData = [
      { name: "In Stock", value: healthyStockVariants.length, fill: "#10b981" },
      { name: "Low Stock", value: lowStockVariants.length, fill: "#f59e0b" },
      { name: "Out of Stock", value: outOfStockVariants.length, fill: "#ef4444" },
    ];

    // ── RTO Distribution ──
    const rtoData = [
      { name: "RTO Initiated", value: rtoInitiated, fill: "#f43f5e" },
      { name: "RTO Received", value: rtoReceived, fill: "#fda4af" },
    ];

    // ── Top Products (grouped by product title) ──
    const productGroups: { [title: string]: { title: string; baseSku: string; variantCount: number; totalStock: number } } = {};
    variants.forEach((v: any) => {
      if (!productGroups[v.title]) {
        const parts = v.sku.split("-");
        const baseSku = parts.slice(0, Math.max(1, parts.length - 2)).join("-");
        productGroups[v.title] = { title: v.title, baseSku, variantCount: 0, totalStock: 0 };
      }
      productGroups[v.title].variantCount += 1;
      productGroups[v.title].totalStock += (v.currentStockLevel || 0);
    });
    const topProducts = Object.values(productGroups)
      .sort((a, b) => b.totalStock - a.totalStock)
      .slice(0, 5)
      .map((p, i) => ({
        id: i + 1,
        name: p.title,
        sku: p.baseSku,
        variants: p.variantCount,
        totalStock: p.totalStock,
      }));

    // ── Recent Orders (last 5) ──
    const now = new Date();
    const recentOrders = orders.slice(0, 5).map((o: any) => {
      const created = new Date(o.createdAt);
      const diffMs = now.getTime() - created.getTime();

      const diffMins = Math.floor(diffMs / 60000);
      let timeAgo = "";
      if (diffMins < 1) timeAgo = "Just now";
      else if (diffMins < 60) timeAgo = `${diffMins} mins ago`;
      else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
      else timeAgo = `${Math.floor(diffMins / 1440)} days ago`;

      const statusMap: { [key: string]: { label: string; color: string } } = {
        PROCESSING: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
        SHIPPED: { label: "Shipped", color: "bg-emerald-100 text-emerald-700" },
        DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
        RTO_INITIATED: { label: "RTO Initiated", color: "bg-rose-100 text-rose-700" },
        RTO_RECEIVED: { label: "RTO Received", color: "bg-rose-100 text-rose-700" },
      };
      const st = statusMap[o.deliveryStatus] || { label: o.deliveryStatus, color: "bg-gray-100 text-gray-700" };
      const rawAmt = Number(o.customerShippingFee) || Number(o.shippingCost) || 1499;

      return {
        id: o.orderNumber,
        customer: o.customerName,
        time: timeAgo,
        status: st.label,
        statusColor: st.color,
        amount: rawAmt.toLocaleString("en-IN"),
      };
    });

    // ── Low Stock Alerts ──
    const lowStockAlerts = lowStockVariants.slice(0, 5).map((v: any) => {
      let imgUrl = "";
      if (v.thumbnailConfig) {
        if (typeof v.thumbnailConfig === "string") {
          try {
            const cfg = JSON.parse(v.thumbnailConfig);
            imgUrl = cfg.imageUrl || cfg.url || (Array.isArray(cfg.images) ? cfg.images[0] : "");
          } catch (_) {
            if (v.thumbnailConfig.startsWith("http") || v.thumbnailConfig.startsWith("data:")) {
              imgUrl = v.thumbnailConfig;
            }
          }
        } else if (typeof v.thumbnailConfig === "object") {
          imgUrl = v.thumbnailConfig.imageUrl || v.thumbnailConfig.url || (Array.isArray(v.thumbnailConfig.images) ? v.thumbnailConfig.images[0] : "");
        }
      }
      return {
        name: `${v.title} - ${v.color} / ${v.size}`,
        sku: v.sku,
        qty: v.currentStockLevel,
        imageUrl: imgUrl,
      };
    });

    // ── Real Regional State / City Sales Heatmap (Aggregated from OrderFulfillment table) ──
    const stateMap: { [state: string]: { state: string; city: string; count: number; rawRevenue: number } } = {};
    
    orders.forEach((o: any) => {
      const stateName = (o.shippingState || "Other Regions").trim();
      const cityName = (o.shippingCity || "Metropolitan Area").trim();
      const itemAmount = Number(o.customerShippingFee) || Number(o.shippingCost) || 1499;

      if (!stateMap[stateName]) {
        stateMap[stateName] = {
          state: stateName,
          city: cityName,
          count: 0,
          rawRevenue: 0
        };
      }
      stateMap[stateName].count += 1;
      stateMap[stateName].rawRevenue += itemAmount;
    });


    const palette = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
    
    const sortedStates = Object.values(stateMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const regionSales = sortedStates.map((st, idx) => {
      const pct = totalOrders > 0 ? Math.round((st.count / totalOrders) * 100) : 0;
      return {
        state: st.state,
        city: st.city,
        orders: st.count,
        percentage: pct,
        revenue: `₹${st.rawRevenue.toLocaleString("en-IN")}`,
        color: palette[idx % palette.length]
      };
    });



    return NextResponse.json({
      kpis: {
        totalOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        totalRto,
        rtoPercentage,
        totalVariants,
        totalStockUnits,
        lowStockCount: lowStockVariants.length,
        outOfStockCount: outOfStockVariants.length,
      },
      salesData,
      inventoryData,
      rtoData,
      topProducts,
      recentOrders,
      lowStockAlerts,
      regionSales,
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
