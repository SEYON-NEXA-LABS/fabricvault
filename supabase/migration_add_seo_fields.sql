-- Migration: Add SEO Meta Title, Meta Description, and Social Media Caption fields to ProductVariant
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "instagramCaption" TEXT;
