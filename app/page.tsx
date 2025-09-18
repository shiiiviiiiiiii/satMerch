"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Minus, ShoppingCart, Package, User, Menu, Edit, X, Lock } from "lucide-react"

// Mock Firebase-like functionality for demo
const mockProducts = [
  {
    id: "1",
    name: "Saturnalia Festival T-Shirt",
    price: 29.99,
    imageUrl: "/saturn-festival-t-shirt.jpg",
    description: "Celebrate the ancient Roman festival with this premium cotton tee",
  },
  {
    id: "2",
    name: "Saturn Ring Hoodie",
    price: 49.99,
    imageUrl: "/saturn-ring-hoodie.jpg",
    description: "Cozy hoodie featuring Saturn's iconic rings",
  },
  {
    id: "3",
    name: "Saturnalia Mug",
    price: 19.99,
    imageUrl: "/saturn-ceramic-mug.jpg",
    description: "Start your day with this celestial ceramic mug",
  },
  {
    id: "4",
    name: "Festival Poster",
    price: 24.99,
    imageUrl: "/saturnalia-festival-poster.jpg",
    description: "Limited edition festival poster",
  },
  {
    id: "5",
    name: "Saturn Enamel Pin",
    price: 12.99,
    imageUrl: "/saturn-enamel-pin.jpg",
    description: "Collectible enamel pin with Saturn design",
  },
  {
    id: "6",
    name: "Saturnalia Tote Bag",
    price: 22.99,
    imageUrl: "/saturn-tote-bag.jpg",
    description: "Eco-friendly canvas tote bag",
  },
]

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

export default function SaturnaliaStore() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
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

  // Simulate Firebase initialization and data loading
  useEffect(() => {
    const initializeStore = async () => {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProducts(mockProducts)
      setLoading(false)
    }

    initializeStore()
  }, [])

  // Cart management functions
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1,
          },
        ]
      }
    })
  }

  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
    } else {
      setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  // Admin functions
  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      const product: Product = {
        id: Date.now().toString(),
        ...newProduct,
        imageUrl: newProduct.imageUrl || `/placeholder.svg?height=300&width=300&query=${newProduct.name}`,
      }
      setProducts((prev) => [...prev, product])
      setNewProduct({ name: "", price: 0, description: "", imageUrl: "" })
    }
  }

  const handleEditProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
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

  // User authentication functions
  const handleUserLogin = () => {
    // Mock login validation - in real app, this would connect to Firebase Auth
    if (userCredentials.email && userCredentials.password) {
      const mockUser = {
        uid: `user-${Date.now()}`,
        email: userCredentials.email,
      }
      setUser(mockUser)
      setShowUserLogin(false)
      setUserCredentials({ email: "", password: "" })
      setUserLoginError("")
    } else {
      setUserLoginError("Please enter both email and password.")
    }
  }

  const handleUserRegister = () => {
    // Mock registration - in real app, this would connect to Firebase Auth
    if (userCredentials.email && userCredentials.password) {
      const mockUser = {
        uid: `user-${Date.now()}`,
        email: userCredentials.email,
      }
      setUser(mockUser)
      setShowUserLogin(false)
      setUserCredentials({ email: "", password: "" })
      setUserLoginError("")
    } else {
      setUserLoginError("Please enter both email and password.")
    }
  }

  const handleUserLogout = () => {
    setUser(null)
    setCart([])
    setActiveTab("cart")
  }

  const proceedToCheckout = () => {
    setCurrentPage("checkout")
  }

  const backToStore = () => {
    setCurrentPage("store")
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
            <Input placeholder="First Name" />
            <Input placeholder="Last Name" />
            <Input placeholder="Email" value={user?.email || ""} />
            <Input placeholder="Phone" className="md:col-span-2" />
            <Input placeholder="Address" className="md:col-span-2" />
            <Input placeholder="City" />
            <Input placeholder="State" />
            <Input placeholder="ZIP Code" />
            <Input placeholder="Country" />
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="space-y-4">
            <Input placeholder="Card Number" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVV" />
            </div>
            <Input placeholder="Cardholder Name" />
          </div>
        </div>

        <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 text-lg">
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
                  <div className="text-center py-8 text-gray-500">
                    {user ? "No orders yet!" : "Please sign in to view orders."}
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
                          <Input value={user.email} disabled />
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
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
