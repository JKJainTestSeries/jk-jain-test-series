// admin.js
// Handles displaying a list of all registered students to the site owner.
// This script requires Firebase Authentication and Firestore. It will
// automatically redirect non-authenticated users or non-owner accounts
// back to the login page. Ensure that the ownerEmail constant matches
// the email you set in auth.js.

// TODO: Replace these placeholder values with your Firebase project config.
const firebaseConfig = {
  apiKey: "AIzaSyAok2p3mAQcTvhfGZrzFaS6IxzPGCbRb8E",
  authDomain: "jkjain-test-series.firebaseapp.com",
  projectId: "jkjain-test-series",
  storageBucket: "jkjain-test-series.firebasestorage.app",
  messagingSenderId: "702114247478",
  appId: "1:702114247478:web:38d68507dc09b269bff997",
  measurementId: "G-6ZCGSEJM7S"
};

// Same owner email constant used in auth.js. Replace with the site owner's email.
const ownerEmail = "OWNER_EMAIL@example.com";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#studentsTable tbody');
  const logoutBtn = document.getElementById('logoutBtn');

  // Handle logout
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });

  // Listen for auth state changes to ensure only the owner can access this page
  auth.onAuthStateChanged(user => {
    if (!user) {
      // Not logged in – redirect to login
      window.location.href = 'login.html';
      return;
    }
    const email = user.email || '';
    if (email.toLowerCase() !== ownerEmail.toLowerCase()) {
      // Logged in but not the owner – redirect to dashboard or login
      window.location.href = 'login.html';
      return;
    }
    // The user is the owner – fetch and display students
    fetchStudents();
  });

  function fetchStudents() {
    db.collection('students').orderBy('createdAt', 'desc').get()
      .then(querySnapshot => {
        tableBody.innerHTML = '';
        querySnapshot.forEach(doc => {
          const data = doc.data();
          // Format date
          let registeredOn = '';
          try {
            if (data.createdAt && data.createdAt.toDate) {
              const dateObj = data.createdAt.toDate();
              registeredOn = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
          } catch (e) {
            registeredOn = '';
          }
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${data.fullName || ''}</td>
            <td>${data.email || ''}</td>
            <td>${data.mobile || ''}</td>
            <td>${data.dob || ''}</td>
            <td>${registeredOn}</td>
          `;
          tableBody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        // In case of error, still allow logout
      });
  }
});