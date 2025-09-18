# Saturnalia Store Backend Setup Guide

## Overview
This guide will help you set up a complete backend for your Saturnalia Store using Firebase. The backend will handle user authentication, product management, order processing, and admin functionality.

## 1. Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "saturnalia-store"
4. Enable Google Analytics (optional)
5. Create the project

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Optionally enable "Google" for social login

### Step 3: Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select your preferred location
5. Click "Done"

### Step 4: Enable Storage
1. Go to "Storage"
2. Click "Get started"
3. Accept the default security rules
4. Choose the same location as Firestore

## 2. Database Structure

### Collections Overview
\`\`\`
/products (collection)
  /{productId} (document)
    - name: string
    - price: number
    - description: string
    - imageUrl: string
    - category: string
    - stock: number
    - createdAt: timestamp
    - updatedAt: timestamp

/users (collection)
  /{userId} (document)
    - email: string
    - displayName: string
    - createdAt: timestamp
    - isAdmin: boolean (for admin users)
    
    /cart (subcollection)
      /{productId} (document)
        - productId: string
        - name: string
        - price: number
        - imageUrl: string
        - quantity: number
        - addedAt: timestamp

/orders (collection)
  /{orderId} (document)
    - userId: string
    - userEmail: string
    - items: array of objects
    - totalAmount: number
    - status: string (pending, processing, shipped, delivered, cancelled)
    - shippingAddress: object
    - paymentMethod: string
    - createdAt: timestamp
    - updatedAt: timestamp

/admin (collection)
  /settings (document)
    - storeSettings: object
    - adminUsers: array of user IDs
\`\`\`

## 3. Security Rules

### Firestore Security Rules
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Users - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Cart subcollection
      match /cart/{productId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Orders - users can read their own orders, admins can read all
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update: if isAdmin();
    }
    
    // Admin collection - admin only
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
\`\`\`

### Storage Security Rules
\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images - public read, admin write
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // User uploads - authenticated users only
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
\`\`\`

## 4. Environment Variables

Create a `.env.local` file in your project root:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration
FIREBASE_ADMIN_PRIVATE_KEY=your_admin_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_client_email

# Stripe Configuration (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
\`\`\`

## 5. Cloud Functions for Admin Management

### Setting Admin Claims
\`\`\`javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Function to set admin claims
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set admin claims.'
    );
  }

  const { uid } = data;
  
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { message: `Admin claim set for user ${uid}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to process orders
exports.processOrder = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Send confirmation email
    // Update inventory
    // Process payment
    
    console.log('New order processed:', context.params.orderId);
  });
\`\`\`

## 6. Integration Steps

### Step 1: Install Dependencies
\`\`\`bash
npm install firebase
npm install @stripe/stripe-js stripe
\`\`\`

### Step 2: Create Firebase Config
Create `lib/firebase.js`:
\`\`\`javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
\`\`\`

### Step 3: Replace Mock Functions
Replace the mock functions in your main component with real Firebase calls:

1. **Authentication**: Use `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
2. **Products**: Use `collection(db, 'products')` with `onSnapshot` for real-time updates
3. **Cart**: Use user-specific subcollections
4. **Orders**: Create order documents in Firestore

## 7. Admin Dashboard Features

### Order Management
- View all orders with filtering and sorting
- Update order status
- Export order data
- Customer communication

### Product Management
- CRUD operations for products
- Image upload to Firebase Storage
- Inventory tracking
- Category management

### User Management
- View registered users
- Set admin privileges
- User activity tracking

### Analytics
- Sales reports
- Popular products
- User engagement metrics

## 8. Payment Integration

### Stripe Setup
1. Create Stripe account
2. Get API keys
3. Set up webhooks for order confirmation
4. Implement payment processing in checkout

### Payment Flow
1. User completes checkout form
2. Create Stripe payment intent
3. Process payment on client
4. Confirm payment on server
5. Create order in Firestore
6. Send confirmation email

## 9. Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy the application

### Firebase Hosting (Alternative)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy: `firebase deploy`

## 10. Monitoring and Analytics

### Firebase Analytics
- Track user behavior
- Monitor app performance
- A/B testing capabilities

### Error Monitoring
- Set up Sentry or similar service
- Monitor Firebase errors
- Track payment failures

This setup provides a complete, scalable backend for your Saturnalia Store with real-time updates, secure authentication, and comprehensive admin functionality.
