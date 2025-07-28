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
  // Note: Firebase storage buckets normally end with appspot.com
  storageBucket: "jkjain-test-series.appspot.com",
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
  const exportBtn = document.getElementById('exportBtn');

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
        const csvRows = [];
        // CSV header
        csvRows.push(['Full Name','Email','Mobile','Date of Birth','Selected Papers','Total Cost','Payment Status','Registered On']);
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
          // Convert selected papers array to a concise string
          let papersStr = '';
          if (Array.isArray(data.selectedPapers) && data.selectedPapers.length > 0) {
            papersStr = data.selectedPapers.map(p => `${p.paper} (${p.date})`).join('; ');
          }
          const totalCost = typeof data.selectedCost === 'number' ? `₹${data.selectedCost}` : '';
          const paymentStatus = data.paymentStatus || '';
          tr.innerHTML = `
            <td>${data.fullName || ''}</td>
            <td>${data.email || ''}</td>
            <td>${data.mobile || ''}</td>
            <td>${data.dob || ''}</td>
            <td>${papersStr}</td>
            <td>${totalCost}</td>
            <td>${paymentStatus}</td>
            <td>${registeredOn}</td>
          `;
          tableBody.appendChild(tr);
          // Add row to CSV data
          csvRows.push([
            data.fullName || '',
            data.email || '',
            data.mobile || '',
            data.dob || '',
            papersStr,
            typeof data.selectedCost === 'number' ? data.selectedCost : '',
            paymentStatus,
            registeredOn
          ]);
        });

        // Attach export CSV handler after data loaded
        if (exportBtn) {
          exportBtn.onclick = () => {
            // Convert rows to CSV format
            const csvContent = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'students.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };
        }
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        // In case of error, still allow logout
      });
  }
});