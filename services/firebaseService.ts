
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { AppUser } from '../types';

const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || 
          atob("QUl6YVN5Q2ptSUU5azBoRVpVbXE4UEtJMXlXUTlYaEd5NGxHX1Nv"),
  authDomain: "lessonplan-190ee.firebaseapp.com",
  databaseURL: "https://lessonplan-190ee-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lessonplan-190ee",
  storageBucket: "lessonplan-190ee.firebasestorage.app",
  messagingSenderId: "1038119878139",
  appId: "1:1038119878139:web:0e9c831381c96bdb789f5e"
};

let db: any;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

const USERS_COLLECTION = 'users';

export const subscribeToUsers = (
  callback: (users: AppUser[]) => void, 
  onError?: (error: FirestoreError) => void
) => {
  if (!db) return () => {};
  
  return onSnapshot(
    collection(db, USERS_COLLECTION), 
    (snapshot) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as AppUser;
      });
      callback(users);
    },
    (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Firestore access denied. Please check your Security Rules in Firebase Console.");
      } else {
        console.error("Firestore subscription error:", error);
      }
      if (onError) onError(error);
    }
  );
};

export const addUserToDb = async (userData: Omit<AppUser, 'id' | 'wordCount' | 'pptCount'>) => {
  if (!db) throw new Error("Database not initialized");
  return await addDoc(collection(db, USERS_COLLECTION), {
    ...userData,
    wordCount: 0,
    pptCount: 0,
    dailyAiGenCount: 0,
    lastAiGenDate: "",
    createdAt: serverTimestamp()
  });
};

export const updateUserInDb = async (user: AppUser) => {
  if (!db) throw new Error("Database not initialized");
  const userRef = doc(db, USERS_COLLECTION, user.id.toString());
  const { id, ...data } = user;
  return await updateDoc(userRef, data as any);
};

export const deleteUserFromDb = async (id: string | number) => {
  if (!db) throw new Error("Database not initialized");
  return await deleteDoc(doc(db, USERS_COLLECTION, id.toString()));
};

export const incrementGenerationCount = async (username: string, type: 'word' | 'ppt') => {
  if (!db) throw new Error("Database not initialized");
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, USERS_COLLECTION, userDoc.id);
    const currentData = userDoc.data();
    const field = type === 'word' ? 'wordCount' : 'pptCount';
    
    return await updateDoc(userRef, {
      [field]: (currentData[field] || 0) + 1
    });
  }
};

export const incrementDailyAiGenCount = async (username: string) => {
  if (!db) throw new Error("Database not initialized");
  const today = new Date().toISOString().split('T')[0];
  const q = query(collection(db, USERS_COLLECTION), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    const userRef = doc(db, USERS_COLLECTION, userDoc.id);
    const currentData = userDoc.data();
    
    let newCount = 1;
    if (currentData.lastAiGenDate === today) {
      newCount = (currentData.dailyAiGenCount || 0) + 1;
    }
    
    return await updateDoc(userRef, {
      dailyAiGenCount: newCount,
      lastAiGenDate: today
    });
  }
};

export const seedInitialUsers = async (initialUsers: AppUser[]) => {
  if (!db) return;
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (querySnapshot.empty) {
      for (const user of initialUsers) {
        const { id, ...data } = user;
        await addDoc(collection(db, USERS_COLLECTION), { 
          ...data, 
          dailyAiGenCount: 0,
          lastAiGenDate: "",
          createdAt: serverTimestamp() 
        });
      }
    }
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
        console.warn("Seeding initial users failed:", e.message);
    }
  }
};
