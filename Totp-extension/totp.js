// TOTP Generator Implementation
// Based on RFC 6238 (TOTP) and RFC 4226 (HOTP)

class TOTP {
  constructor() {
    this.DIGITS_POWER = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
  }

  // Convert base32 to hex
  base32ToHex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";
    
    // Clean and uppercase the base32 string
    base32 = base32.replace(/=+$/, '').toUpperCase();
    
    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32.charAt(i));
      if (val === -1) throw new Error('Invalid base32 character');
      bits += val.toString(2).padStart(5, '0');
    }
    
    for (let i = 0; i + 4 <= bits.length; i += 4) {
      const chunk = bits.substr(i, 4);
      hex += parseInt(chunk, 2).toString(16);
    }
    
    return hex;
  }

  // Generate HMAC-SHA1 (for Chrome extension, we use crypto.subtle)
  async hmacSha1(key, message) {
    // Convert hex key to ArrayBuffer
    const keyBytes = new Uint8Array(key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Convert message to ArrayBuffer
    const msgBytes = new TextEncoder().encode(message);
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
    
    // Convert ArrayBuffer to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate TOTP code
  async generateTOTP(secret, timeStep = 30, digits = 6) {
    try {
      // Convert base32 secret to hex
      const hexSecret = this.base32ToHex(secret);
      
      // Calculate counter (current time / timeStep)
      const counter = Math.floor(Date.now() / 1000 / timeStep);
      
      // Convert counter to hex (8 bytes)
      const hexCounter = counter.toString(16).padStart(16, '0');
      
      // Generate HMAC-SHA1
      const hmac = await this.hmacSha1(hexSecret, hexCounter.match(/.{2}/g).map(hex => String.fromCharCode(parseInt(hex, 16))).join(''));
      
      // Get offset
      const offset = parseInt(hmac.substr(-1), 16);
      
      // Extract 4-byte dynamic binary code
      const binary = 
        ((parseInt(hmac.substr(offset * 2, 2), 16) & 0x7f) << 24) |
        (parseInt(hmac.substr(offset * 2 + 2, 2), 16) << 16) |
        (parseInt(hmac.substr(offset * 2 + 4, 2), 16) << 8) |
        parseInt(hmac.substr(offset * 2 + 6, 2), 16);
      
      // Generate code with specified digits
      const otp = binary % this.DIGITS_POWER[digits];
      
      return otp.toString().padStart(digits, '0');
    } catch (error) {
      console.error('Error generating TOTP:', error);
      return 'ERROR';
    }
  }

  // Get time remaining until next code
  getTimeRemaining(timeStep = 30) {
    const currentTime = Math.floor(Date.now() / 1000);
    return timeStep - (currentTime % timeStep);
  }

  // Validate if a code is correct (for future verification features)
  async validateTOTP(secret, code, window = 1, timeStep = 30, digits = 6) {
    const expectedCode = await this.generateTOTP(secret, timeStep, digits);
    return code === expectedCode;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOTP;
}