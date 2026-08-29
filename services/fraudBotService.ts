
// FraudBot: Advanced Risk Analysis with Device Fingerprinting, IP Subnet Checking & Collusion Prevention
export const FraudBot = {
  // Analyze user behavior, device fingerprinting, and collusion risk
  analyzeRisk: async (data: {
    ipAddress: string;
    userAgent: string;
    deviceId: string;
    paymentMethod: any;
    buyerId?: string;
    sellerId?: string;
    sellerIp?: string;
    sellerDeviceId?: string;
  }): Promise<{ isFraudulent: boolean; riskScore: number; reason: string[] }> => {
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Collusion & Self-Dealing Check (Buyer and Seller are the same or share identifiers)
    if (data.buyerId && data.sellerId && data.buyerId === data.sellerId) {
      reasons.push("Collusion Detected: Buyer and Seller IDs are identical (Self-Dealing prohibited).");
      riskScore += 100;
    }

    // 2. Device Fingerprint Matching between Buyer and Seller
    if (data.deviceId && data.sellerDeviceId && data.deviceId === data.sellerDeviceId && data.deviceId !== 'unknown') {
      reasons.push("Collusion Detected: Matching Device Fingerprint between Buyer and Seller.");
      riskScore += 90;
    }

    // 3. IP Subnet Checking (Detecting same network / VPN / local subnet collusion)
    if (data.ipAddress && data.sellerIp) {
      const buyerSubnet = data.ipAddress.split('.').slice(0, 3).join('.');
      const sellerSubnet = data.sellerIp.split('.').slice(0, 3).join('.');
      if (buyerSubnet === sellerSubnet && buyerSubnet !== '127.0.0') {
        reasons.push("Collusion Detected: Buyer and Seller share the same IP Subnet.");
        riskScore += 80;
      }
    }

    // 4. IP / VPN Detection
    if (data.ipAddress.startsWith("10.0.") || data.ipAddress === "127.0.0.1") {
        reasons.push("Suspicious IP origin");
        riskScore += 30;
    }
    
    // 5. User Agent Check
    if (!data.userAgent || data.userAgent.length < 10) {
        reasons.push("Invalid or missing User Agent");
        riskScore += 20;
    }

    // 6. Payment Risk Check
    if (!data.paymentMethod) {
        reasons.push("Missing payment details");
        riskScore += 30;
    }

    return {
      isFraudulent: riskScore >= 70,
      riskScore,
      reason: reasons
    };
  }
};

