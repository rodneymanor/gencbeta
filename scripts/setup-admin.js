const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } = require("firebase/firestore");

// Your actual Firebase config (using genc-a8f49 project)
const firebaseConfig = {
  apiKey: "AIzaSyDhQ8nGzHhsNu3wQqHNqQDvgZNlGXJb5Uo",
  authDomain: "genc-a8f49.firebaseapp.com",
  projectId: "genc-a8f49",
  storageBucket: "genc-a8f49.firebasestorage.app",
  messagingSenderId: "1032583593537",
  appId: "1:1032583593537:web:6b5c0b1c1e8c4a5b2c3d4e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupSuperAdmin() {
  try {
    // Replace this with your actual Firebase Auth UID
    const uid = process.argv[2];

    if (!uid) {
      console.log("❌ Please provide your Firebase Auth UID as an argument");
      console.log("Usage: node setup-admin.js YOUR_FIREBASE_UID");
      console.log("\nTo get your UID:");
      console.log("1. Open get-uid.html in your browser");
      console.log("2. Make sure you're logged into your app");
      console.log("3. Copy the UID from the page");
      return;
    }

    console.log("🔍 Checking if user profile already exists...");

    // Check if profile already exists
    const q = query(collection(db, "user_profiles"), where("uid", "==", uid));

    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      console.log("✅ User profile already exists!");
      existingDocs.forEach((doc) => {
        const data = doc.data();
        console.log("Document ID:", doc.id);
        console.log("Email:", data.email);
        console.log("Role:", data.role);
        console.log("Display Name:", data.displayName);
      });
      return;
    }

    console.log("📝 Creating super admin profile...");

    const profileData = {
      uid: uid,
      email: "rodney@rodneymanor.com",
      displayName: "Rodney Manor",
      role: "super_admin",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "user_profiles"), profileData);

    console.log("✅ Super admin profile created successfully!");
    console.log("Document ID:", docRef.id);
    console.log("Email:", profileData.email);
    console.log("Role:", profileData.role);
    console.log("Display Name:", profileData.displayName);

    console.log("\n🎉 You should now be able to see the Collections section in your app!");
    console.log("Try refreshing your app to see the changes.");
  } catch (error) {
    console.error("❌ Error setting up super admin profile:", error);
  }
}

setupSuperAdmin();
