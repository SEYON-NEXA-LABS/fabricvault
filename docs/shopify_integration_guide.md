# Seyon Shopping — Shopify Integration & Telemetry SOP

Follow this guide to connect your live Shopify Store with Seyon Shopping (MerchantVault ERP).

---

## 1. Credentials Required & Token Types

| Field Name | Prefix | Purpose | Where to Find in Shopify Admin |
| :--- | :--- | :--- | :--- |
| **Store Domain URL** | `your-shop.myshopify.com` | Store Domain Identifier | Shopify Admin URL |
| **Admin API Access Token** | **`shpat_...`** | **REST API Pull Token** (Used for pulling products, compare-at prices, variants, and orders) | Shopify Admin &rarr; Settings &rarr; Apps and developer channels &rarr; Seyon Shopping ERP &rarr; API credentials &rarr; Admin API access token |
| **Webhook API Secret Key** | **`shpss_...`** | **Webhook Signature Secret** (Used to cryptographically verify HMAC incoming order webhooks) | Shopify Admin &rarr; Settings &rarr; Notifications &rarr; Webhooks &rarr; Webhook Secret Key |

> [!WARNING]
> Do NOT paste `shpss_...` into the Admin API Access Token field. `shpss_` is your Secret Key, while `shpat_` is your Admin Access Token required for API data pulls.

---

## 2. Step-by-Step Shopify Custom App Setup

1. **Log into Shopify Admin**:
   - Open `https://admin.shopify.com/store/your-store-name` (e.g. `https://admin.shopify.com/store/wolfcabin`).
2. **Navigate to App Development**:
   - Go to **Settings ⚙️** &rarr; **Apps and developer channels** &rarr; **Develop apps** (or Custom apps).
   - Click **Create an app** and name it `Seyon Shopping ERP`.
3. **Configure Access Scopes**:
   - Select **Configure Admin API scopes** and enable:
     - `read_products`, `write_products`
     - `read_inventory`, `write_inventory`
     - `read_orders`, `write_orders`
     - `read_customers`
     - `read_fulfillments`, `write_fulfillments`
4. **Install & Generate Access Token**:
   - Click **Install app** at the top right.
   - Under **API credentials**, click **Reveal token once** to reveal your **Admin API access token** starting with **`shpat_`**.

---

## 3. Connecting Credentials in Seyon Shopping

You can connect using either of two methods:

### Method A: Client ID + Client Secret (Automated OAuth Exchange - Recommended)
1. Open **Partner Dashboard** &rarr; **App settings** (or Shopify Custom App credentials).
2. Copy your **Client ID** (API Key) and **Client Secret** (`shpss_...`).
3. In Seyon Shopping, click **Connect Channel** &rarr; **Shopify**.
4. Paste:
   - **Shopify Store URL**: `https://wolfcabin.myshopify.com`
   - **Admin API Access Token**: Paste your **Client ID** (e.g. `61d9a410a3ce736f...`)
   - **API Secret / Client Secret**: Paste your **Client Secret** (e.g. `shpss_d7ad2802...`)
5. Click **Save Connection** &rarr; **Trigger Sync**. Seyon Shopping will perform the automated background token exchange and initiate sync!

### Method B: Direct Admin API Access Token
1. Copy your **Admin API access token** starting with **`shpat_`** from Shopify Admin.
2. In Seyon Shopping, click **Connect Channel** &rarr; **Shopify**.
3. Paste:
   - **Shopify Store URL**: `https://wolfcabin.myshopify.com`
   - **Admin API Access Token**: `shpat_...`
4. Click **Save Connection** &rarr; **Trigger Sync**.

---

## 4. Telemetry Audit Report

Every sync execution returns a live **Sync Telemetry Report Modal** featuring:
- **Sync Job ID**: Unique tracking identifier (e.g. `SYN-9482`).
- **Table-Wise Breakdown Grid**: Row counts processed across `ProductVariant`, `Customer`, `Order`, `OrderItem`, `OrderFulfillment`, and `WarehouseStock`.
- **Execution Speed**: Real-time execution timer in seconds.
- **Status Audit**: 100% SUCCESS verification status.
