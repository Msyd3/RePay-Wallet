# GitHub Pages and Render deployment

## Frontend on GitHub Pages

1. Merge the GitHub Pages deployment workflow to `main`.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. After the `Deploy wallet to GitHub Pages` workflow completes, open **Settings → Pages → Custom domain**, enter `wallet.repay.sa`, and save.
4. At the DNS provider that manages `repay.sa` (for example Cloudflare or the domain registrar), create:
   - Type: `CNAME`
   - Name/Host: `wallet`
   - Target: `msyd3.github.io`
   - TTL: Auto/default
5. Remove only a conflicting record for the `wallet` host. Keep unrelated records, including the root `repay.sa` and WhatsApp service records.
6. Return to **Settings → Pages**, wait for DNS verification, then enable **Enforce HTTPS**.

GitHub Pages does not host DNS records. The CNAME record must be added at the provider whose nameservers manage `repay.sa`. Do not point `wallet` to a Render host if the frontend is being published by GitHub Pages.

The build creates clean page URLs: `/summary/`, `/login/`, `/otp/`, `/home/`, `/profile/`, `/success/`, and `/failure/`.

## Wallet API on Render

GitHub Pages serves static frontend files only. The Wallet repository documents API routes such as `/api/auth/otp/request`, `/api/profile`, `/api/wallet`, and `/api/transactions/{id}`, but does not contain a server implementing them. The existing WhatsApp webhook service is not a compatible wallet API.

For a secure production connection, deploy or identify a separate wallet API service on Render, add a custom domain such as `api.repay.sa` to that service, and create a DNS CNAME for `api` pointing to the exact Render hostname shown in that service's settings. Configure the backend to allow requests from `https://wallet.repay.sa`, including credentialed CORS and secure session cookies. Then configure the frontend's API base URL to `https://api.repay.sa` and ensure the backend implements the documented routes. Never put the Meta access token or other server credentials in the frontend.
