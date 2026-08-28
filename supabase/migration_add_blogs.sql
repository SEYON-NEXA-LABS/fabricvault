-- Migration: Create BlogPost table for Content Marketing & SEO
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "companyId" UUID NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "author" TEXT DEFAULT 'Editorial Team',
    "featuredImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "published" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "BlogPost_companyId_slug_key" UNIQUE ("companyId", "slug")
);

CREATE INDEX IF NOT EXISTS "idx_blog_post_company" ON "BlogPost" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_blog_post_slug" ON "BlogPost" ("slug");
