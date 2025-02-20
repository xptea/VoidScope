import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDGhf0Od_sSBTYpmDC9zRBgERutAA-C9pE",
  authDomain: "voidwork.firebaseapp.com",
  projectId: "voidwork",
  storageBucket: "voidwork.appspot.com",
  messagingSenderId: "58762632295",
  appId: "1:58762632295:web:de7135eb1f9f069d6108c2",
  measurementId: "G-FPZJWBQZXP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
