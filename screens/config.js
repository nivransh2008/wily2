import * as firebase from "firebase"

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyCf6WSBva8_kWIUNroSwy2_bnF-Yhjsarc",
    authDomain: "wily-3295a.firebaseapp.com",
    projectId: "wily-3295a",
    storageBucket: "wily-3295a.appspot.com",
    messagingSenderId: "1045347099625",
    appId: "1:1045347099625:web:2a73fbf20e69fae5326178"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore()