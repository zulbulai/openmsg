import { WhatsAppClient } from '@/types/whatsapp';
import { MockWhatsAppClient } from './mock-client';
import { BridgeWhatsAppClient } from './bridge-client';

/**
 * OpenMsg WhatsApp Client Provider
 * Automatically selects BridgeWhatsAppClient on web.whatsapp.com,
 * or MockWhatsAppClient in testing / standalone mode.
 */
function createClient(): WhatsAppClient {
  const isWhatsAppWeb =
    typeof window !== 'undefined' &&
    window.location &&
    window.location.host.includes('web.whatsapp.com');

  if (isWhatsAppWeb) {
    return new BridgeWhatsAppClient();
  }
  return new MockWhatsAppClient();
}

let activeClient: WhatsAppClient = createClient();

export function getWhatsAppClient(): WhatsAppClient {
  return activeClient;
}

export function setWhatsAppClient(client: WhatsAppClient): void {
  activeClient = client;
}
