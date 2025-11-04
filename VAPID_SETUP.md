# VAPID Keys Setup for Push Notifications

## Problem
The build was failing because placeholder VAPID keys were being used, which are invalid.

## Solution
The code now:
1. ✅ Reads VAPID keys from environment variables
2. ✅ Validates keys before initializing webpush
3. ✅ Returns proper error if keys are not configured
4. ✅ Handles missing keys gracefully

## Setup Instructions

### 1. Generate VAPID Keys

Install web-push globally (if not already installed):
```bash
npm install -g web-push
```

Generate VAPID keys:
```bash
web-push generate-vapid-keys
```

This will output something like:
```
Public Key: BKxX... (long base64 string)
Private Key: 8xYz... (long base64 string)
```

### 2. Add to Environment Variables

Create or update your `.env.local` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:your-email@example.com
```

**Important:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public key (safe to expose in client)
- `VAPID_PRIVATE_KEY` - Private key (server-side only, never expose)
- `VAPID_EMAIL` - Contact email for VAPID (format: `mailto:email@example.com`)

### 3. Restart Your Server

After adding environment variables:
```bash
npm run dev
# or
npm run build
```

## Verification

### Check if VAPID is Configured

The API route will now:
- Return `503` status if VAPID keys are not configured
- Return proper error message explaining the issue
- Only initialize webpush if valid keys are provided

### Test the Endpoint

```bash
curl -X POST http://localhost:3000/api/send-push \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test notification", "userId": "user-id"}'
```

**If keys are missing:**
```json
{
  "error": "Push notifications not configured. Please set VAPID keys in environment variables.",
  "configured": false
}
```

**If keys are valid:**
```json
{
  "ok": true,
  "sent": 1,
  "total": 1
}
```

## Security Notes

1. ✅ Private key is **never** exposed to the client
2. ✅ Public key is safe to use in client-side code
3. ✅ Keys are read from environment variables (not hardcoded)
4. ✅ Invalid keys are caught and handled gracefully

## Troubleshooting

### Error: "Vapid public key should be 65 bytes long"
- **Cause:** Invalid or placeholder VAPID key
- **Solution:** Generate new keys using `web-push generate-vapid-keys`

### Error: "Push notifications not configured"
- **Cause:** Environment variables not set
- **Solution:** Add VAPID keys to `.env.local` and restart server

### Error: "Failed to set VAPID details"
- **Cause:** Keys format is incorrect
- **Solution:** Ensure keys are base64-encoded strings (from web-push tool)

## Files Modified

- ✅ `src/app/api/send-push/route.ts` - Now uses environment variables and validates keys

