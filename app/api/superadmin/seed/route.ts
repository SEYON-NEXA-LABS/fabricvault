import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

export async function POST() {
  try {
    console.log("Programmatic seed: Starting database cleanup...");

    // 1. Find existing companies by code (both "syn" and "seyon")
    const { data: oldCompanies } = await supabase
      .from("Company")
      .select("id")
      .in("code", ["syn", "seyon"]);

    if (oldCompanies && oldCompanies.length > 0) {
      for (const oldCompany of oldCompanies) {
        const companyId = oldCompany.id;

        // Select Warehouses & Variants first for deep cleanup
        const { data: whs } = await supabase.from("Warehouse").select("id").eq("companyId", companyId);
        const whIds = (whs || []).map((w: any) => w.id);

        const { data: vars } = await supabase.from("ProductVariant").select("id").eq("companyId", companyId);
        const varIds = (vars || []).map((v: any) => v.id);

        // Delete child dependencies to avoid Foreign Key Violations
        await supabase.from("Subscription").delete().eq("companyId", companyId);
        await supabase.from("SerializedUnit").delete().eq("companyId", companyId);
        
        if (whIds.length > 0) {
          await supabase.from("WarehouseStock").delete().in("warehouseId", whIds);
          await supabase.from("OrderFulfillment").delete().in("warehouseId", whIds);
          await supabase.from("ShippingManifest").delete().in("warehouseId", whIds);
          await supabase.from("PurchaseOrder").delete().in("warehouseId", whIds);
        }
        
        if (varIds.length > 0) {
          await supabase.from("StockMovement").delete().in("variantId", varIds);
        }

        await supabase.from("User").delete().eq("companyId", companyId);
        await supabase.from("CourierConfig").delete().eq("companyId", companyId);
        await supabase.from("Vendor").delete().eq("companyId", companyId);
        await supabase.from("ProductVariant").delete().eq("companyId", companyId);
        await supabase.from("Warehouse").delete().eq("companyId", companyId);
        await supabase.from("Company").delete().eq("id", companyId);
      }
      console.log("Programmatic seed: Cleaned up old company records.");
    }

    // Delete any users with overlapping seed emails to prevent global User_email_key violations
    await supabase
      .from("User")
      .delete()
      .in("email", ["admin@seyon.local", "operator@seyon.local", "seyonnexalabs@gmail.com", "wolfadmin@seyon.local", "alpha@seyon.local", "beta@seyon.local"]);

    // 2. Insert Company
    const { data: company, error: compErr } = await supabase
      .from("Company")
      .insert({
        name: "Seyon Merchant",
        code: "syn",
        shopifyStoreUrl: "https://seyon-clothing.myshopify.com",
        shopifyAccessToken: "shpat_mockaccesstoken12345",
        whatsappNumber: "+919876543210",
        whatsappApiKey: "wa_mock_key_abc123",
        onboardingCompleted: true,
        timezone: "IST",
        currency: "INR",
        contactEmail: "ops@seyon.com"
      })
      .select("id")
      .single();

    if (compErr || !company) throw compErr || new Error("Failed to insert Company");
    const companyId = company.id;

    // 3. Insert Warehouses
    const { data: whsCreated, error: whErr } = await supabase
      .from("Warehouse")
      .insert([
        {
          companyId,
          name: "Mumbai Central Hub",
          code: "MUM-01",
          addressLine1: "Lower Parel Industrial Area",
          city: "Mumbai",
          state: "Maharashtra",
          zip: "400013",
          country: "India",
          isDefaultPickup: true
        },
        {
          companyId,
          name: "Bengaluru Distribution Center",
          code: "BLR-02",
          addressLine1: "Whitefield Tech Park Road",
          city: "Bengaluru",
          state: "Karnataka",
          zip: "560066",
          country: "India",
          isDefaultPickup: false
        }
      ])
      .select("id, code");

    if (whErr || !whsCreated) throw whErr || new Error("Failed to insert Warehouses");

    const whMumbai = whsCreated.find((w: any) => w.code === "MUM-01")!;
    const whBangalore = whsCreated.find((w: any) => w.code === "BLR-02")!;

    // 4. Insert Users
    const { error: userErr } = await supabase
      .from("User")
      .insert([
        {
          companyId,
          username: "admin",
          email: "admin@seyon.local",
          password: "admin123",
          role: "TENANTADMIN"
        },
        {
          companyId,
          username: "operator",
          email: "operator@seyon.local",
          password: "operator123",
          role: "STAFF"
        },
        {
          companyId,
          username: "superadmin",
          email: "seyonnexalabs@gmail.com",
          password: "super123",
          role: "SUPERADMIN"
        }
      ]);

    if (userErr) throw userErr;

    // 4b. Insert Vendors
    const { data: vendorsCreated, error: vendorErr } = await supabase
      .from("Vendor")
      .insert([
        {
          companyId,
          name: "Zeta Fabrics Pvt Ltd",
          email: "orders@zetafabrics.com",
          phone: "+919876543210",
          address: "Plot 12, MIDC Textile Zone, Bhiwandi, Maharashtra 421302",
          gstin: "27AABCZ1234R1ZM",
          notes: "Primary fabric supplier — cotton & blended",
          isActive: true
        },
        {
          companyId,
          name: "Nova Textiles",
          email: "supply@novatex.in",
          phone: "+918765432100",
          address: "56, Erode Textile Market, Tamil Nadu 638001",
          gstin: "33AADCN5678Q1Z5",
          notes: "South India region — knits & denims",
          isActive: true
        },
        {
          companyId,
          name: "Metro Supplies Co",
          email: "bulk@metrosupplies.co",
          phone: "+917654321098",
          address: "Industrial Area Phase 2, Ludhiana, Punjab 141003",
          gstin: "03AAFCM9012E1ZX",
          notes: "Packaging, labels, and accessories",
          isActive: true
        },
        {
          companyId,
          name: "Dharma Threads",
          email: null,
          phone: "+919123456780",
          address: "Peenya Industrial Estate, Bengaluru, Karnataka 560058",
          gstin: null,
          notes: "Seasonal supplier — silk & wool blends",
          isActive: false
        }
      ])
      .select("id, name");

    if (vendorErr) throw vendorErr;

    // 5. Insert Product Variants
    const variantsToSeed = [
      { sku: "TWCT001-BLK-M", title: "SEYON Oversized T-Shirt", size: "M", color: "Black", barcodeString: "TWCT001BLKM", price: 1299, compareAtPrice: 1999, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWCT001-BLK-L", title: "SEYON Oversized T-Shirt", size: "L", color: "Black", barcodeString: "TWCT001BLKL", price: 1299, compareAtPrice: 1999, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWCT001-WHT-S", title: "SEYON Oversized T-Shirt", size: "S", color: "White", barcodeString: "TWCT001WHTS", price: 1299, compareAtPrice: 1999, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWCP001-OLV-32", title: "SEYON Cargo Pants", size: "32", color: "Olive", barcodeString: "TWCP001OLV32", price: 1999, compareAtPrice: 2499, category: "Bottom", targetGroup: "Adults", ageRange: null },
      { sku: "TWCP001-OLV-34", title: "SEYON Cargo Pants", size: "34", color: "Olive", barcodeString: "TWCP001OLV34", price: 1999, compareAtPrice: 2499, category: "Bottom", targetGroup: "Adults", ageRange: null },
      { sku: "TWH001-GRY-L", title: "SEYON Hoodie", size: "L", color: "Grey", barcodeString: "TWH001GRYL", price: 2499, compareAtPrice: 3299, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWH001-GRY-XL", title: "SEYON Hoodie", size: "XL", color: "Grey", barcodeString: "TWH001GRYXL", price: 2499, compareAtPrice: 3299, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWSS001-NVY-XL", title: "SEYON Sweatshirt", size: "XL", color: "Navy", barcodeString: "TWSS001NVYXL", price: 1799, compareAtPrice: 2299, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWSS001-NVY-L", title: "SEYON Sweatshirt", size: "L", color: "Navy", barcodeString: "TWSS001NVYL", price: 1799, compareAtPrice: 2299, category: "Top", targetGroup: "Adults", ageRange: null },
      { sku: "TWJG001-BLK-M", title: "SEYON Joggers", size: "M", color: "Black", barcodeString: "TWJG001BLKM", price: 1599, compareAtPrice: 1999, category: "Bottom", targetGroup: "Kids", ageRange: "4-6 Years" },
      { sku: "TWJG001-BLK-L", title: "SEYON Joggers", size: "L", color: "Black", barcodeString: "TWJG001BLKL", price: 1599, compareAtPrice: 1999, category: "Bottom", targetGroup: "Kids", ageRange: "6-8 Years" }
    ];

    const variantsPayload = variantsToSeed.map((v, idx) => {
      const configColor = v.color.toLowerCase() === "olive" ? "green" : v.color.toLowerCase();
      const mockConfig = JSON.stringify({
        color: configColor,
        shapes: [
          { size: 35, top: 10, left: 15, opacity: 0.2 },
          { size: 55, top: 40, left: 35, opacity: 0.25 },
          { size: 40, top: 15, left: 55, opacity: 0.15 }
        ]
      });

      return {
        companyId,
        shopifyVariantId: `gid://shopify/ProductVariant/441234567${idx + 89}`,
        sku: v.sku,
        title: v.title,
        size: v.size,
        color: v.color,
        barcodeString: v.barcodeString,
        safetyStockLimit: 5,
        currentStockLevel: 0,
        thumbnailConfig: mockConfig,
        price: v.price,
        compareAtPrice: v.compareAtPrice || Math.round(v.price * 1.25),
        category: v.category,
        targetGroup: v.targetGroup,
        ageRange: v.ageRange
      };
    });

    const { data: variantsCreated, error: varErr } = await supabase
      .from("ProductVariant")
      .insert(variantsPayload)
      .select("id, sku");

    if (varErr || !variantsCreated) throw varErr || new Error("Failed to insert Product Variants");

    // 6. Insert Warehouse Stocks mapping
    const stockLevels = [
      { whId: whMumbai.id, sku: "TWCT001-BLK-M", level: 65 },
      { whId: whMumbai.id, sku: "TWCT001-BLK-L", level: 42 },
      { whId: whMumbai.id, sku: "TWCT001-WHT-S", level: 15 },
      { whId: whMumbai.id, sku: "TWCP001-OLV-32", level: 28 },
      { whId: whMumbai.id, sku: "TWCP001-OLV-34", level: 22 },
      { whId: whMumbai.id, sku: "TWH001-GRY-L", level: 7 },
      { whId: whMumbai.id, sku: "TWH001-GRY-XL", level: 18 },
      { whId: whMumbai.id, sku: "TWSS001-NVY-XL", level: 5 },
      { whId: whMumbai.id, sku: "TWSS001-NVY-L", level: 31 },
      { whId: whMumbai.id, sku: "TWJG001-BLK-M", level: 44 },
      { whId: whMumbai.id, sku: "TWJG001-BLK-L", level: 29 },

      { whId: whBangalore.id, sku: "TWCT001-BLK-M", level: 35 },
      { whId: whBangalore.id, sku: "TWCT001-BLK-L", level: 38 },
      { whId: whBangalore.id, sku: "TWCT001-WHT-S", level: 35 },
      { whId: whBangalore.id, sku: "TWCP001-OLV-32", level: 12 },
      { whId: whBangalore.id, sku: "TWCP001-OLV-34", level: 19 },
      { whId: whBangalore.id, sku: "TWH001-GRY-L", level: 25 },
      { whId: whBangalore.id, sku: "TWH001-GRY-XL", level: 14 },
      { whId: whBangalore.id, sku: "TWSS001-NVY-XL", level: 20 },
      { whId: whBangalore.id, sku: "TWSS001-NVY-L", level: 11 },
      { whId: whBangalore.id, sku: "TWJG001-BLK-M", level: 16 },
      { whId: whBangalore.id, sku: "TWJG001-BLK-L", level: 21 }
    ];

    const stockPayload = stockLevels.map((st) => {
      const variant = variantsCreated.find((v: any) => v.sku === st.sku)!;
      return {
        warehouseId: st.whId,
        variantId: variant.id,
        currentStockLevel: st.level
      };
    });

    const { error: stockErr } = await supabase.from("WarehouseStock").insert(stockPayload);
    if (stockErr) throw stockErr;

    // 7. Insert Serialized Units (5 units per variant, per warehouse)
    const unitsPayload: any[] = [];
    stockLevels.forEach((st) => {
      const variant = variantsCreated.find((v: any) => v.sku === st.sku)!;
      const whCode = st.whId === whMumbai.id ? "MUM-01" : "BLR-02";
      for (let i = 1; i <= 5; i++) {
        unitsPayload.push({
          companyId,
          variantId: variant.id,
          warehouseId: st.whId,
          qrCodeString: `syn:${whCode}:${variant.sku}:${i.toString().padStart(4, "0")}`,
          status: "AVAILABLE"
        });
      }
    });

    const { error: unitErr } = await supabase.from("SerializedUnit").insert(unitsPayload);
    if (unitErr) throw unitErr;

    // Sync global variant stock totals
    for (const variant of variantsCreated) {
      const levels = stockLevels.filter((s) => s.sku === variant.sku);
      const total = levels.reduce((sum: number, s: any) => sum + s.level, 0);

      await supabase
        .from("ProductVariant")
        .update({ currentStockLevel: total })
        .eq("id", variant.id);
    }

    // 8. Seed Order Fulfillments
    const fulfillments = [
      { shopifyOrderId: "gid://shopify/Order/55123456789", orderNumber: "#ORD-10254", customerName: "Rahul Sharma", customerPhone: "+919988776655", shippingAddressLine1: "123, Marine Drive", shippingCity: "Mumbai", shippingState: "Maharashtra", shippingZip: "400002", shippingCountry: "India", awbNumber: "AWB998811223", courierPartner: "Delhivery", deliveryStatus: "PROCESSING", warehouseId: whMumbai.id },
      { shopifyOrderId: "gid://shopify/Order/55123456790", orderNumber: "#ORD-10253", customerName: "Aman Gupta", customerPhone: "+918877665544", shippingAddressLine1: "456, Indiranagar", shippingCity: "Bengaluru", shippingState: "Karnataka", shippingZip: "560038", shippingCountry: "India", awbNumber: "AWB887722119", courierPartner: "Bluedart", deliveryStatus: "SHIPPED", warehouseId: whBangalore.id },
      { shopifyOrderId: "gid://shopify/Order/55123456791", orderNumber: "#ORD-10252", customerName: "Neha Verma", customerPhone: "+919911223344", shippingAddressLine1: "789, Connaught Place", shippingCity: "New Delhi", shippingState: "Delhi", shippingZip: "110001", shippingCountry: "India", awbNumber: "AWB776633001", courierPartner: "Delhivery", deliveryStatus: "DELIVERED", warehouseId: whMumbai.id },
      { shopifyOrderId: "gid://shopify/Order/55123456792", orderNumber: "#ORD-10251", customerName: "Rohit Singh", customerPhone: "+919812345678", shippingAddressLine1: "321, MG Road", shippingCity: "Pune", shippingState: "Maharashtra", shippingZip: "411001", shippingCountry: "India", awbNumber: "AWB554433778", courierPartner: "Bluedart", deliveryStatus: "RTO_INITIATED", warehouseId: whMumbai.id },
      { shopifyOrderId: "gid://shopify/Order/55123456793", orderNumber: "#ORD-10250", customerName: "Priya Patel", customerPhone: "+919955443322", shippingAddressLine1: "55, SG Highway", shippingCity: "Ahmedabad", shippingState: "Gujarat", shippingZip: "380015", shippingCountry: "India", awbNumber: null, courierPartner: null, deliveryStatus: "PROCESSING", warehouseId: whBangalore.id },
      { shopifyOrderId: "gid://shopify/Order/55123456794", orderNumber: "#ORD-10249", customerName: "Vikram Mehta", customerPhone: "+919876001234", shippingAddressLine1: "99, Anna Nagar", shippingCity: "Chennai", shippingState: "Tamil Nadu", shippingZip: "600040", shippingCountry: "India", awbNumber: "AWB112233998", courierPartner: "DTDC", deliveryStatus: "DELIVERED", warehouseId: whBangalore.id }
    ];

    const { error: fulfillErr } = await supabase
      .from("OrderFulfillment")
      .insert(fulfillments.map(f => ({ ...f, companyId })));
    if (fulfillErr) throw fulfillErr;

    // 9. Seed Stock Movements
    const movements = [
      { sku: "TWCT001-BLK-M", whId: whMumbai.id, type: "INWARD", quantity: 50, operator: "operator@seyon.local" },
      { sku: "TWCT001-BLK-L", whId: whMumbai.id, type: "INWARD", quantity: 30, operator: "operator@seyon.local" },
      { sku: "TWCT001-BLK-M", whId: whMumbai.id, type: "OUTWARD", quantity: 5, operator: "operator@seyon.local" },
      { sku: "TWCT001-WHT-S", whId: whBangalore.id, type: "INWARD", quantity: 40, operator: "admin@seyon.local" },
      { sku: "TWCP001-OLV-32", whId: whBangalore.id, type: "OUTWARD", quantity: 3, operator: "admin@seyon.local" }
    ];

    const movementsPayload = movements.map((m) => {
      const variant = variantsCreated.find((v: any) => v.sku === m.sku)!;
      return {
        companyId,
        variantId: variant.id,
        warehouseId: m.whId,
        type: m.type,
        quantity: m.quantity,
        operatorEmail: m.operator,
        syncStatus: "SUCCESS"
      };
    });

    const { error: moveErr } = await supabase.from("StockMovement").insert(movementsPayload);
    if (moveErr) throw moveErr;

    // 10. Seed Courier Config
    const { error: courierErr } = await supabase
      .from("CourierConfig")
      .insert([
        { companyId, courierPartner: "SHIPROCKET", apiEmail: "ops@seyon.com", apiPassword: "shiprocketpassword123", isActive: true },
        { companyId, courierPartner: "DELHIVERY", apiKey: "delhivery_api_key_mock_123", isActive: true }
      ]);
    if (courierErr) throw courierErr;

    // 11. Seed Shipping Manifest
    const { error: manifestErr } = await supabase
      .from("ShippingManifest")
      .insert({
        companyId,
        manifestNumber: "MNF-2026-001",
        courierPartner: "SHIPROCKET",
        warehouseId: whMumbai.id,
        status: "CREATED",
        driverName: "Karan Singh",
        driverPhone: "+919988770011"
      });
    if (manifestErr) throw manifestErr;

    // 11b. Seed Marketplace Configurations
    const { error: mpErr } = await supabase
      .from("MarketplaceConfig")
      .insert([
        { companyId, channel: "SHOPIFY", storeName: "Seyon Shopify Flagship", shopUrl: "https://seyon-clothing.myshopify.com", accessToken: "shpat_mockaccesstoken12345", syncStatus: "SUCCESS", autoSyncInventory: true, autoIngestOrders: true },
        { companyId, channel: "AMAZON", storeName: "Seyon Amazon Store", sellerId: "A3IN89012345", syncStatus: "SUCCESS", autoSyncInventory: true, autoIngestOrders: true },
        { companyId, channel: "FLIPKART", storeName: "Seyon Flipkart Hub", sellerId: "FK_SEYON_OFFICIAL", syncStatus: "SUCCESS", autoSyncInventory: true, autoIngestOrders: true }
      ]);
    if (mpErr) console.warn("Marketplace seed notice:", mpErr.message);

    // 12. Seed Subscription details
    const { error: subErr } = await supabase
      .from("Subscription")
      .insert({

        companyId,
        planType: "MONTHLY",
        amount: 4999.0,
        currency: "INR",
        status: "ACTIVE",
        nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    // 12b. Seed User Accounts (wolfadmin, alpha, beta & admin)
    const { error: userSeedErr } = await supabase
      .from("User")
      .insert([
        { companyId, username: "wolfadmin", email: "wolfadmin@seyon.local", password: "password123", role: "TENANTADMIN", isActive: true },
        { companyId, username: "alpha", email: "alpha@seyon.local", password: "password123", role: "STAFF", isActive: true },
        { companyId, username: "beta", email: "beta@seyon.local", password: "password123", role: "STAFF", isActive: true },
        { companyId, username: "seyonadmin", email: "admin@seyon.local", password: "password123", role: "SUPERADMIN", isActive: true }
      ]);
    if (userSeedErr) console.warn("User seed notice:", (userSeedErr as any).message || userSeedErr);

    console.log("Programmatic seed: Database seeding completed successfully.");

    return NextResponse.json({
      success: true,
      message: "Supabase database seeded programmatically over HTTPS!"
    });
  } catch (error: any) {
    console.error("Programmatic seed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed database.",
        error: error.message || error
      },
      { status: 500 }
    );
  }
}
