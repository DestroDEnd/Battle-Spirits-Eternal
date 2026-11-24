import net from 'node:net';
import dns from 'node:dns/promises';

export const ALLOWED_IMAGE_DOMAINS = [
  'battlespirits.com',
  'wikia.nocookie.net',
  'battle-spirits.fandom.com',
  'fandom.com',
  'wikia.com',
  'githubusercontent.com'
];

export function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const cleanIp = ip.toLowerCase().trim();

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith('::ffff:')) {
    const rest = cleanIp.slice(7);
    if (net.isIPv4(rest)) return isPrivateOrReservedIp(rest);
  }

  if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1' || cleanIp === '::') return true;
  // Link-local IPv6 fe80::/10
  if (/^fe[89ab][0-9a-f]:/i.test(cleanIp) || cleanIp.startsWith('fe80:')) return true;
  // Unique local IPv6 fc00::/7 (fc00:: and fd00::)
  if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp)) return true;

  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [b0, b1] = parts;
    if (b0 === 0) return true; // 0.0.0.0/8
    if (b0 === 10) return true; // 10.0.0.0/8
    if (b0 === 127) return true; // 127.0.0.0/8
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 Link-Local / Cloud Metadata
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true; // 100.64.0.0/10 Carrier-grade NAT
    if (b0 >= 224) return true; // 224.0.0.0/4 Multicast & Reserved
    return false;
  }

  return false;
}

export function isAllowedHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase().trim();
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (net.isIP(host)) {
    // Direct IP address in URL: not permitted for image proxy
    return false;
  }
  return ALLOWED_IMAGE_DOMAINS.some(domain => host === domain || host.endsWith('.' + domain));
}

console.log('127.0.0.1 is private:', isPrivateOrReservedIp('127.0.0.1'));
console.log('169.254.169.254 is private:', isPrivateOrReservedIp('169.254.169.254'));
console.log('10.0.0.1 is private:', isPrivateOrReservedIp('10.0.0.1'));
console.log('192.168.1.1 is private:', isPrivateOrReservedIp('192.168.1.1'));
console.log('8.8.8.8 is private:', isPrivateOrReservedIp('8.8.8.8'));
console.log('::1 is private:', isPrivateOrReservedIp('::1'));
console.log('::ffff:127.0.0.1 is private:', isPrivateOrReservedIp('::ffff:127.0.0.1'));
console.log('battlespirits.com is allowed:', isAllowedHost('battlespirits.com'));
console.log('asia-en.battlespirits.com is allowed:', isAllowedHost('asia-en.battlespirits.com'));
console.log('static.wikia.nocookie.net is allowed:', isAllowedHost('static.wikia.nocookie.net'));
console.log('evil.com is allowed:', isAllowedHost('evil.com'));
console.log('localhost is allowed:', isAllowedHost('localhost'));
