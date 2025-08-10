// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnfxDq3aMVOFRfvTZ28IdQnnWpVM_Qsl0",
  authDomain: "jpnv-cultural.firebaseapp.com",
  projectId: "jpnv-cultural",
  storageBucket: "jpnv-cultural.firebasestorage.app",
  messagingSenderId: "658315176770",
  appId: "1:658315176770:web:129db775cb2ec0872ab6db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

export {firestore}
