# Arrakis Inventory

Multi-location stock monitoring and low-inventory alert dashboard for Shopify stores.

---

## Features

- **Multi-Location Scopes:** View stock per location or pooled store-wide.
- **Tiered Thresholds:** Global safety stock thresholds with variant-level overrides.
- **Live Event Alerts:** Real-time on-screen warnings when inventory drops below limits.
- **On-Demand Catalog Sync:** Sync products, variants, and locations directly from Shopify.

---

## Setup

### 1. Shopify API Access

Create a Custom App in **Shopify Admin > Settings > Apps and sales channels > Develop apps** with the following Admin API scopes:

- `read_products`
- `read_inventory`
- `read_locations`

Install the app and copy your Admin API access token (`shpat_...`).

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Launch

```bash
docker compose up --build
```

Access the dashboard at [http://localhost:3000](http://localhost:3000).

---

## (Optional) Webhook Setup

For instant inventory updates without manual syncing:

1. Expose your local server via [ngrok](https://ngrok.com):
   ```bash
   ngrok http 8080
   ```
2. Go to **Shopify Admin > Settings > Notifications > Webhooks**.
3. Create a webhook:
   - **Event:** `Inventory levels update`
   - **Format:** `JSON`
   - **URL:** `https://your-ngrok-url.ngrok-free.app/api/webhooks/inventory-level-update`

---

## Usage

1. **Sync:** Run an initial sync using the **Sync** button in the header.
2. **Filter:** Switch location scopes from the header dropdown or toggle **Show Low Stock Only**.
3. **Variant Overrides:** Click any product row to set a custom threshold on individual variants.
4. **Global Settings:** Go to **Settings** to update the store-wide default threshold or manage existing overrides.

