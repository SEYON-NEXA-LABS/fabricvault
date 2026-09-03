# Seyon Shopping — Superadmin Client Onboarding & System Auditor SOP

This document outlines the steps for a Superadmin to create, provision, and audit client (tenant) environments in Seyon Shopping.

---

## 1. Pre-Configured User Accounts

Every tenant workspace includes pre-configured access accounts:

### Master Tenant Administrator
- **Username**: `wolfadmin`
- **Default Password**: `password123`
- **Role**: `TENANTADMIN`
- **Scope**: Master administrative control over tenant workspace, billing details, settings, stores, brands, and staff logins.

### Operator Team Logins
- **Staff Login - Alpha**:
  - **Username**: `alpha`
  - **Default Password**: `password123`
  - **Role**: `STAFF`
  - **Scope**: Scoped permissions (inventory barcode scanning, inward/outward stock movements, order dispatch).
- **Staff Login - Beta**:
  - **Username**: `beta`
  - **Default Password**: `password123`
  - **Role**: `STAFF`
  - **Scope**: Scoped permissions (inventory barcode scanning, inward/outward stock movements, order dispatch).

---

## 2. Full 26-Table Database Integrity Auditor

The **Database Schema & RLS Integrity Auditor** is accessible at `/dashboard/superadmin` (or via API `GET /api/superadmin/integrity`).

Audits live row counts and Row-Level Security (RLS) policies across all **26 database tables**:
1. `Company`
2. `User`
3. `ProductVariant`
4. `Warehouse`
5. `WarehouseStock`
6. `StockMovement`
7. `Order`
8. `OrderItem`
9. `Customer`
10. `OrderFulfillment`
11. `Subscription`
12. `CourierConfig`
13. `Brand`
14. `Vendor`
15. `Category`
16. `Coupons`
17. `MarketplaceConfig`
18. `SerializedUnit`
19. `StockTransfer`
20. `PurchaseOrder`
21. `PurchaseOrderItem`
22. `ShippingManifest`
23. `InventoryAudit`
24. `InventoryAuditItem`
25. `AbandonedCheckout`
26. `BlogPost`

---

## 3. Provisioning New Clients via API

To onboard a new tenant client programmatically, send a `POST` request to `/api/superadmin/tenants`:

```json
{
  "name": "Wolf Cabin Retail",
  "code": "wolfcabin",
  "contactEmail": "admin@wolfcabin.in",
  "adminUsername": "wolfadmin",
  "adminPassword": "password123",
  "planType": "ENTERPRISE",
  "amount": 4999,
  "currency": "INR"
}
```
