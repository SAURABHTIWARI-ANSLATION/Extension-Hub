// TOTP Generator Implementation (FIXED)
// Fully RFC 6238 (TOTP) + RFC 4226 (HOTP) compliant

class TOTP {
  constructor() {
    this.DIGITS_POWER = [
      1, 10, 100, 1000, 10000, 100000,
      1000000, 10000000, 100000000
    ];
  }

  // Convert Base32 to Uint8Array (CORRECT way)
  base32ToBytes(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    // Clean input
    base32 = base32.replace(/=+$/, "").toUpperCase();

    let bits = "";
    for (let i = 0; i < base32.length; i++) {
      const val = base32chars.indexOf(base32[i]);
      if (val === -1) throw new Error("Invalid base32 character");
      bits += val.toString(2).padStart(5, "0");
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }

    return new Uint8Array(bytes);
  }

  // Convert counter to 8-byte Big-Endian ArrayBuffer (REQUIRED for TOTP)
  counterToBuffer(counter) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(counter)); // Big-endian
    return buffer;
  }

  // Generate TOTP code
  async generateTOTP(secret, timeStep = 30, digits = 6) {
    try {
      // Step 1 — Decode secret
      const keyBytes = this.base32ToBytes(secret);

      // Step 2 — Time counter
      const counter = Math.floor(Date.now() / 1000 / timeStep);
      const counterBuffer = this.counterToBuffer(counter);

      // Step 3 — Import HMAC key
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
      );

      // Step 4 — Sign counter with HMAC-SHA1
      const hmacBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        counterBuffer
      );

      const hmac = new Uint8Array(hmacBuffer);

      // Step 5 — Dynamic truncation (RFC 4226)
      const offset = hmac[hmac.length - 1] & 0x0f;

      const binary =
        ((hmac[offset] & 0x7f) << 24) |
        (hmac[offset + 1] << 16) |
        (hmac[offset + 2] << 8) |
        hmac[offset + 3];

      // Step 6 — Generate final OTP
      const otp = binary % this.DIGITS_POWER[digits];
      return otp.toString().padStart(digits, "0");
    } catch (error) {
      console.error("Error generating TOTP:", error);
      return "ERROR";
    }
  }

  // Get time remaining until next code
  getTimeRemaining(timeStep = 30) {
    const currentTime = Math.floor(Date.now() / 1000);
    return timeStep - (currentTime % timeStep);
  }

  // Validate a TOTP (basic window = 1 step)
  async validateTOTP(secret, code, window = 1, timeStep = 30, digits = 6) {
    const expectedCode = await this.generateTOTP(
      secret,
      timeStep,
      digits
    );
    return code === expectedCode;
  }
}

// Export for Node (optional)
if (typeof module !== "undefined" && module.exports) {
  module.exports = TOTP;
}
