// dashboard.js
// This script manages the student dashboard, including displaying
// account details and the list of applied test papers. It also
// handles uploading profile photos and answer sheet PDFs to
// Firebase Storage and storing metadata in Firestore.

// Firebase configuration for your project. These values are
// provided by Firebase when you register your web app. Do not
// include measurementId unless you are using Google Analytics.
const firebaseConfig = {
  apiKey: "AIzaSyAok2p3mAQcTvhfGZrzFaS6IxzPGCbRb8E",
  authDomain: "jkjain-test-series.firebaseapp.com",
  projectId: "jkjain-test-series",
  storageBucket: "jkjain-test-series.appspot.com",
  messagingSenderId: "702114247478",
  appId: "1:702114247478:web:38d68507dc09b269bff997"
};

// Initialize Firebase services
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
  const accountSection = document.getElementById('accountSection');
  const testSeriesSection = document.getElementById('testSeriesSection');
  const navAccount = document.getElementById('nav-account');
  const navTest = document.getElementById('nav-testseries');
  const navLogout = document.getElementById('nav-logout');
  const profileImage = document.getElementById('profileImage');
  const photoInput = document.getElementById('photoInput');
  const nameSpan = document.getElementById('accountName');
  const emailSpan = document.getElementById('accountEmail');
  const mobileSpan = document.getElementById('accountMobile');
  const dobSpan = document.getElementById('accountDob');
  const testSeriesBody = document.getElementById('testSeriesBody');
  const testTable = document.getElementById('testSeriesTable');
  const noTestsMsg = document.getElementById('noTests');

  // Helper to switch active navigation
  function setActive(link) {
    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  }

  // Load user data and populate account section
  function loadAccountInfo(user) {
    const uid = user.uid;
    // Fetch student record from Firestore
    db.collection('students').doc(uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        nameSpan.textContent = data.fullName || '';
        emailSpan.textContent = user.email || '';
        mobileSpan.textContent = data.mobile || '';
        dobSpan.textContent = data.dob || '';
        if (data.photoURL) {
          profileImage.src = data.photoURL;
        } else {
          profileImage.src = 'hero.png';
        }
      }
    }).catch(err => {
      console.error('Error fetching user data', err);
    });
  }

  // Load selected papers and build table
  function loadTestSeries(user) {
    // Retrieve selected papers primarily from Firestore, falling back to localStorage
    const uid = user.uid;
    db.collection('students').doc(uid).get().then(doc => {
      let selected = [];
      if (doc.exists) {
        const data = doc.data();
        if (Array.isArray(data.selectedPapers) && data.selectedPapers.length > 0) {
          selected = data.selectedPapers;
        }
      }
      // Fallback to localStorage if nothing found in Firestore
      if (selected.length === 0) {
        try {
          const stored = localStorage.getItem('selectedPapers');
          if (stored) {
            selected = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Unable to read selected papers from localStorage.', e);
        }
      }
      // Build the table
      if (!selected || selected.length === 0) {
        noTestsMsg.style.display = 'block';
        testTable.style.display = 'none';
        return;
      }
      noTestsMsg.style.display = 'none';
      testTable.style.display = 'table';
      testSeriesBody.innerHTML = '';
      selected.forEach((item, index) => {
        const tr = document.createElement('tr');
        // Paper details
        const tdPaper = document.createElement('td');
        tdPaper.textContent = `${item.paper} – ${item.subject} (${item.date})`;
        tr.appendChild(tdPaper);
        // Question paper placeholder (future: fetch from Firestore if admin uploads)
        const tdQuestion = document.createElement('td');
        tdQuestion.textContent = 'Not available yet';
        tdQuestion.classList.add('question-col');
        tr.appendChild(tdQuestion);
        // Answer sheet upload cell
        const tdAnswer = document.createElement('td');
        const inputFile = document.createElement('input');
        inputFile.type = 'file';
        inputFile.accept = 'application/pdf';
        inputFile.dataset.paperIndex = index;
        inputFile.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            uploadAnswer(user, index, item, file, tdAnswer);
          }
        });
        tdAnswer.appendChild(inputFile);
        tr.appendChild(tdAnswer);
        // Comments cell placeholder
        const tdComments = document.createElement('td');
        tdComments.textContent = '';
        tr.appendChild(tdComments);
        testSeriesBody.appendChild(tr);
      });
    }).catch(err => {
      console.error('Error loading selected papers', err);
    });
  }

  // Upload profile photo
  function uploadProfilePhoto(user, file) {
    const uid = user.uid;
    const ext = file.name.split('.').pop();
    const ref = storage.ref().child(`profilePhotos/${uid}.${ext}`);
    ref.put(file).then(snapshot => snapshot.ref.getDownloadURL()).then(url => {
      // Update Firestore with photo URL
      return db.collection('students').doc(uid).update({ photoURL: url });
    }).then(() => {
      profileImage.src = URL.createObjectURL(file);
    }).catch(err => {
      console.error('Error uploading photo', err);
    });
  }

  // Upload answer sheet for a given paper
  function uploadAnswer(user, index, item, file, cell) {
    const uid = user.uid;
    // Path: answers/userId/paperIndex_timestamp.pdf
    const timestamp = Date.now();
    const ref = storage.ref().child(`answers/${uid}/${index}_${timestamp}.pdf`);
    const statusSpan = document.createElement('span');
    statusSpan.textContent = 'Uploading...';
    cell.appendChild(statusSpan);
    ref.put(file).then(snapshot => snapshot.ref.getDownloadURL()).then(url => {
      // Save answer URL in Firestore under subcollection
      const answersRef = db.collection('students').doc(uid)
        .collection('answers').doc(String(index));
      return answersRef.set({
        paper: item.paper,
        subject: item.subject,
        date: item.date,
        answerURL: url,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).then(() => {
      statusSpan.textContent = 'Uploaded';
    }).catch(err => {
      console.error('Error uploading answer sheet', err);
      statusSpan.textContent = 'Upload failed';
    });
  }

  // Navigation handlers
  navAccount.addEventListener('click', (e) => {
    e.preventDefault();
    setActive(navAccount);
    accountSection.style.display = 'block';
    testSeriesSection.style.display = 'none';
  });
  navTest.addEventListener('click', (e) => {
    e.preventDefault();
    setActive(navTest);
    accountSection.style.display = 'none';
    testSeriesSection.style.display = 'block';
  });
  navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });

  // Photo input change
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const user = auth.currentUser;
    if (user) {
      uploadProfilePhoto(user, file);
    }
  });

  // Monitor auth state
  auth.onAuthStateChanged(user => {
    if (!user) {
      // Not logged in
      window.location.href = 'login.html';
      return;
    }
    // Populate data
    loadAccountInfo(user);
    loadTestSeries(user);
  });
});