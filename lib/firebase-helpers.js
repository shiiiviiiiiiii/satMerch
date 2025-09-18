// Firebase Helper Functions
// Utility functions for common Firebase operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "./firebase-config"

// Authentication helpers
export const authHelpers = {
  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  },

  // Register new user
  register: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document in Firestore
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        isAdmin: false,
      })

      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth)
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback)
  },
}

// Product helpers
export const productHelpers = {
  // Get all products
  getAllProducts: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"))
      const products = []
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() })
      })
      return { products, error: null }
    } catch (error) {
      return { products: [], error: error.message }
    }
  },

  // Listen to products in real-time
  onProductsChange: (callback) => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"))
    return onSnapshot(q, (querySnapshot) => {
      const products = []
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() })
      })
      callback(products)
    })
  },

  // Add new product (admin only)
  addProduct: async (productData) => {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { id: docRef.id, error: null }
    } catch (error) {
      return { id: null, error: error.message }
    }
  },

  // Update product (admin only)
  updateProduct: async (productId, productData) => {
    try {
      await updateDoc(doc(db, "products", productId), {
        ...productData,
        updatedAt: serverTimestamp(),
      })
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Delete product (admin only)
  deleteProduct: async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId))
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },
}

// Cart helpers
export const cartHelpers = {
  // Get user's cart
  getUserCart: async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "cart"))
      const cartItems = []
      querySnapshot.forEach((doc) => {
        cartItems.push({ id: doc.id, ...doc.data() })
      })
      return { cartItems, error: null }
    } catch (error) {
      return { cartItems: [], error: error.message }
    }
  },

  // Listen to cart changes in real-time
  onCartChange: (userId, callback) => {
    const q = query(collection(db, "users", userId, "cart"))
    return onSnapshot(q, (querySnapshot) => {
      const cartItems = []
      querySnapshot.forEach((doc) => {
        cartItems.push({ id: doc.id, ...doc.data() })
      })
      callback(cartItems)
    })
  },

  // Add item to cart
  addToCart: async (userId, productData) => {
    try {
      const cartRef = doc(db, "users", userId, "cart", productData.id)
      const cartDoc = await getDoc(cartRef)

      if (cartDoc.exists()) {
        // Update quantity if item already exists
        await updateDoc(cartRef, {
          quantity: cartDoc.data().quantity + 1,
        })
      } else {
        // Add new item to cart
        await updateDoc(cartRef, {
          productId: productData.id,
          name: productData.name,
          price: productData.price,
          imageUrl: productData.imageUrl,
          quantity: 1,
          addedAt: serverTimestamp(),
        })
      }
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Update cart item quantity
  updateCartQuantity: async (userId, productId, quantity) => {
    try {
      if (quantity <= 0) {
        await deleteDoc(doc(db, "users", userId, "cart", productId))
      } else {
        await updateDoc(doc(db, "users", userId, "cart", productId), {
          quantity: quantity,
        })
      }
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Remove item from cart
  removeFromCart: async (userId, productId) => {
    try {
      await deleteDoc(doc(db, "users", userId, "cart", productId))
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Clear entire cart
  clearCart: async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, "users", userId, "cart"))
      const deletePromises = []
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref))
      })
      await Promise.all(deletePromises)
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },
}

// Order helpers
export const orderHelpers = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { orderId: docRef.id, error: null }
    } catch (error) {
      return { orderId: null, error: error.message }
    }
  },

  // Get user's orders
  getUserOrders: async (userId) => {
    try {
      const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const orders = []
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() })
      })
      return { orders, error: null }
    } catch (error) {
      return { orders: [], error: error.message }
    }
  },

  // Get all orders (admin only)
  getAllOrders: async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const orders = []
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() })
      })
      return { orders, error: null }
    } catch (error) {
      return { orders: [], error: error.message }
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: status,
        updatedAt: serverTimestamp(),
      })
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },
}

// Storage helpers
export const storageHelpers = {
  // Upload image
  uploadImage: async (file, path) => {
    try {
      const storageRef = ref(storage, path)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return { url: downloadURL, error: null }
    } catch (error) {
      return { url: null, error: error.message }
    }
  },
}
