/**
 * SSRF (Server-Side Request Forgery) Protection & URL Security Guard
 * Prevents automated webhook and HTTP request nodes from querying private intranet IP addresses.
 */

const PRIVATE_IP_RANGES = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8 loopback
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8 private network
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16 private network
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 private network
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / Cloud metadata (AWS, GCP, Azure)
  /^0\.0\.0\.0$/,
  /^::1$/, // IPv6 loopback
  /^[fF][cCdD][0-9a-fA-F]{2}:/, // IPv6 Unique local address
  /^[fF][eE][89aAbB][0-9a-fA-F]:/, // IPv6 Link-local
];

export interface URLValidationResult {
  valid: boolean;
  allowed: boolean;
  error?: string;
  reason?: string;
  url?: URL;
}

export class SSRFGuard {
  /**
   * Validates if a target URL is safe to call from background extension processes
   */
  static validateUrl(inputUrl: string, allowPrivate = false): URLValidationResult {
    try {
      const parsed = new URL(inputUrl.trim());

      // Only http and https protocols are permitted
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const error = `Prohibited protocol: ${parsed.protocol}. Only http: and https: are allowed.`;
        return {
          valid: false,
          allowed: false,
          error,
          reason: error,
        };
      }

      const hostname = parsed.hostname.toLowerCase();

      if (!allowPrivate) {
        for (const pattern of PRIVATE_IP_RANGES) {
          if (pattern.test(hostname)) {
            const error = `Access to private/intranet address '${hostname}' is prohibited by SSRF security policy.`;
            return {
              valid: false,
              allowed: false,
              error,
              reason: error,
            };
          }
        }

        // Prohibit numeric IP notation tricks (e.g. 2130706433 for 127.0.0.1)
        if (/^\d+$/.test(hostname)) {
          const error = `Decimal IP formats are prohibited.`;
          return {
            valid: false,
            allowed: false,
            error,
            reason: error,
          };
        }
      }

      return { valid: true, allowed: true, url: parsed };
    } catch (err: any) {
      const error = `Invalid URL format: ${err?.message || String(err)}`;
      return {
        valid: false,
        allowed: false,
        error,
        reason: error,
      };
    }
  }

  /**
   * Performs a safe fetch request with SSRF validation, 15s timeout, and 5MB response cap
   */
  static async safeFetch(
    urlStr: string,
    options: RequestInit = {},
    maxBytes = 5 * 1024 * 1024,
    timeoutMs = 15000
  ): Promise<{ status: number; ok: boolean; data: string; headers: Headers }> {
    const validation = this.validateUrl(urlStr);
    if (!validation.valid || !validation.url) {
      throw new Error(`SSRF Block: ${validation.error}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validation.url.toString(), {
        ...options,
        signal: controller.signal,
        redirect: 'error', // prevent redirect-based SSRF bypasses
      });

      // Stream read to enforce hard byte limit
      const reader = response.body?.getReader();
      let totalBytes = 0;
      let text = '';
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          totalBytes += value.length;
          if (totalBytes > maxBytes) {
            controller.abort();
            throw new Error(`Response exceeded maximum allowed size of ${maxBytes / 1024 / 1024}MB`);
          }
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      } else {
        text = await response.text();
      }

      return {
        status: response.status,
        ok: response.ok,
        data: text,
        headers: response.headers,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
