# Complete Firebase Setup Guide for Saturnalia Store

This guide will walk you through setting up Firebase for your Saturnalia Store application from scratch.

## Prerequisites

- A Google account
- Access to the Firebase Console (https://console.firebase.google.com)
- Your project deployed on Vercel or running locally

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit https://console.firebase.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `saturnalia-store` (or your preferred name)
   - Enable Google Analytics (recommended)
   - Choose your Google Analytics account
   - Click "Create project"

3. **Wait for Setup**
   - Firebase will set up your project (takes 1-2 minutes)
   - Click "Continue" when ready

## Step 2: Configure Authentication

1. **Enable Authentication**
   - In the Firebase Console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Set Up Sign-in Methods**
   - Go to the "Sign-in method" tab
   - Enable the following providers:

   **Email/Password:**
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"

   **Google:**
   - Click "Google"
   - Toggle "Enable"
   - Enter your project support email
   - Click "Save"

   **Apple (Optional):**
   - Click "Apple"
   - Toggle "Enable"
   - You'll need Apple Developer credentials for production
   - For testing, you can skip this initially

3. **Configure Authorized Domains**
   - Go to "Settings" tab in Authentication
   - Add your domains to "Authorized domains":
     - `localhost` (for local development)
     - Your Vercel domain (e.g., `your-app.vercel.app`)
     - Any custom domains you use

## Step 3: Set Up Firestore Database

1. **Create Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Choose Security Rules**
   - Select "Start in test mode" (for development)
   - Click "Next"

3. **Choose Location**
   - Select a location close to your users
   - Click "Done"

4. **Set Up Security Rules**
   - Go to the "Rules" tab
   - Replace the default rules with:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products collection - read for all, write for admin only
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "skumar6_be22@thapar.edu";
    }
    
    // User carts - only the user can access their own cart
    match /users/{userId}/cart/{cartId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders - users can read their own orders, admin can read all
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.email == "skumar6_be22@thapar.edu");
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
\`\`\`

   - Click "Publish"

## Step 4: Set Up Firebase Storage

1. **Create Storage Bucket**
   - Click "Storage" in the left sidebar
   - Click "Get started"
   - Choose "Start in test mode"
   - Select the same location as your Firestore
   - Click "Done"

2. **Configure Storage Rules**
   - Go to the "Rules" tab
   - Replace the default rules with:

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images - read for all, write for admin only
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "skumar6_be22@thapar.edu";
    }
  }
}
\`\`\`

   - Click "Publish"

## Step 5: Get Firebase Configuration

1. **Add Web App**
   - In the Firebase Console, click the gear icon (Project settings)
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Enter app nickname: "Saturnalia Store"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - Copy the Firebase configuration object
   - It should look like this:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
\`\`\`

## Step 6: Configure Environment Variables

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Click "Environment Variables"
   - Add the following variables:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
\`\`\`

2. **For Local Development:**
   - Create a `.env.local` file in your project root
   - Add the same environment variables

## Step 7: Configure Google Sign-In

1. **Get OAuth Client ID**
   - Go to Google Cloud Console: https://console.cloud.google.com
   - Select your Firebase project
   - Go to "APIs & Services" > "Credentials"
   - Find the "Web client" created by Firebase
   - Copy the Client ID

2. **Configure Authorized Origins**
   - Click on the Web client
   - Add to "Authorized JavaScript origins":
     - `http://localhost:3000` (for local development)
     - `https://your-app.vercel.app` (your production domain)
   - Add to "Authorized redirect URIs":
     - `http://localhost:3000/__/auth/handler`
     - `https://your-app.vercel.app/__/auth/handler`
   - Click "Save"

## Step 8: Test Your Setup

1. **Deploy Your App**
   - Push your code to GitHub
   - Deploy to Vercel
   - Make sure all environment variables are set

2. **Test Authentication**
   - Try signing up with a @thapar.edu email
   - Test Google sign-in
   - Verify admin access with skumar6_be22@thapar.edu

3. **Test Database Operations**
   - Add a product as admin
   - Add items to cart as a regular user
   - Place an order
   - Check Firestore console to see data

## Step 9: Production Security (Important!)

1. **Update Firestore Rules**
   - Change from "test mode" to production rules
   - The rules provided in Step 3 are production-ready

2. **Update Storage Rules**
   - Change from "test mode" to production rules
   - The rules provided in Step 4 are production-ready

3. **Enable App Check (Recommended)**
   - Go to "App Check" in Firebase Console
   - Enable reCAPTCHA v3 for web
   - This prevents abuse of your Firebase resources

## Troubleshooting

### Common Issues:

1. **Google Sign-in Popup Blocked**
   - Make sure popup blockers are disabled
   - Check that authorized origins are correctly configured

2. **Permission Denied Errors**
   - Verify Firestore security rules
   - Check that user email matches expected domain (@thapar.edu)

3. **Image Upload Fails**
   - Check Storage security rules
   - Verify admin email is correct
   - Check browser console for detailed errors

4. **Environment Variables Not Working**
   - Make sure all variables start with `NEXT_PUBLIC_`
   - Redeploy after adding environment variables
   - Check Vercel deployment logs

### Debug Steps:

1. **Check Browser Console**
   - Look for Firebase errors
   - Check network requests

2. **Check Firebase Console**
   - Authentication tab: See registered users
   - Firestore tab: Check data structure
   - Storage tab: Verify uploaded files

3. **Check Vercel Logs**
   - Look for build errors
   - Check function logs

## Additional Features You Can Add

1. **Email Verification**
   - Enable in Authentication settings
   - Add verification flow to your app

2. **Password Reset**
   - Already supported by Firebase Auth
   - Add UI for password reset

3. **Admin Dashboard**
   - Create separate admin routes
   - Add order management features

4. **Analytics**
   - Firebase Analytics is already enabled
   - Add custom events for tracking

5. **Push Notifications**
   - Set up Firebase Cloud Messaging
   - Send order updates to users

## Support

If you encounter issues:
1. Check the Firebase documentation: https://firebase.google.com/docs
2. Check the console logs for detailed error messages
3. Verify all configuration steps were completed correctly
4. Test with a fresh browser session to avoid cache issues

Your Saturnalia Store should now be fully functional with Firebase integration!
