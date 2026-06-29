import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { VideoPost } from "./storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZxhiKuoaHT-4CtmMGeR6we00hsqwXzJ0",
  authDomain: "wisegrams-d51ad.firebaseapp.com",
  projectId: "wisegrams-d51ad",
  storageBucket: "wisegrams-d51ad.firebasestorage.app",
  messagingSenderId: "105715449465",
  appId: "1:105715449465:web:9089cccbbffbcc05ef5ea8",
  measurementId: "G-3SC4SBBQQ3"
};

// Initialize Firebase securely (avoiding hot-reload re-initialization errors)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// We store the entire feed as an array in a single document to massively save on Firebase quotas (1 read = full feed).
const FEED_DOC_REF = doc(db, "feed", "global");

export async function getVideosDb(): Promise<VideoPost[]> {
  try {
    const snap = await getDoc(FEED_DOC_REF);
    if (snap.exists()) {
      return (snap.data().videos as VideoPost[]) || [];
    }
    return [];
  } catch (error) {
    console.error("Firebase read error:", error);
    return [];
  }
}

export async function saveVideosDb(videos: VideoPost[]): Promise<void> {
  try {
    await setDoc(FEED_DOC_REF, { videos });
  } catch (error) {
    console.error("Firebase write error:", error);
  }
}
