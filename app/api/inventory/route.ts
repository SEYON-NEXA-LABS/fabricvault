import { getContextCompanyId } from "@/lib/session";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    // Fetch product variants with nested warehouse stock levels
    const { data: variants, error: varErr } = await supabase
      .from("ProductVariant")
      .select(`
        id,
        companyId,
        shopifyVariantId,
        sku,
        title,
        size,
        color,
        barcodeString,
        safetyStockLimit,
        currentStockLevel,
        velocity,
        leadTimeDays,
        averageDailySales,
        thumbnailConfig,
        price,
        compareAtPrice,
        category,
        targetGroup,
        ageRange,
        brand,
        vendor,
        createdAt,
        updatedAt,
        stocks:WarehouseStock(
          id,
          warehouseId,
          currentStockLevel
        )
      `)
      .eq("companyId", companyId)
      .order("title", { ascending: true });

    if (varErr) throw varErr;

    return NextResponse.json(variants || []);
  } catch (error: any) {
    console.error("Fetch Inventory Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      baseSku,
      category,
      targetGroup,
      ageRange,
      safetyStockLimit,
      imageUrl,
      warehouseId,
      variants
    } = body;

    if (!title || !baseSku || !variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate SKUs or barcodes inside the database for this company
    const skusToCheck = variants.map((v: any) => v.sku).filter(Boolean);
    const barcodesToCheck = variants.map((v: any) => v.barcode).filter(Boolean);

    if (skusToCheck.length > 0) {
      const { data: existingSkus, error: skuCheckErr } = await supabase
        .from("ProductVariant")
        .select("sku")
        .eq("companyId", companyId)
        .in("sku", skusToCheck);

      if (skuCheckErr) throw skuCheckErr;
      if (existingSkus && existingSkus.length > 0) {
        return NextResponse.json({ 
          error: `SKU(s) already exist: ${existingSkus.map((s: any) => s.sku).join(", ")}` 
        }, { status: 400 });
      }
    }

    if (barcodesToCheck.length > 0) {
      const { data: existingBarcodes, error: bcCheckErr } = await supabase
        .from("ProductVariant")
        .select("barcodeString")
        .eq("companyId", companyId)
        .in("barcodeString", barcodesToCheck);

      if (bcCheckErr) throw bcCheckErr;
      if (existingBarcodes && existingBarcodes.length > 0) {
        return NextResponse.json({ 
          error: `Barcode(s) already exist: ${existingBarcodes.map((b: any) => b.barcodeString).join(", ")}` 
        }, { status: 400 });
      }
    }

    const timestamp = Date.now();
    const createdVariants = [];

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const generatedShopifyId = `gid://shopify/ProductVariant/imported_${timestamp}_${randomPart}`;
      const finalBarcode = v.barcode || `${v.sku.replace(/[^a-zA-Z0-9]/g, "")}${randomPart}`;
      
      const imageUrls = imageUrl ? imageUrl.split(",").map((url: string) => url.trim()).filter(Boolean) : [];
      const thumbnailConfig = imageUrls.length > 0
        ? JSON.stringify({ 
            imageUrl: imageUrls[0], 
            images: imageUrls, 
            color: v.color.toLowerCase() 
          })
        : JSON.stringify({ color: v.color.toLowerCase() });

      const { data: newVariant, error: insertErr } = await supabase
        .from("ProductVariant")
        .insert({
          companyId,
          shopifyVariantId: generatedShopifyId,
          sku: v.sku,
          title,
          size: v.size,
          color: v.color,
          barcodeString: finalBarcode,
          safetyStockLimit: safetyStockLimit || 5,
          price: parseFloat(v.price) || 0.0,
          category: category || "Top",
          targetGroup: targetGroup || "Adults",
          ageRange: ageRange || null,
          thumbnailConfig,
          currentStockLevel: 0
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // If warehouse context and initial stock is supplied, initialize the stocks
      const initialStockVal = parseInt(v.initialStock) || 0;
      if (warehouseId && initialStockVal > 0) {
        const { error: stockUpsertErr } = await supabase
          .from("WarehouseStock")
          .upsert({
            warehouseId,
            variantId: newVariant.id,
            currentStockLevel: initialStockVal,
            updatedAt: new Date().toISOString()
          }, {
            onConflict: "warehouseId,variantId"
          });

        if (stockUpsertErr) throw stockUpsertErr;

        // Insert stock movement record
        const { error: movementErr } = await supabase
          .from("StockMovement")
          .insert({
            companyId,
            variantId: newVariant.id,
            warehouseId,
            type: "INWARD",
            quantity: initialStockVal,
            operatorEmail: "admin@seyon.co",
            syncStatus: "SUCCESS"
          });

        if (movementErr) throw movementErr;

        // Sync variant aggregate level
        const { error: updateErr } = await supabase
          .from("ProductVariant")
          .update({
            currentStockLevel: initialStockVal,
            updatedAt: new Date().toISOString()
          })
          .eq("id", newVariant.id);

        if (updateErr) throw updateErr;
        
        newVariant.currentStockLevel = initialStockVal;
      }

      createdVariants.push(newVariant);
    }

    return NextResponse.json({ success: true, variants: createdVariants });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const companyId = await getContextCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Company context not found" }, { status: 404 });
    }

    const body = await req.json();
    const { variantId, price, oldTitle, title, category, targetGroup, ageRange, safetyStockLimit, imageUrl, variantsToAdd } = body;

    // Case 1: Simple Price Edit
    if (variantId && price !== undefined) {
      const { data, error } = await supabase
        .from("ProductVariant")
        .update({ price: parseFloat(price) })
        .eq("id", variantId)
        .eq("companyId", companyId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, variant: data });
    }

    // Case 2: Full Product Edit
    if (oldTitle) {
      if (!title) {
        return NextResponse.json({ error: "Title is required for product update" }, { status: 400 });
      }

      // Find all existing variants under the oldTitle
      const { data: existingVars, error: findErr } = await supabase
        .from("ProductVariant")
        .select("id, thumbnailConfig, color")
        .eq("companyId", companyId)
        .eq("title", oldTitle);

      if (findErr) throw findErr;
      if (!existingVars || existingVars.length === 0) {
        return NextResponse.json({ error: "No matching variants found for the product" }, { status: 404 });
      }

      // Compile updates for the metadata
      const updatePayload: any = {
        title,
        category: category || "Top",
        targetGroup: targetGroup || "Adults",
        ageRange: ageRange || null,
        safetyStockLimit: safetyStockLimit || 5,
        updatedAt: new Date().toISOString()
      };

      if (imageUrl !== undefined) {
        const imageUrls = imageUrl ? imageUrl.split(",").map((url: string) => url.trim()).filter(Boolean) : [];
        for (const ev of existingVars) {
          const thumbnailConfig = imageUrls.length > 0
            ? JSON.stringify({ 
                imageUrl: imageUrls[0], 
                images: imageUrls, 
                color: (ev.color || "indigo").toLowerCase() 
              })
            : JSON.stringify({ color: (ev.color || "indigo").toLowerCase() });

          const { error: itemUpdErr } = await supabase
            .from("ProductVariant")
            .update({ ...updatePayload, thumbnailConfig })
            .eq("id", ev.id);

          if (itemUpdErr) throw itemUpdErr;
        }
      } else {
        const { error: bulkUpdErr } = await supabase
          .from("ProductVariant")
          .update(updatePayload)
          .eq("companyId", companyId)
          .eq("title", oldTitle);

        if (bulkUpdErr) throw bulkUpdErr;
      }

      // Handle variantsToAdd if present
      if (Array.isArray(variantsToAdd) && variantsToAdd.length > 0) {
        const skusToCheck = variantsToAdd.map((v: any) => v.sku).filter(Boolean);
        if (skusToCheck.length > 0) {
          const { data: existingSkus, error: skuCheckErr } = await supabase
            .from("ProductVariant")
            .select("sku")
            .eq("companyId", companyId)
            .in("sku", skusToCheck);

          if (skuCheckErr) throw skuCheckErr;
          if (existingSkus && existingSkus.length > 0) {
            return NextResponse.json({ 
              error: `SKU(s) already exist: ${existingSkus.map((s: any) => s.sku).join(", ")}` 
            }, { status: 400 });
          }
        }

        const timestamp = Date.now();
        for (const v of variantsToAdd) {
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          const generatedShopifyId = `gid://shopify/ProductVariant/imported_${timestamp}_${randomPart}`;
          const finalBarcode = v.barcode || `${v.sku.replace(/[^a-zA-Z0-9]/g, "")}${randomPart}`;
          
          const imageUrls = imageUrl ? imageUrl.split(",").map((url: string) => url.trim()).filter(Boolean) : [];
          const thumbnailConfig = imageUrls.length > 0
            ? JSON.stringify({ 
                imageUrl: imageUrls[0], 
                images: imageUrls, 
                color: v.color.toLowerCase() 
              })
            : JSON.stringify({ color: v.color.toLowerCase() });

          const { data: newVar, error: insertErr } = await supabase
            .from("ProductVariant")
            .insert({
              companyId,
              shopifyVariantId: generatedShopifyId,
              sku: v.sku,
              title: title,
              size: v.size,
              color: v.color,
              barcodeString: finalBarcode,
              safetyStockLimit: safetyStockLimit || 5,
              price: parseFloat(v.price) || 0.0,
              category: category || "Top",
              targetGroup: targetGroup || "Adults",
              ageRange: ageRange || null,
              thumbnailConfig,
              currentStockLevel: 0
            })
            .select()
            .single();

          if (insertErr) throw insertErr;

          const initialStockVal = parseInt(v.initialStock) || 0;
          if (v.warehouseId && initialStockVal > 0) {
            const { error: stockUpsertErr } = await supabase
              .from("WarehouseStock")
              .upsert({
                warehouseId: v.warehouseId,
                variantId: newVar.id,
                currentStockLevel: initialStockVal,
                updatedAt: new Date().toISOString()
              }, {
                onConflict: "warehouseId,variantId"
              });

            if (stockUpsertErr) throw stockUpsertErr;

            await supabase
              .from("StockMovement")
              .insert({
                companyId,
                variantId: newVar.id,
                warehouseId: v.warehouseId,
                type: "INWARD",
                quantity: initialStockVal,
                operatorEmail: "admin@seyon.co",
                syncStatus: "SUCCESS"
              });

            await supabase
              .from("ProductVariant")
              .update({
                currentStockLevel: initialStockVal,
                updatedAt: new Date().toISOString()
              })
              .eq("id", newVar.id);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid payload parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

