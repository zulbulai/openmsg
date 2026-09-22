// Where the license server is, and the public key its answers are signed with.
// Written when this copy of the extension was built. The key is this server's, so answers it signs are accepted.

export const LICENSE_SERVER = null;
export const LICENSE_PUBLIC_KEY = null;

// Who this copy was built for. The build identifier goes with every license check, so the server answers with that
// account's current company details. The details themselves are what was true when the copy was built: they show
// before a license is applied, and until the first answer arrives.
export const BUILD_ID = 'OPENMSG-PRO';
export const BUILD_PROVIDER = {
  name: 'OpenMsg Support',
  email: 'support@openmsg.org',
  support_email: 'support@openmsg.org',
  phone: '916306356544',
  whatsapp: '916306356544',
  website: 'https://wa.me/916306356544',
};
