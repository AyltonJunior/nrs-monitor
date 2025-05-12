// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDrRNKUa6Bcy-woSUB5vgh4YGKNIS-v6ls",
  authDomain: "hi-pag-303ad.firebaseapp.com",
  databaseURL: "https://hi-pag-303ad-default-rtdb.firebaseio.com",
  projectId: "hi-pag-303ad",
  storageBucket: "hi-pag-303ad.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = firebase.firestore();
