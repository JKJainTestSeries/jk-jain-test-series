// dashboard.js
// Handles displaying selected test papers and uploading answer sheet PDFs to
// Firebase Storage. Users must be logged in to upload files.

// TODO: Use the same Firebase configuration as in auth.js. Replace with real values.
const firebaseConfig = {
  apiKey: "AIzaSyAok2p3mAQcTvhfGZrzFaS6IxzPGCbRb8E",
  authDomain: "jkjain-test-series.firebaseapp.com",
  projectId: "jkjain-test-series",
  storageBucket: "jkjain-test-series.firebasestorage.app",
  messagingSenderId: "702114247478",
  appId: "1:702114247478:web:38d68507dc09b269bff997",
  measurementId: "G-6ZCGSEJM7S"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', () => {
  const selectedList = document.getElementById('selectedList');
  const uploadButton = document.getElementById('uploadButton');
  const uploadMessage = document.getElementById('uploadMessage');

  // Payment elements
  const showTotalCostElem = document.getElementById('showTotalCost');
  const paymentInstructionsElem = document.getElementById('paymentInstructions');
  const payAmountElem = document.getElementById('payAmount');
  const upiQrElem = document.getElementById('upiQr');

  // Display the papers the user selected on the home page
  let selected = [];
  try {
    const stored = localStorage.getItem('selectedPapers');
    if (stored) {
      selected = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Unable to read selected papers from localStorage.', e);
  }
  if (selected && selected.length > 0) {
    const ul = document.createElement('ul');
    selected.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.paper} – ${item.subject} (${item.date})`;
      ul.appendChild(li);
    });
    selectedList.appendChild(ul);
  } else {
    selectedList.textContent = 'No papers selected.';
  }

  // Display the total cost from localStorage and show payment instructions
  let cost = 0;
  try {
    const storedCost = localStorage.getItem('selectedCost');
    if (storedCost) {
      cost = parseInt(storedCost, 10);
    }
  } catch (e) {
    console.warn('Unable to read cost from localStorage.', e);
  }
  if (showTotalCostElem) {
    if (cost > 0) {
      showTotalCostElem.textContent = `Total cost: ₹${cost}`;
      if (payAmountElem) payAmountElem.textContent = cost;
      if (paymentInstructionsElem) paymentInstructionsElem.style.display = 'block';
      if (upiQrElem) upiQrElem.style.display = 'block';
    } else {
      showTotalCostElem.textContent = '';
    }
  }

  // Handle file upload
  uploadButton.addEventListener('click', () => {
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    uploadMessage.textContent = '';
    if (!file) {
      uploadMessage.style.color = '#c00';
      uploadMessage.textContent = 'Please choose a PDF file to upload.';
      return;
    }
    if (file.type !== 'application/pdf') {
      uploadMessage.style.color = '#c00';
      uploadMessage.textContent = 'Only PDF files are allowed.';
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      uploadMessage.style.color = '#c00';
      uploadMessage.textContent = 'You must be logged in to upload files.';
      return;
    }
    // Prepare the file path: uploads/userId/timestamp_filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9\.\-_]/g, '_');
    const filePath = `uploads/${user.uid}/${timestamp}_${safeName}`;
    const storageRef = storage.ref(filePath);
    uploadMessage.style.color = '#00549e';
    uploadMessage.textContent = 'Uploading…';
    storageRef.put(file)
      .then(() => {
        uploadMessage.style.color = '#00549e';
        uploadMessage.textContent = 'Upload successful!';
        fileInput.value = '';
      })
      .catch(err => {
        uploadMessage.style.color = '#c00';
        uploadMessage.textContent = 'Upload failed: ' + err.message;
      });
  });

  // Redirect to login if user is not authenticated
  auth.onAuthStateChanged(user => {
    if (!user) {
      // If no user is logged in, go back to login page
      window.location.href = 'login.html';
    }
  });
});