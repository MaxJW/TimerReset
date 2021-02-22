import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDhwNml_b500XySJ2811Cxj2gH_gNCSCSg",
    authDomain: "timerreset-5f558.firebaseapp.com",
    databaseURL: "https://timerreset-5f558-default-rtdb.firebaseio.com",
    projectId: "timerreset-5f558",
    storageBucket: "timerreset-5f558.appspot.com",
    messagingSenderId: "1041197606965",
    appId: "1:1041197606965:web:7b0a290ceb8415722da97c",
    measurementId: "G-BSHKDL4636"
  };

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export const db = firebase.firestore();