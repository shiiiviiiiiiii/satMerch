# Saturnalia Fest Merch Store - Setup Instructions

## Firebase Setup

Your store is now fully integrated with Firebase! Here's what you need to do to get it running:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "Saturnalia Store"
3. Enable Authentication and Firestore Database

### 2. Configure Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable other providers (Google, Facebook, etc.)

### 3. Setup Firestore Database
1. Go to Firestore Database in Firebase Console
2. Create database in production mode
3. The app will automatically create collections as needed:
   - `products` - Store product information
   - `users/{userId}/cart` - User shopping carts
   - `orders` - Completed orders

### 4. Add Sample Products
You can add products through the admin panel, or manually add them in Firestore:

\`\`\`javascript
// Sample product document structure
{
  name: "Saturnalia Festival T-Shirt",
  price: 29.99,
  description: "Celebrate the ancient Roman festival with this premium cotton tee",
  imageUrl: "/saturn-festival-t-shirt.jpg",
  createdAt: new Date()
}
\`\`\`

### 5. Admin Access
- Admin ID: `Shivam`
- Admin Password: `Saturnalia@2025`

### 6. Features Available
- ✅ User registration and login with Firebase Auth
- ✅ Real-time shopping cart with Firestore
- ✅ Product management (admin only)
- ✅ Order placement and tracking
- ✅ Responsive design
- ✅ Secure admin panel

### 7. Firestore Security Rules
The app uses secure Firestore rules:
- Users can only access their own cart and orders
- Products are publicly readable
- Only authenticated users can place orders
- Admin functions require proper authentication

### 8. Order Management
Orders are stored in the `orders` collection with:
- User information
- Order items and totals
- Shipping information
- Order status (pending, shipped, completed)
- Timestamps

### 9. Next Steps
1. Customize the product images and descriptions
2. Set up payment processing (Stripe, PayPal, etc.)
3. Add email notifications for orders
4. Implement inventory management
5. Add product categories and search

Your Saturnalia Fest Merch Store is now ready to use with full Firebase integration!
