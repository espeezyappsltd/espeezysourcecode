# Supabase Phone Authentication Setup Guide

This guide provides step-by-step instructions to resolve the "unsupported phone provider" error and successfully implement SMS-based login for Espeezy.

## 1. Local Development: Use "Test Phone Numbers" (Zero Cost)
Supabase provides a built-in way to test phone authentication without actually sending an SMS or paying for a provider like Twilio.

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** -> **Providers** -> **Phone**.
3.  Scroll down to **Phone OTP Test Numbers**.
4.  Add a test phone number (e.g., `+15550001234`) and a fixed verification code (e.g., `123456`).
5.  Save changes.
6.  You can now log in with that number and code immediately!

## 2. Production: Configuring Twilio
To send real SMS messages to users, you must configure a third-party provider. Twilio is the most common integration.

### Steps in Twilio Console:
1.  Sign up at [Twilio.com](https://www.twilio.com).
2.  Get your **Account SID** and **Auth Token** from the Console Dashboard.
3.  Obtain a **Twilio Phone Number** or create a **Messaging Service**.

### Steps in Supabase Dashboard:
1.  Navigate to **Authentication** -> **Providers** -> **Phone**.
2.  Enable the **Phone Provider**.
3.  Select **Twilio** from the SMS Provider dropdown.
4.  Enter your:
    - `Twilio Account SID`
    - `Twilio Auth Token`
    - `Twilio Message Service SID` (or phone number).
5.  Click **Save**.

## 3. Common Error: "unsupported phone provider"
If you see this error, it means you have enabled Phone Auth in the Supabase Dashboard but **have not yet configured any SMS provider credentials** (or added test numbers). 

Follow the steps in Section 1 (for dev) or Section 2 (for prod) to resolve this instantly.

---

> [!TIP]
> **Regulatory Notice**: If sending SMS to the USA or Canada, ensure your Twilio phone number is registered (A2P 10DLC) to avoid carrier filtering. For global testing, Supabase Test Numbers are always the most reliable starting point.
