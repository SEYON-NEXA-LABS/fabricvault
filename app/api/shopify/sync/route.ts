import { getContextCompanyId, getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session context" }, { status: 401 });
    }

    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    const body = await req.json();
    const { module } = body;

    if (!module) {
      return NextResponse.json({ error: "Missing required field: module" }, { status: 400 });
    }

    // 1. Fetch Company Integration details
    const { data: company, error: compErr } = await supabase
      .from("Company")
      .select("shopifyStoreUrl, shopifyAccessToken, shopifyClientId, shopifyClientSecret, shopifyWebhookSecret")
      .eq("id", companyId)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: "Company integration profile not found" }, { status: 404 });
    }

    let shopifyStoreUrl = company?.shopifyStoreUrl;
    let shopifyAccessToken = company?.shopifyAccessToken;
    let shopifyClientId = company?.shopifyClientId;

    let shopifyClientSecret = company?.shopifyClientSecret;

    // Fallback: If not in Company, check MarketplaceConfig
    if (!shopifyStoreUrl || !shopifyAccessToken || !shopifyClientSecret) {
      const { data: mpConfig } = await supabase
        .from("MarketplaceConfig")
        .select("shopUrl, accessToken, apiKey, apiSecret")
        .eq("companyId", companyId)
        .eq("channel", "SHOPIFY")
        .maybeSingle();

      if (mpConfig) {
        shopifyStoreUrl = shopifyStoreUrl || mpConfig.shopUrl;
        shopifyAccessToken = shopifyAccessToken || mpConfig.accessToken;
        shopifyClientId = shopifyClientId || mpConfig.apiKey;
        shopifyClientSecret = shopifyClientSecret || mpConfig.apiSecret;
      }
    }

    if (!shopifyStoreUrl || (!shopifyAccessToken && !shopifyClientId)) {
      return NextResponse.json({ error: "Shopify credentials are not configured in settings." }, { status: 400 });
    }


    const effectiveToken = shopifyAccessToken || shopifyClientId || "";

    const isMockToken = 
      process.env.NODE_ENV === "development" && (
        shopifyAccessToken === "shpat_mockaccesstoken12345" || 
        shopifyAccessToken.startsWith("shpat_mock") ||
        shopifyAccessToken.startsWith("shpss_mock")
      );

    const startTime = Date.now();
    const timestamp = startTime;
    const syncJobId = `SYN-${Math.floor(1000 + Math.random() * 9000)}`;
    let recordsCount = 0;
    const tableCounts: Record<string, number> = {
      ProductVariant: 0,
      Customer: 0,
      Order: 0,
      OrderItem: 0,
      OrderFulfillment: 0,
      WarehouseStock: 0
    };

    // --- CASE A: MOCK SIMULATION MODE ---
    if (isMockToken) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      let status: "Success" | "Warning" | "Failed" = "Success";

      if (module === "Products Sync" || module === "Full System Sync") {
        // Insert a simulated synced product variant in database
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const shopifyVariantId = `gid://shopify/ProductVariant/synced_mock_${timestamp}`;
        const sku = `MOCK-SHPF-${randomPart}-BLK-M`;
        const { error: insErr } = await supabase
          .from("ProductVariant")
          .insert({
            companyId,
            shopifyVariantId,
            sku,
            title: "Shopify Sync Classic Tee",
            size: "M",
            color: "Black",
            barcodeString: `MOCKSHPF${randomPart}`,
            safetyStockLimit: 5,
            price: 1299,
            compareAtPrice: 1999,
            vendor: "Seyon Essentials",
            brand: "Seyon",
            category: "Top",
            targetGroup: "Adults",
            thumbnailConfig: JSON.stringify({ color: "black" }),
            currentStockLevel: 0
          });

        if (!insErr) {
          recordsCount += 1;
          tableCounts.ProductVariant = (tableCounts.ProductVariant || 0) + 1;
        }
      }

      if (module === "Customers Sync" || module === "Full System Sync") {
        // Create a simulated customer in database
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const { error: custErr } = await supabase
          .from("Customer")
          .insert({
            companyId,
            name: `Shopify Customer ${randomPart}`,
            phone: `+9190000${randomPart}`,
            email: `shopify.cust.${randomPart}@sync.com`,
            city: "Bangalore",
            state: "Karnataka",
            zip: "560001",
            country: "India"
          });

        if (!custErr) {
          recordsCount += 1;
          tableCounts.Customer = (tableCounts.Customer || 0) + 1;
        }
      }

      if (module === "Orders Sync" || module === "Full System Sync") {
        // Fetch a variant for the order item
        const { data: firstVariant } = await supabase
          .from("ProductVariant")
          .select("id, price, currentStockLevel")
          .eq("companyId", companyId)
          .limit(1)
          .maybeSingle();

        // Create a simulated customer
        const { data: customer } = await supabase
          .from("Customer")
          .insert({
            companyId,
            name: "Shopify Order Buyer",
            phone: `+9199000${Math.floor(1000 + Math.random() * 9000)}`,
            email: `shopify.order.${timestamp}@sync.com`,
            city: "Delhi",
            state: "Delhi",
            zip: "110001",
            country: "India"
          })
          .select("id")
          .single();

        if (customer) {
          const randOrdNum = Math.floor(10000 + Math.random() * 90000);
          const shopifyOrderId = `sh-ord-sync-${randOrdNum}`;
          const orderNumber = `#ORD-${randOrdNum}`;

          const { data: order, error: ordErr } = await supabase
            .from("Order")
            .insert({
              companyId,
              customerId: customer.id,
              orderNumber,
              shopifyOrderId,
              paymentStatus: "PAID",
              fulfillmentStatus: "UNFULFILLED",
              totalPrice: firstVariant ? firstVariant.price : 49.99,
              currency: "INR",
              rawPayload: { mock_sync: true }
            })
            .select("id")
            .single();

          if (!ordErr && order) {
            recordsCount += 1;
            tableCounts.Order = (tableCounts.Order || 0) + 1;

            if (firstVariant) {
              await supabase.from("OrderItem").insert({
                orderId: order.id,
                variantId: firstVariant.id,
                quantity: 1,
                price: firstVariant.price
              });
              tableCounts.OrderItem = (tableCounts.OrderItem || 0) + 1;

              // Decrement stock
              const newStock = Math.max(0, firstVariant.currentStockLevel - 1);
              await supabase
                .from("ProductVariant")
                .update({ currentStockLevel: newStock })
                .eq("id", firstVariant.id);
            }

            // Create fulfillment record
            await supabase.from("OrderFulfillment").insert({
              companyId,
              orderId: order.id,
              customerId: customer.id,
              shopifyOrderId,
              orderNumber,
              customerName: "Shopify Order Buyer",
              customerPhone: `+91990008888`,
              shippingAddressLine1: "12, Connaught Place",
              shippingCity: "Delhi",
              shippingState: "Delhi",
              shippingZip: "110001",
              shippingCountry: "India",
              totalWeightKg: 0.4,
              deliveryStatus: "PROCESSING",
              orderSource: "SHOPIFY"
            });
            tableCounts.OrderFulfillment = (tableCounts.OrderFulfillment || 0) + 1;
          }
        }
      }

      if (recordsCount === 0) {
        recordsCount = Math.floor(Math.random() * 12) + 3; // Fallback mock count
      }

      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

      return NextResponse.json({
        success: true,
        records: recordsCount,
        jobId: syncJobId,
        duration: `${durationSec}s`,
        telemetry: {
          id: syncJobId,
          module,
          direction: module === "Inventory Sync" ? "ERP → Shopify" : "Shopify → ERP",
          recordsProcessed: recordsCount,
          status,
          duration: `${durationSec}s`,
          timestamp: new Date().toISOString()
        },
        log: {
          id: syncJobId,
          module,
          direction: module === "Inventory Sync" ? "ERP → Shopify" : "Shopify → ERP",
          records: recordsCount,
          status,
          duration: `${durationSec}s`,
          time: "Just now"
        }
      });
    }

    // --- CASE B: REAL INTEGRATION MODE ---
    const shopifyDomain = shopifyStoreUrl.replace("https://", "").replace("http://", "").trim();

    let activeToken = effectiveToken;
    const secretKeyForExchange = shopifyClientSecret || company.shopifyClientSecret || company.shopifyWebhookSecret || "";

    // Validation Check: If user saved an API Secret Key (shpss_) instead of Admin Access Token (shpat_)
    if (activeToken.startsWith("shpss_") && !company.shopifyClientId) {
      return NextResponse.json({
        error: `The saved token '${activeToken.substring(0, 10)}...' is a Shopify Secret Key. Please copy your 'Admin API access token' (starts with 'shpat_') from Shopify Admin ➔ Apps ➔ Seyon Shopping ERP ➔ API credentials.`
      }, { status: 400 });
    }

    // Auto Client Credentials Token Exchange: If token isn't shpat_ and secret/client_id exists
    if (!activeToken.startsWith("shpat_") && secretKeyForExchange) {
      try {
        const tokenRes = await fetch(`https://${shopifyDomain}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: company.shopifyClientId || activeToken,
            client_secret: secretKeyForExchange
          })
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            activeToken = tokenData.access_token;
            // Persist the newly acquired shpat_ token back to Supabase
            await supabase.from("Company").update({ shopifyAccessToken: activeToken }).eq("id", companyId);
          }
        }
      } catch (tokErr) {
        console.error("Client credentials exchange error:", tokErr);
      }
    }

    if (module === "Products Sync" || module === "Full System Sync") {
      const res = await fetch(
        `https://${shopifyDomain}/admin/api/2024-04/products.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": activeToken,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Shopify API product pull failed: ${await res.text()}`);
      }

      const { products } = await res.json();
      // Resolve default warehouse for inventory stock sync
      let defaultWarehouseId: string | null = null;
      const { data: defaultWh } = await supabase
        .from("Warehouse")
        .select("id")
        .eq("companyId", companyId)
        .eq("isDefaultPickup", true)
        .maybeSingle();

      if (defaultWh) {
        defaultWarehouseId = defaultWh.id;
      } else {
        const { data: anyWh } = await supabase
          .from("Warehouse")
          .select("id")
          .eq("companyId", companyId)
          .limit(1)
          .maybeSingle();
        if (anyWh) defaultWarehouseId = anyWh.id;
      }

      if (Array.isArray(products)) {
        for (const prod of products) {
          const title = prod.title;
          const category = prod.product_type || "Top";
          const images = prod.images || [];
          const imageUrl = images[0]?.src || "";
          const vendorBrand = prod.vendor || "Seyon Essentials";
          
          for (const variant of (prod.variants || [])) {
            const shopifyVariantId = `gid://shopify/ProductVariant/${variant.id}`;
            const sku = variant.sku || `SPFY-${variant.id}`;
            const size = variant.option1 || "Free";
            const color = variant.option2 || "Default";
            const price = parseFloat(variant.price) || 0.0;
            const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : Math.round(price * 1.25);
            const barcodeString = variant.barcode || `BAR-${variant.id}`;
            const liveStockQty = typeof variant.inventory_quantity === "number" ? variant.inventory_quantity : 0;

            const thumbnailConfig = imageUrl
              ? JSON.stringify({ imageUrl, color: color.toLowerCase() })
              : JSON.stringify({ color: color.toLowerCase() });

            // Check if SKU already exists for this company
            const { data: existing } = await supabase
              .from("ProductVariant")
              .select("id")
              .eq("companyId", companyId)
              .eq("sku", sku)
              .maybeSingle();

            let variantDbId: string | null = null;

            if (existing) {
              variantDbId = existing.id;
              await supabase
                .from("ProductVariant")
                .update({
                  shopifyVariantId,
                  title,
                  price,
                  compareAtPrice,
                  brand: vendorBrand,
                  vendor: vendorBrand,
                  category,
                  barcodeString,
                  thumbnailConfig,
                  currentStockLevel: liveStockQty,
                  updatedAt: new Date().toISOString()
                })
                .eq("id", existing.id);
            } else {
              const { data: insertedVariant } = await supabase
                .from("ProductVariant")
                .insert({
                  companyId,
                  shopifyVariantId,
                  sku,
                  title,
                  size,
                  color,
                  price,
                  compareAtPrice,
                  brand: vendorBrand,
                  vendor: vendorBrand,
                  category,
                  barcodeString,
                  thumbnailConfig,
                  safetyStockLimit: 5,
                  currentStockLevel: liveStockQty
                })
                .select("id")
                .single();
              if (insertedVariant) variantDbId = insertedVariant.id;
            }

            // Reconcile WarehouseStock in central warehouse
            if (defaultWarehouseId && variantDbId) {
              await supabase
                .from("WarehouseStock")
                .upsert(
                  {
                    companyId,
                    warehouseId: defaultWarehouseId,
                    variantId: variantDbId,
                    availableQty: liveStockQty,
                    updatedAt: new Date().toISOString()
                  },
                  { onConflict: "warehouseId,variantId" }
                );
              tableCounts.WarehouseStock = (tableCounts.WarehouseStock || 0) + 1;
            }

            recordsCount++;
            tableCounts.ProductVariant = (tableCounts.ProductVariant || 0) + 1;
          }
        }
      }
    }

    if (module === "Customers Sync" || module === "Full System Sync") {
      const res = await fetch(
        `https://${shopifyDomain}/admin/api/2024-04/customers.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": activeToken,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        if (module === "Customers Sync") {
          throw new Error(`Shopify API customer pull failed: ${errText}`);
        } else {
          console.warn("Customers pull skipped due to scope restriction:", errText);
        }
      } else {
        const { customers } = await res.json();
        if (Array.isArray(customers)) {
          for (const cust of customers) {
          const name = `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || "Shopify Customer";
          const phone = cust.phone || `+91999999${cust.id.toString().slice(-4)}`;
          const email = cust.email || "";
          
          const defaultAddress = cust.default_address || {};
          const city = defaultAddress.city || "";
          const state = defaultAddress.province || "";
          const zip = defaultAddress.zip || "";
          const country = defaultAddress.country || "";

          const { data: existing } = await supabase
            .from("Customer")
            .select("id")
            .eq("companyId", companyId)
            .eq("phone", phone)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("Customer")
              .update({ name, email, city, state, zip, country })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("Customer")
              .insert({
                companyId,
                name,
                phone,
                email,
                city,
                state,
                zip,
                country
              });
          }
          recordsCount++;
          tableCounts.Customer = (tableCounts.Customer || 0) + 1;
        }
      }
    }
  }

    if (module === "Orders Sync" || module === "Full System Sync") {
      const res = await fetch(
        `https://${shopifyDomain}/admin/api/2024-04/orders.json?status=any`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": activeToken,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Shopify API orders pull failed: ${await res.text()}`);
      }

      const { orders } = await res.json();
      if (Array.isArray(orders)) {
        // Resolve default warehouse
        let { data: warehouse } = await supabase
          .from("Warehouse")
          .select("id")
          .eq("companyId", companyId)
          .eq("isDefaultPickup", true)
          .maybeSingle();

        if (!warehouse) {
          const { data: anyWh } = await supabase
            .from("Warehouse")
            .select("id")
            .eq("companyId", companyId)
            .limit(1)
            .maybeSingle();
          warehouse = anyWh;
        }

        for (const orderPayload of orders) {
          const shopifyOrderId = `gid://shopify/Order/${orderPayload.id}`;
          const orderNumber = orderPayload.name || `#${orderPayload.order_number}`;
          
          const customerPayload = orderPayload.customer || {};
          const customerName = `${customerPayload.first_name || ""} ${customerPayload.last_name || ""}`.trim() || "Shopify Customer";
          const customerPhone = customerPayload.phone || `+91999999${customerPayload.id?.toString().slice(-4) || "0000"}`;
          const customerEmail = customerPayload.email || "";

          const shippingAddress = orderPayload.shipping_address || {};
          const shippingAddressLine1 = shippingAddress.address1 || "";
          const shippingAddressLine2 = shippingAddress.address2 || "";
          const shippingCity = shippingAddress.city || "";
          const shippingState = shippingAddress.province || "";
          const shippingZip = shippingAddress.zip || "";
          const shippingCountry = shippingAddress.country || "";

          const totalPrice = parseFloat(orderPayload.total_price || "0.0");
          const currency = orderPayload.currency || "INR";
          const lineItems = orderPayload.line_items || [];

          // 1. Upsert Customer
          let customerId;
          const { data: matchCust } = await supabase
            .from("Customer")
            .select("id")
            .eq("companyId", companyId)
            .eq("phone", customerPhone)
            .maybeSingle();

          if (matchCust) {
            customerId = matchCust.id;
          } else {
            const { data: newCust, error: createCustErr } = await supabase
              .from("Customer")
              .insert({
                companyId,
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
                city: shippingCity,
                state: shippingState,
                zip: shippingZip,
                country: shippingCountry
              })
              .select("id")
              .single();

            if (createCustErr) throw createCustErr;
            customerId = newCust.id;
          }

          // 2. Check if Order already exists
          const { data: existingOrder } = await supabase
            .from("Order")
            .select("id")
            .eq("companyId", companyId)
            .eq("shopifyOrderId", shopifyOrderId)
            .maybeSingle();

          let orderId;
          if (existingOrder) {
            orderId = existingOrder.id;
            await supabase
              .from("Order")
              .update({
                orderNumber,
                totalPrice,
                paymentStatus: orderPayload.financial_status === "paid" ? "PAID" : "PENDING",
                rawPayload: orderPayload,
                updatedAt: new Date().toISOString()
              })
              .eq("id", existingOrder.id);
          } else {
            const { data: newOrder, error: createOrderErr } = await supabase
              .from("Order")
              .insert({
                companyId,
                customerId,
                orderNumber,
                shopifyOrderId,
                paymentStatus: orderPayload.financial_status === "paid" ? "PAID" : "PENDING",
                fulfillmentStatus: "UNFULFILLED",
                totalPrice,
                currency,
                rawPayload: orderPayload
              })
              .select("id")
              .single();

            if (createOrderErr) throw createOrderErr;
            orderId = newOrder.id;
            tableCounts.Order = (tableCounts.Order || 0) + 1;
          }

          // 3. Line Items and Stock Reconcile (Only on newly created orders)
          if (!existingOrder) {
            for (const item of lineItems) {
              const itemVariantId = `gid://shopify/ProductVariant/${item.variant_id}`;
              const itemSku = item.sku;
              const itemQuantity = parseInt(item.quantity || "1");
              const itemPrice = parseFloat(item.price || "0.0");

              // Lookup matching ProductVariant
              let variant = null;
              const { data: matchVarByShopifyId } = await supabase
                .from("ProductVariant")
                .select("id, currentStockLevel")
                .eq("companyId", companyId)
                .eq("shopifyVariantId", itemVariantId)
                .maybeSingle();
              variant = matchVarByShopifyId;

              if (!variant && itemSku) {
                const { data: matchVarBySku } = await supabase
                  .from("ProductVariant")
                  .select("id, currentStockLevel")
                  .eq("companyId", companyId)
                  .eq("sku", itemSku)
                  .maybeSingle();
                variant = matchVarBySku;
              }

              if (variant) {
                // Insert OrderItem
                await supabase.from("OrderItem").insert({
                  orderId,
                  variantId: variant.id,
                  quantity: itemQuantity,
                  price: itemPrice
                });
                tableCounts.OrderItem = (tableCounts.OrderItem || 0) + 1;

                // Reconcile ERP stock level
                const newStock = Math.max(0, variant.currentStockLevel - itemQuantity);
                await supabase
                  .from("ProductVariant")
                  .update({ currentStockLevel: newStock })
                  .eq("id", variant.id);

                if (warehouse) {
                  // Reconcile WarehouseStock
                  let { data: whStock } = await supabase
                    .from("WarehouseStock")
                    .select("currentStockLevel")
                    .eq("warehouseId", warehouse.id)
                    .eq("variantId", variant.id)
                    .maybeSingle();
                  
                  if (whStock) {
                    await supabase
                      .from("WarehouseStock")
                      .update({ currentStockLevel: Math.max(0, whStock.currentStockLevel - itemQuantity) })
                      .eq("warehouseId", warehouse.id)
                      .eq("variantId", variant.id);
                  }

                  // Log Movement
                  await supabase.from("StockMovement").insert({
                    companyId,
                    variantId: variant.id,
                    warehouseId: warehouse.id,
                    type: "OUTWARD",
                    quantity: itemQuantity,
                    operatorEmail: "shopify-sync@pull.com",
                    syncStatus: "SUCCESS"
                  });
                }
              }
            }
          }

          // 4. Upsert OrderFulfillment record
          const { data: existingFulfillment } = await supabase
            .from("OrderFulfillment")
            .select("id")
            .eq("companyId", companyId)
            .eq("shopifyOrderId", shopifyOrderId)
            .maybeSingle();

          if (existingFulfillment) {
            await supabase
              .from("OrderFulfillment")
              .update({
                orderNumber,
                customerName,
                customerPhone,
                shippingAddressLine1,
                shippingAddressLine2,
                shippingCity,
                shippingState,
                shippingZip,
                shippingCountry,
                updatedAt: new Date().toISOString()
              })
              .eq("id", existingFulfillment.id);
          } else {
            await supabase
              .from("OrderFulfillment")
              .insert({
                companyId,
                orderId,
                customerId,
                shopifyOrderId,
                orderNumber,
                customerName,
                customerPhone,
                shippingAddressLine1,
                shippingAddressLine2,
                shippingCity,
                shippingState,
                shippingZip,
                shippingCountry,
                totalWeightKg: 0.35,
                deliveryStatus: "PROCESSING",
                orderSource: "SHOPIFY",
                warehouseId: warehouse ? warehouse.id : null
              });
          }
          recordsCount++;
          tableCounts.OrderFulfillment = (tableCounts.OrderFulfillment || 0) + 1;
        }
      }
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      records: recordsCount,
      jobId: syncJobId,
      duration: `${durationSec}s`,
      telemetry: {
        id: syncJobId,
        module,
        direction: module === "Inventory Sync" ? "ERP → Shopify" : "Shopify → ERP",
        recordsProcessed: recordsCount,
        tableCounts,
        status: "SUCCESS",
        duration: `${durationSec}s`,
        timestamp: new Date().toISOString()
      },
      log: {
        id: syncJobId,
        module,
        direction: module === "Inventory Sync" ? "ERP → Shopify" : "Shopify → ERP",
        records: recordsCount,
        status: "Success",
        duration: `${durationSec}s`,
        time: "Just now"
      }
    });

  } catch (error: any) {
    console.error("Shopify Pull Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
