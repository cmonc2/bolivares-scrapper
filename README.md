# 🇻🇪 Bolívares Scrapper API

A resilient, ultra-lightweight, and self-healing **TypeScript** microservice built with [Hono](https://hono.dev), [Cheerio](https://cheerio.js.org), [Undici](https://undici.nodejs.org), and [Zod](https://zod.dev) to scrape and serve the official USD/VES exchange rate from the Central Bank of Venezuela ([BCV](https://www.bcv.org.ve/)).

---

## 💡 The Problem & Motivation

In Venezuela, many everyday applications (e-commerce platforms, payment integrations, currency converter browser extensions, and accounting software) rely on the official USD/VES exchange rate published by the Central Bank of Venezuela (BCV).

However, consuming BCV data programmatically has historically been a headache for developers due to:
1. **No Official REST API**: Data must be extracted directly from legacy server-rendered HTML.
2. **Broken SSL Certificate Chains**: The BCV portal often encounters self-signed or incomplete TLS certificate chains that crash standard HTTP clients like `axios` or standard `fetch`.
3. **Regional Geoblocking & ISP Routing Flakiness**: Depending on the server's datacenter or IP origin, direct requests to Venezuelan governmental portals may be blocked or intermittently dropped.

### 🛡️ The Solution: A Resilient, Dual-Transport Architecture
This microservice was designed with a **self-healing dual-transport strategy**:
* **Protected Transport (VPN Proxy)**: Attempts to route traffic through an internal VPN proxy (`client-vpn`) to guarantee Venezuelan IP origin and bypass geo-blocks.
* **Automatic Fallback (Direct Connection)**: If the VPN proxy is offline or unreachable, it smoothly falls back to a direct fetch configured with a custom TLS agent.
* **Exposed Status Flag**: Dynamically notifies the consumer whether the request was protected (`exposed: false`) or direct (`exposed: true`).
* **5-Minute In-Memory Cache**: Prevents hammering the upstream BCV server on frequent requests.

---

## 📋 Tech Stack

* **Runtime & Language**: Node.js 22 (LTS) & TypeScript 5.
* **Web Framework**: [Hono](https://hono.dev) (Blazing fast, standard web-standards API).
* **HTTP Client**: [Undici](https://undici.nodejs.org) (Node's official next-generation HTTP client with native `ProxyAgent` and custom `Agent` dispatcher).
* **HTML Parser**: [Cheerio](https://cheerio.js.org) (Lightweight DOM selector).
* **Schema Validation**: [Zod](https://zod.dev) (Type-safe runtime schema validation for environment and payloads).
* **Containerization**: Docker Compose & VS Code Dev Containers (Rootless `USER node` security).

---

## 🌐 Live Public API

A free, high-availability public instance of this microservice is deployed on Vercel:

<div align="center">

[![Live API](https://img.shields.io/badge/🚀_Live_API-Haz_clic_aquí_para_obtener_la_tasa_del_día-23c45e?style=for-the-badge&logo=vercel&logoColor=white)](https://bolivares-scrapper.vercel.app/)

</div>

> 💡 **Quick Test (Terminal)**:
> ```bash
> curl https://bolivares-scrapper.vercel.app/
> ```

---

## 📡 API Reference

### `GET /` or `GET /api/rate`

Retrieves the latest official USD/VES exchange rate.

#### Successful Response (`200 OK`)

```json
{
  "date": "2026-09-01",
  "rate": 798.33,
  "exposed": false
}
```

#### Response Field Specifications:
| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | `string` | Scraping date formatted strictly as `YYYY-MM-DD`. |
| `rate` | `number` | Official BCV exchange rate (Bolívares per US Dollar). |
| `exposed` | `boolean` | `false` if proxied through VPN; `true` if routed directly. |

---

## 🛠️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v22+
* [pnpm](https://pnpm.io/) v9+ (or Docker)

### 1. Installation
```bash
pnpm install
```

### 2. Configuration
Copy the environment template:
```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port where Hono listens (validated via Zod). |
| `VPN_PROXY_URL` | `http://localhost:8888` | HTTP proxy URL for protected requests. |
| `TZ` | `America/Caracas` | System timezone. |

### 3. Running Locally (Hot-Reload)
```bash
pnpm dev
```
The API will be available at `http://localhost:3000` (or your configured `PORT`).

---

## 🐳 Docker & Dev Containers

Run the microservice in an isolated container:

```bash
docker compose up -d
```

To develop inside VS Code, open the folder and choose **"Dev Containers: Reopen in Container"**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
