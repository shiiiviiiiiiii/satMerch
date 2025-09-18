"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Minus, ShoppingCart, Package, User, Menu, Edit, X, Lock } from "lucide-react"

import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider("apple.com")

interface CartItem {
  id: string
  name: string
  price: number
  imageUrl: string
  quantity: number
}

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  description: string
}

interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  status: string
  createdAt: Date
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export default function SaturnaliaStore() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("cart")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    description: "",
    imageUrl: "",
  })
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState({ id: "", password: "" })
  const [adminLoginError, setAdminLoginError] = useState("")
  const [currentPage, setCurrentPage] = useState("store") // "store", "checkout", "login"
  const [showUserLogin, setShowUserLogin] = useState(false)
  const [userCredentials, setUserCredentials] = useState({ email: "", password: "" })
  const [userLoginError, setUserLoginError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        setShippingInfo((prev) => ({ ...prev, email: firebaseUser.email || "" }))
        loadUserCart(firebaseUser.uid)
        loadUserOrders(firebaseUser.uid)
      } else {
        setCart([])
        setOrders([])
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsCollection = collection(db, "products")
        const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
          const productsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[]
          setProducts(productsData)
          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error loading products:", error)
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const loadUserCart = async (userId: string) => {
    try {
      const cartCollection = collection(db, "users", userId, "cart")
      const unsubscribe = onSnapshot(cartCollection, (snapshot) => {
        const cartData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CartItem[]
        setCart(cartData)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Error loading cart:", error)
    }
  }

  const loadUserOrders = async (userId: string) => {
    try {
      const ordersCollection = collection(db, "orders")
      const userOrdersQuery = query(ordersCollection, where("userId", "==", userId), orderBy("createdAt", "desc"))
      const unsubscribe = onSnapshot(userOrdersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Order[]
        setOrders(ordersData)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Error loading orders:", error)
    }
  }

  const addToCart = async (product: Product) => {
    if (!user) {
      setShowUserLogin(true)
      return
    }

    try {
      const cartItemRef = doc(db, "users", user.uid, "cart", product.id)
      const cartItemDoc = await getDoc(cartItemRef)

      if (cartItemDoc.exists()) {
        const currentQuantity = cartItemDoc.data().quantity || 0
        await updateDoc(cartItemRef, {
          quantity: currentQuantity + 1,
        })
      } else {
        await setDoc(cartItemRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        })
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const updateCartQuantity = async (id: string, newQuantity: number) => {
    if (!user) return

    try {
      if (newQuantity <= 0) {
        await deleteDoc(doc(db, "users", user.uid, "cart", id))
      } else {
        await updateDoc(doc(db, "users", user.uid, "cart", id), {
          quantity: newQuantity,
        })
      }
    } catch (error) {
      console.error("Error updating cart:", error)
    }
  }

  const removeFromCart = async (id: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, "users", user.uid, "cart", id))
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price > 0) {
      try {
        const productsCollection = collection(db, "products")
        await addDoc(productsCollection, {
          name: newProduct.name,
          price: newProduct.price,
          description: newProduct.description,
          imageUrl: newProduct.imageUrl || `/placeholder.svg?height=300&width=300&query=${newProduct.name}`,
          createdAt: new Date(),
        })
        setNewProduct({ name: "", price: 0, description: "", imageUrl: "" })
      } catch (error) {
        console.error("Error adding product:", error)
      }
    }
  }

  const handleEditProduct = async (product: Product) => {
    try {
      const productRef = doc(db, "products", product.id)
      await updateDoc(productRef, {
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        updatedAt: new Date(),
      })
      setEditingProduct(null)
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id))
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const handleAdminLogin = () => {
    if (adminCredentials.id === "Shivam" && adminCredentials.password === "Saturnalia@2025") {
      setIsAdmin(true)
      setShowAdminLogin(false)
      setAdminCredentials({ id: "", password: "" })
      setAdminLoginError("")
    } else {
      setAdminLoginError("Invalid credentials. Please try again.")
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    setShowAdminPanel(false)
  }

  const validateThaparEmail = (email: string): boolean => {
    return email.endsWith("@thapar.edu")
  }

  const handleUserLogin = async () => {
    try {
      if (!validateThaparEmail(userCredentials.email)) {
        setUserLoginError("Only @thapar.edu email addresses are allowed to login.")
        return
      }
      await signInWithEmailAndPassword(auth, userCredentials.email, userCredentials.password)
      setShowUserLogin(false)
      setUserCredentials({ email: "", password: "" })
      setUserLoginError("")
    } catch (error: any) {
      setUserLoginError(error.message || "Login failed. Please try again.")
    }
  }

  const handleUserRegister = async () => {
    try {
      if (!validateThaparEmail(userCredentials.email)) {
        setUserLoginError("Only @thapar.edu email addresses are allowed to register.")
        return
      }
      await createUserWithEmailAndPassword(auth, userCredentials.email, userCredentials.password)
      setShowUserLogin(false)
      setUserCredentials({ email: "", password: "" })
      setUserLoginError("")
    } catch (error: any) {
      setUserLoginError(error.message || "Registration failed. Please try again.")
    }
  }

  const handleUserLogout = async () => {
    try {
      await signOut(auth)
      setActiveTab("cart")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const proceedToCheckout = () => {
    if (!user) {
      setShowUserLogin(true)
      return
    }
    setCurrentPage("checkout")
  }

  const backToStore = () => {
    setCurrentPage("store")
  }

  const completeOrder = async () => {
    if (!user || cart.length === 0) return

    try {
      // Create order in Firestore
      const ordersCollection = collection(db, "orders")
      await addDoc(ordersCollection, {
        userId: user.uid,
        items: cart,
        total: cartTotal,
        status: "pending",
        createdAt: new Date(),
        shippingInfo: shippingInfo,
        paymentInfo: {
          cardNumber: paymentInfo.cardNumber.slice(-4), // Only store last 4 digits
          cardholderName: paymentInfo.cardholderName,
        },
      })

      // Clear user's cart
      const cartCollection = collection(db, "users", user.uid, "cart")
      const cartSnapshot = await getDocs(cartCollection)
      const deletePromises = cartSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Reset form and go back to store
      setShippingInfo({
        firstName: "",
        lastName: "",
        email: user.email || "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      })
      setPaymentInfo({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: "",
      })
      setCurrentPage("store")
      setActiveTab("orders")

      alert("Order placed successfully!")
    } catch (error) {
      console.error("Error completing order:", error)
      alert("Error placing order. Please try again.")
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      if (!validateThaparEmail(user.email || "")) {
        await signOut(auth)
        setUserLoginError("Only @thapar.edu email addresses are allowed to login.")
        return
      }

      setShowUserLogin(false)
      setUserLoginError("")
    } catch (error: any) {
      setUserLoginError(error.message || "Google sign-in failed. Please try again.")
    }
  }

  const handleAppleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider)
      const user = result.user

      if (!validateThaparEmail(user.email || "")) {
        await signOut(auth)
        setUserLoginError("Only @thapar.edu email addresses are allowed to login.")
        return
      }

      setShowUserLogin(false)
      setUserLoginError("")
    } catch (error: any) {
      setUserLoginError(error.message || "Apple sign-in failed. Please try again.")
    }
  }

  // Loading skeleton component
  const ProductSkeleton = () => (
    <Card className="animate-pulse">
      <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
      <CardContent className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </CardContent>
    </Card>
  )

  const CheckoutPage = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={backToStore}>
            ← Back to Store
          </Button>
          <h2 className="text-2xl font-bold">Checkout</h2>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 text-lg font-bold">
            <span>Total:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={shippingInfo.firstName}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              placeholder="Last Name"
              value={shippingInfo.lastName}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, lastName: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={shippingInfo.email}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={shippingInfo.phone}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="Address"
              className="md:col-span-2"
              value={shippingInfo.address}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, address: e.target.value }))}
            />
            <Input
              placeholder="City"
              value={shippingInfo.city}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, city: e.target.value }))}
            />
            <Input
              placeholder="State"
              value={shippingInfo.state}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, state: e.target.value }))}
            />
            <Input
              placeholder="ZIP Code"
              value={shippingInfo.zipCode}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, zipCode: e.target.value }))}
            />
            <Input
              placeholder="Country"
              value={shippingInfo.country}
              onChange={(e) => setShippingInfo((prev) => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="space-y-4">
            <Input
              placeholder="Card Number"
              value={paymentInfo.cardNumber}
              onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cardNumber: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="MM/YY"
                value={paymentInfo.expiryDate}
                onChange={(e) => setPaymentInfo((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
              <Input
                placeholder="CVV"
                value={paymentInfo.cvv}
                onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cvv: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Cardholder Name"
              value={paymentInfo.cardholderName}
              onChange={(e) => setPaymentInfo((prev) => ({ ...prev, cardholderName: e.target.value }))}
            />
          </div>
        </div>

        <Button
          onClick={completeOrder}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 text-lg"
          disabled={
            !shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.address || !paymentInfo.cardNumber
          }
        >
          Complete Order - ${cartTotal.toFixed(2)}
        </Button>
      </Card>
    </div>
  )

  if (currentPage === "checkout") {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 py-3 px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white font-bold text-xl">Saturnalia Store</h1>
            <div className="flex-1 flex justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-white">
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <ellipse cx="20" cy="20" rx="16" ry="4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <Menu className="text-white w-6 h-6" />
          </div>
        </header>

        <div className="pt-20 p-4">
          <CheckoutPage />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 py-3 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Saturnalia Store</h1>

          {/* Saturn Logo */}
          <div className="flex-1 flex justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" className="text-white">
              <circle cx="20" cy="20" r="8" fill="currentColor" />
              <ellipse cx="20" cy="20" rx="16" ry="4" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserLogin(true)}
                className="text-white hover:bg-gray-700"
              >
                <User className="w-4 h-4 mr-1" />
                Login
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleUserLogout} className="text-white hover:bg-gray-700">
                Logout
              </Button>
            )}
            {!isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminLogin(true)}
                className="text-white hover:bg-gray-700"
              >
                <Lock className="w-4 h-4 mr-1" />
                Admin
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="text-white hover:bg-gray-700">
                Admin Logout
              </Button>
            )}
            <Menu className="text-white w-6 h-6" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - User Dashboard & Cart */}
            <div className="md:col-span-1 order-1 md:order-1">
              <Card className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Hello, {user ? user.email : "Guest"}!</h2>

                  {!user && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">Sign in to save your cart and track orders!</p>
                      <Button
                        size="sm"
                        onClick={() => setShowUserLogin(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Sign In
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant={activeTab === "cart" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setActiveTab("cart")}
                      className="flex items-center gap-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Cart
                    </Button>
                    <Button
                      variant={activeTab === "orders" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setActiveTab("orders")}
                      className="flex items-center gap-1"
                      disabled={!user}
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </Button>
                    <Button
                      variant={activeTab === "account" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setActiveTab("account")}
                      className="flex items-center gap-1"
                      disabled={!user}
                    >
                      <User className="w-4 h-4" />
                      Account
                    </Button>
                  </div>
                </div>

                {/* Cart Display */}
                {activeTab === "cart" && (
                  <div>
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Your cart is empty!</div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        ))}

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Subtotal:</span>
                            <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                          </div>
                          <Button
                            onClick={proceedToCheckout}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            disabled={!user}
                          >
                            {user ? "Proceed to Checkout" : "Sign In to Checkout"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "orders" && (
                  <div>
                    {user ? (
                      orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No orders yet!</div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                  <p className="text-sm text-gray-600">{order.createdAt.toLocaleDateString()}</p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "shipped"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {order.items.length} item(s) - ${order.total.toFixed(2)}
                              </div>
                              <div className="space-y-1">
                                {order.items.map((item, index) => (
                                  <div key={index} className="text-xs text-gray-500">
                                    {item.name} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-500">Please sign in to view orders.</div>
                    )}
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="space-y-4">
                    {user ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">User ID</label>
                          <Input value={user.uid} disabled />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <Input value={user.email || ""} disabled />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">Please sign in to view account details.</div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Products */}
            <div className="md:col-span-2 order-2 md:order-2">
              {isAdmin && (
                <Card className="mb-6 p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-yellow-800">Admin Panel</h3>
                    <Button variant="outline" size="sm" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                      {showAdminPanel ? "Hide" : "Show"} Admin Tools
                    </Button>
                  </div>

                  {showAdminPanel && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Product name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={newProduct.price || ""}
                          onChange={(e) =>
                            setNewProduct((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                      />
                      <Input
                        placeholder="Image URL (optional)"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      />
                      <Button onClick={handleAddProduct} className="w-full">
                        Add Product
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No products available at this time.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="bg-white rounded-lg shadow-md transition-shadow duration-300 hover:shadow-xl"
                    >
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <img
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2 truncate">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-semibold text-gray-700">${product.price.toFixed(2)}</span>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => addToCart(product)}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUserLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{isRegistering ? "Create Account" : "Sign In"}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowUserLogin(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  onClick={handleAppleSignIn}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Continue with Apple
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email (@thapar.edu only)</label>
                  <Input
                    type="email"
                    placeholder="Enter your @thapar.edu email"
                    value={userCredentials.email}
                    onChange={(e) => setUserCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={userCredentials.password}
                    onChange={(e) => setUserCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                {userLoginError && <p className="text-red-500 text-sm">{userLoginError}</p>}
                <Button onClick={isRegistering ? handleUserRegister : handleUserLogin} className="w-full">
                  {isRegistering ? "Create Account" : "Sign In"}
                </Button>
                <div className="text-center">
                  <Button variant="link" onClick={() => setIsRegistering(!isRegistering)} className="text-sm">
                    {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Create one"}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 rounded">
                  <strong>Note:</strong> Only users with @thapar.edu email addresses can access this store.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Admin Login</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAdminLogin(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Admin ID</label>
                  <Input
                    placeholder="Enter admin ID"
                    value={adminCredentials.id}
                    onChange={(e) => setAdminCredentials((prev) => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                {adminLoginError && <p className="text-red-500 text-sm">{adminLoginError}</p>}
                <Button onClick={handleAdminLogin} className="w-full">
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Edit Product</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <Input
                  placeholder="Product name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, price: Number.parseFloat(e.target.value) || 0 } : null,
                    )
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                />
                <Button onClick={() => editingProduct && handleEditProduct(editingProduct)} className="w-full">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
