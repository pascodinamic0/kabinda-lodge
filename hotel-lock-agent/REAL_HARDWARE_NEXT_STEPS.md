# Hotel Lock Agent - Real Hardware Setup

## Status: Ready for Protocol Implementation

The agent has been stripped of "demo" logic and is configured to use native USB drivers (`node-hid`). 

### Current State
1. **Native Drivers**: Configured to build automatically on Windows (`npm install` triggers `electron-builder install-app-deps`).
2. **Mocking**: Disabled. The agent will now look for physical USB devices.
3. **Missing Piece**: The specific binary commands (APDU) to talk to your specific encoder.

### Next Steps for Implementation

To finish the integration, we need to populate `src/main/encoder.ts` with the correct commands.

**Please provide:**
1. **Encoder Model**: (e.g., ACR122U, Omnikey 5422, etc.)
2. **Card Type**: (e.g., MIFARE Classic 1K, Ultralight, DESFire)

Once provided, we will update the following methods:

```typescript
// src/main/encoder.ts

private async detectCard(): Promise<string | null> {
  // We will add the specific command here
  // Example for ACR122U: [0xFF, 0xCA, 0x00, 0x00, 0x00]
}

private async writeCardData(data: any): Promise<void> {
  // We will add the authentication and write commands here
}
```

