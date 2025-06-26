const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } = require('firebase/firestore');

// Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDhQ8nGzHhsNu3wQqHNqQDvgZNlGXJb5Uo",
  authDomain: "genc-a8f49.firebaseapp.com",
  projectId: "genc-a8f49",
  storageBucket: "genc-a8f49.firebasestorage.app",
  messagingSenderId: "1032583593537",
  appId: "1:1032583593537:web:6b5c0b1c1e8c4a5b2c3d4e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function quickSetup() {
  try {
    console.log('🔐 Please provide your login credentials to get your UID and create your super admin profile');
    
    const email = process.argv[2] || 'rodney@rodneymanor.com';
    const password = process.argv[3];
    
    if (!password) {
      console.log('❌ Please provide your password');
      console.log('Usage: node scripts/quick-setup.js rodney@rodneymanor.com YOUR_PASSWORD');
      return;
    }

    console.log('🔍 Signing in to get your UID...');
    
    // Sign in to get the UID
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log('✅ Successfully signed in!');
    console.log('🆔 Your UID:', uid);

    // Check if profile already exists
    console.log('🔍 Checking if user profile already exists...');
    const q = query(
      collection(db, 'user_profiles'), 
      where('uid', '==', uid)
    );
    
    const existingDocs = await getDocs(q);
    
    if (!existingDocs.empty) {
      console.log('✅ User profile already exists!');
      existingDocs.forEach((doc) => {
        const data = doc.data();
        console.log('Document ID:', doc.id);
        console.log('Email:', data.email);
        console.log('Role:', data.role);
        console.log('Display Name:', data.displayName);
      });
      return;
    }

    console.log('📝 Creating super admin profile...');
    
    const profileData = {
      uid: uid,
      email: email,
      displayName: 'Rodney Manor',
      role: 'super_admin',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'user_profiles'), profileData);
    
    console.log('✅ Super admin profile created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Email:', profileData.email);
    console.log('Role:', profileData.role);
    console.log('Display Name:', profileData.displayName);
    
    console.log('\n🎉 You should now be able to see the Collections section in your app!');
    console.log('Try refreshing your app to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/wrong-password') {
      console.log('🔐 Please check your password and try again');
    } else if (error.code === 'auth/user-not-found') {
      console.log('👤 User not found. Please check your email address');
    }
  }
}

quickSetup(); 