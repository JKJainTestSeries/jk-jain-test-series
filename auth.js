// auth.js
// Handles user authentication via Firebase. You need to create a Firebase
// project and replace the configuration object below with your project's
// actual configuration values. See https://firebase.google.com/docs/web/setup
// for instructions on how to obtain these values.

// TODO: Replace these placeholder values with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAok2p3mAQcTvhfGZrzFaS6IxzPGCbRb8E",
  authDomain: "jkjain-test-series.firebaseapp.com",
  projectId: "jkjain-test-series",
  // Note: Firebase storage buckets normally end with appspot.com
  storageBucket: "jkjain-test-series.appspot.com",
  messagingSenderId: "702114247478",
  appId: "1:702114247478:web:38d68507dc09b269bff997",
  measurementId: "G-6ZCGSEJM7S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Define the owner's email. Replace this with the actual owner/admin email.
// Users who sign in with this email will be treated as the administrator and
// redirected to the admin dashboard where they can view all registered
// students. Make sure you replace this with your own email address.
const ownerEmail = "OWNER_EMAIL@example.com";

// Only Gmail addresses are permitted for student accounts. This constant
// defines the allowed domain and is used to validate email addresses on
// sign‑up. If you wish to permit other domains simply adjust this value.
const allowedEmailDomain = "@gmail.com";

document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('authButton');
  const toggleLink = document.getElementById('toggleLink');
  // Text element used to display the sign-up/sign-in toggle prompt
  const toggleText = document.getElementById('signupToggleText');
  const formTitle = document.getElementById('form-title');
  const errorMessage = document.getElementById('error-message');
  const extraFields = document.getElementById('extraFields');

  let mode = 'login'; // or 'signup'

  // Toggle between login and sign up
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (mode === 'login') {
      mode = 'signup';
      formTitle.textContent = 'Sign Up';
      authButton.textContent = 'Sign Up';
      toggleText.textContent = 'Already have an account?';
      toggleLink.textContent = 'Login';
      extraFields.style.display = 'block';
    } else {
      mode = 'login';
      formTitle.textContent = 'Login';
      authButton.textContent = 'Login';
      toggleText.textContent = "Don't have an account?";
      toggleLink.textContent = 'Sign up';
      extraFields.style.display = 'none';
    }
    errorMessage.style.display = 'none';
  });

  // Handle authentication when the user clicks the button
  authButton.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    errorMessage.style.display = 'none';
    if (!email || !password) {
      errorMessage.textContent = 'Please provide both email and password.';
      errorMessage.style.display = 'block';
      return;
    }
    if (mode === 'signup') {
      // Collect additional details
      const fullName = document.getElementById('fullName').value.trim();
      const mobile = document.getElementById('mobile').value.trim();
      const dob = document.getElementById('dob').value;
      // Validate additional details
      if (!fullName || !mobile || !dob) {
        errorMessage.textContent = 'Please fill all the required fields.';
        errorMessage.style.display = 'block';
        return;
      }
      // Validate that the email ends with the allowed domain (e.g. @gmail.com).
      if (!email.toLowerCase().endsWith(allowedEmailDomain)) {
        errorMessage.textContent = `Please use a valid Gmail ID ending with ${allowedEmailDomain}.`;
        errorMessage.style.display = 'block';
        return;
      }
      // Validate mobile number (10 digits). We accept only numbers.
      if (!/^\d{10}$/.test(mobile)) {
        errorMessage.textContent = 'Mobile number must be 10 digits.';
        errorMessage.style.display = 'block';
        return;
      }
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          // Retrieve selected papers and cost from localStorage (if any)
          let selectedPapers = [];
          let selectedCost = 0;
          try {
            const papersStr = localStorage.getItem('selectedPapers');
            if (papersStr) {
              selectedPapers = JSON.parse(papersStr);
            }
            const costStr = localStorage.getItem('selectedCost');
            if (costStr) {
              selectedCost = parseFloat(costStr);
            }
          } catch (e) {
            console.warn('Error reading selected papers/cost from localStorage', e);
          }
          // Save student info along with selected papers and cost
          return db.collection('students').doc(user.uid).set({
            fullName: fullName,
            email: email,
            mobile: mobile,
            dob: dob,
            selectedPapers: selectedPapers,
            selectedCost: selectedCost,
            paymentStatus: selectedPapers.length > 0 ? 'pending' : 'n/a',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            // Redirect based on role
            if (email.toLowerCase() === ownerEmail.toLowerCase()) {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'dashboard.html';
            }
          });
        })
        .catch(err => {
          errorMessage.textContent = err.message;
          errorMessage.style.display = 'block';
        });
    } else {
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          // If the logged in user is the owner, go to admin page
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.email && currentUser.email.toLowerCase() === ownerEmail.toLowerCase()) {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        })
        .catch(err => {
          errorMessage.textContent = err.message;
          errorMessage.style.display = 'block';
        });
    }
  });
});