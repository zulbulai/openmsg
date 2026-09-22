import { describe, it, expect } from 'vitest';
import { SSRFGuard } from '@/core/security/ssrf';

describe('SSRFGuard', () => {
  it('should block localhost and loopback IPv4', () => {
    expect(SSRFGuard.validateUrl('http://localhost:8080').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('http://127.0.0.1/api').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('http://127.0.1.1:3000').allowed).toBe(false);
  });

  it('should block RFC 1918 private IPv4 ranges', () => {
    expect(SSRFGuard.validateUrl('http://10.0.0.1/admin').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('http://192.168.1.1').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('http://172.16.0.5/api').allowed).toBe(false);
  });

  it('should block AWS / Cloud metadata service (169.254.169.254)', () => {
    expect(SSRFGuard.validateUrl('http://169.254.169.254/latest/meta-data/').allowed).toBe(false);
  });

  it('should block non-HTTP protocols like file:// or gopher://', () => {
    expect(SSRFGuard.validateUrl('file:///etc/passwd').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('gopher://127.0.0.1:70').allowed).toBe(false);
    expect(SSRFGuard.validateUrl('javascript:alert(1)').allowed).toBe(false);
  });

  it('should allow valid public HTTPS and HTTP URLs', () => {
    expect(SSRFGuard.validateUrl('https://api.example.com/webhook').allowed).toBe(true);
    expect(SSRFGuard.validateUrl('https://hooks.slack.com/services/xxx').allowed).toBe(true);
    expect(SSRFGuard.validateUrl('http://public-api.org/v1').allowed).toBe(true);
  });
});
