import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variantId, metaTitle, metaDescription, description, instagramCaption } = body;

    if (!variantId) {
      return NextResponse.json({ error: "Missing required field: variantId" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (metaTitle !== undefined) updatePayload.metaTitle = metaTitle;
    if (metaDescription !== undefined) updatePayload.metaDescription = metaDescription;
    if (description !== undefined) updatePayload.description = description;
    if (instagramCaption !== undefined) updatePayload.instagramCaption = instagramCaption;

    const { data, error } = await supabase
      .from("ProductVariant")
      .update(updatePayload)
      .eq("id", variantId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Failed to update SEO fields:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    console.error("SEO update API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product SEO" }, { status: 500 });
  }
}
