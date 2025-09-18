# Saturnalia Fest Merch Store

A comprehensive single-file HTML web application for the Saturnalia Fest merchandise store, built with Firebase backend integration.

## Features

### Frontend
- **Responsive Design**: Mobile-first design that adapts seamlessly across devices
- **Modern UI**: Clean, Saturn-themed design with gold accents and professional layout
- **Real-time Updates**: Shopping cart updates in real-time using Firestore listeners
- **Loading States**: Skeleton loaders and spinners for better UX
- **Error Handling**: Graceful error handling with user-friendly messages

### Backend (Firebase)
- **Authentication**: Anonymous and custom token authentication
- **Firestore Database**: Real-time database for products, users, and cart data
- **Security Rules**: Comprehensive security rules for data protection
- **Admin System**: Role-based access control with custom claims

### User Features
- Browse products with responsive grid layout
- Add items to cart with quantity management
- Real-time cart updates and total calculation
- User-specific cart persistence
- Checkout process (placeholder for payment integration)

### Admin Features
- Product management (CRUD operations)
- Order management and status updates
- Secure admin panel with role-based access
- Real-time product updates

## Setup Instructions

### 1. Firebase Configuration
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Anonymous and Custom Token)
3. Enable Firestore Database
4. Enable Storage (optional, for image uploads)
5. Replace the `firebaseConfig` object in `index.html` with your project's config

### 2. Firestore Security Rules
Deploy the security rules from `firestore.rules`:
\`\`\`bash
firebase deploy --only firestore:rules
\`\`\`

### 3. Storage Security Rules (Optional)
Deploy the storage rules from `storage.rules`:
\`\`\`bash
firebase deploy --only storage
\`\`\`

### 4. Cloud Functions (Optional)
Deploy the cloud functions from `cloud-functions.js`:
\`\`\`bash
firebase deploy --only functions
\`\`\`

### 5. Admin Setup
To set up admin users, you'll need to use the Firebase Admin SDK or Cloud Functions:
\`\`\`javascript
// Using Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
\`\`\`

## Database Schema

### Products Collection
\`\`\`javascript
{
  name: string,
  price: number,
  description: string,
  imageUrl: string,
  inventory: number, // optional
  createdAt: timestamp
}
\`\`\`

### Users Collection
\`\`\`javascript
{
  // User document with UID as document ID
  cart: { // subcollection
    [productId]: {
      productId: string,
      name: string,
      price: number,
      imageUrl: string,
      quantity: number
    }
  },
  orders: { // subcollection
    [orderId]: {
      items: array,
      total: number,
      status: string,
      createdAt: timestamp
    }
  }
}
\`\`\`

## Customization

### Styling
The application uses custom CSS variables for theming. Update the `:root` section in the `<style>` tag to customize colors:

\`\`\`css
:root {
  --primary: #ffd700; /* Saturn gold */
  --foreground: #4b5563; /* Dark gray */
  --background: #ffffff; /* White */
  /* ... other variables */
}
\`\`\`

### Adding Products
Products can be added through the admin panel or directly in Firestore. Sample products:

\`\`\`javascript
// Add to Firestore products collection
{
  name: "Saturnalia Festival T-Shirt",
  price: 24.99,
  description: "Official Saturnalia Fest merchandise",
  imageUrl: "https://example.com/tshirt.jpg"
}
\`\`\`

## Security Considerations

1. **Authentication**: Users are authenticated anonymously by default
2. **Authorization**: Admin features require custom claims
3. **Data Access**: Users can only access their own cart and order data
4. **Product Management**: Only admins can create, update, or delete products
5. **Input Validation**: Client-side validation with server-side security rules

## Browser Compatibility

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Performance Optimizations

- Lazy loading of images
- Efficient Firestore queries with proper indexing
- Real-time listeners only for necessary data
- Skeleton loading states for better perceived performance

## Future Enhancements

- Payment integration (Stripe, PayPal)
- Email notifications for orders
- Product search and filtering
- User reviews and ratings
- Inventory management
- Analytics and reporting
