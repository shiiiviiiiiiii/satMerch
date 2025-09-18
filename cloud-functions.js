// Cloud Functions for Firebase (Node.js)
// This would be deployed separately to Firebase Functions

const functions = require("firebase-functions")
const admin = require("firebase-admin")

admin.initializeApp()

// Function to set admin claims
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Only allow existing admins to set admin claims
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can set admin claims.")
  }

  const { uid } = data

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true })
    return { message: `Admin claim set for user ${uid}` }
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message)
  }
})

// Function to process orders
exports.processOrder = functions.firestore.document("orders/{orderId}").onCreate(async (snap, context) => {
  const order = snap.data()
  const orderId = context.params.orderId

  // Here you would integrate with payment processing
  // For now, just log the order
  console.log(`New order received: ${orderId}`, order)

  // Update order status
  await snap.ref.update({
    status: "processing",
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})

// Function to handle inventory updates
exports.updateInventory = functions.firestore.document("orders/{orderId}").onCreate(async (snap, context) => {
  const order = snap.data()
  const batch = admin.firestore().batch()

  // Update product inventory (if you have inventory tracking)
  for (const item of order.items) {
    const productRef = admin.firestore().collection("products").doc(item.productId)
    batch.update(productRef, {
      inventory: admin.firestore.FieldValue.increment(-item.quantity),
    })
  }

  await batch.commit()
})
