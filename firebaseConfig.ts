// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-qBkmSRTSWBzebJ7ZfLoYiDtDvxVq4Pk",
  authDomain: "repairmate-mvp.firebaseapp.com",
  projectId: "repairmate-mvp",
  storageBucket: "repairmate-mvp.firebasestorage.app",
  messagingSenderId: "432126526994",
  appId: "1:432126526994:web:16860fbaafdf2e52443acb",
  measurementId: "G-71PDEKEDXM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);