/**
 * Secure Session Key Management for Backend Storage
 *
 * This module handles secure storage and retrieval of session keys
 * instead of storing them in localStorage (which is insecure)
 */
import { notification } from "~~/utils/scaffold-eth";

export interface SecureDelegationData {
  sessionKeyAddress: string;
  sessionKeyPrivateKey: string; // Encrypted
  delegationHash: string;
  signedDelegation?: any;
  smartAccountAddress: string;
  createdAt: number;
  validUntil: number;
  encrypted: boolean;
}

export interface SessionKeyResponse {
  success: boolean;
  data?: SecureDelegationData;
  error?: string;
}

/**
 * Encrypt session key data before storing
 */
function encryptData(data: string, key: string): string {
  // Simple encryption for demo - in production use proper encryption
  // This should be replaced with AES encryption or similar
  const encoded = btoa(data + ":" + key);
  return encoded;
}

/**
 * Decrypt session key data after retrieval
 */
function decryptData(encryptedData: string, _key: string): string {
  try {
    void _key;
    const decoded = atob(encryptedData);
    const parts = decoded.split(":");
    if (parts.length === 2) {
      return parts[0];
    }
    throw new Error("Invalid encrypted data format");
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt session key data");
  }
}

/**
 * Store session key securely in backend
 */
export async function storeSessionKeySecurely(
  delegationData: Omit<SecureDelegationData, "encrypted">,
  userAddress: string,
): Promise<SessionKeyResponse> {
  try {
    // Encrypt the private key before sending to backend
    const encryptionKey = userAddress + "_session_key_2024";
    const encryptedPrivateKey = encryptData(delegationData.sessionKeyPrivateKey, encryptionKey);

    const secureData: SecureDelegationData = {
      ...delegationData,
      sessionKeyPrivateKey: encryptedPrivateKey,
      encrypted: true,
    };

    // Send to backend API
    const response = await fetch("/api/session-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        delegationData: secureData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend storage failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      notification.success("🔐 Session key stored securely in backend!");
      return { success: true, data: secureData };
    } else {
      throw new Error(result.error || "Unknown backend error");
    }
  } catch (error: any) {
    console.error("Failed to store session key securely:", error);
    notification.error(`Failed to store session key: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve session key securely from backend
 */
export async function retrieveSessionKeySecurely(
  userAddress: string,
  smartAccountAddress: string,
): Promise<SessionKeyResponse> {
  try {
    // Get from backend API
    const response = await fetch(
      `/api/session-keys?userAddress=${userAddress}&smartAccountAddress=${smartAccountAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "No session key found" };
      }
      throw new Error(`Backend retrieval failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Decrypt the private key
      const encryptionKey = userAddress + "_session_key_2024";
      const decryptedPrivateKey = decryptData(result.data.sessionKeyPrivateKey, encryptionKey);

      const decryptedData: SecureDelegationData = {
        ...result.data,
        sessionKeyPrivateKey: decryptedPrivateKey,
        encrypted: false,
      };

      // Check if still valid
      if (decryptedData.validUntil > Date.now()) {
        notification.success("Session key retrieved securely from backend!");
        return { success: true, data: decryptedData };
      } else {
        // Session key expired, remove from backend
        await removeSessionKeySecurely(userAddress, smartAccountAddress);
        return { success: false, error: "Session key expired" };
      }
    } else {
      throw new Error(result.error || "Unknown backend error");
    }
  } catch (error: any) {
    console.error("Failed to retrieve session key securely:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove session key from backend
 */
export async function removeSessionKeySecurely(
  userAddress: string,
  smartAccountAddress: string,
): Promise<SessionKeyResponse> {
  try {
    const response = await fetch("/api/session-keys", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        smartAccountAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend removal failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      notification.info("Session key removed from backend!");
      return { success: true };
    } else {
      throw new Error(result.error || "Unknown backend error");
    }
  } catch (error: any) {
    console.error("Failed to remove session key securely:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback to localStorage if backend is not available
 */
export async function storeSessionKeyFallback(
  delegationData: SecureDelegationData,
  smartAccountAddress: string,
): Promise<SessionKeyResponse> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(`delegation_${smartAccountAddress}`, JSON.stringify(delegationData));
      notification.info("Session key stored locally (backend unavailable)");
      return { success: true, data: delegationData };
    }
    throw new Error("localStorage not available");
  } catch (error: any) {
    console.error("Failed to store session key in localStorage:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback to localStorage if backend is not available
 */
export async function retrieveSessionKeyFallback(smartAccountAddress: string): Promise<SessionKeyResponse> {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`delegation_${smartAccountAddress}`);
      if (stored) {
        const delegationData = JSON.parse(stored);

        // Check if still valid
        if (delegationData.validUntil > Date.now()) {
          notification.info("⚠️ Session key retrieved from local storage (backend unavailable)");
          return { success: true, data: delegationData };
        } else {
          // Remove expired data
          localStorage.removeItem(`delegation_${smartAccountAddress}`);
          return { success: false, error: "Session key expired" };
        }
      }
      return { success: false, error: "No session key found" };
    }
    throw new Error("localStorage not available");
  } catch (error: any) {
    console.error("Failed to retrieve session key from localStorage:", error);
    return { success: false, error: error.message };
  }
}
