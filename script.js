// script.js
// Handles user interactions on the landing page such as proceeding to login
// after selecting desired test papers. Selected papers are stored in
// localStorage so that they can be accessed on the login or dashboard pages.

document.addEventListener('DOMContentLoaded', () => {
  const costPerPaper = 50;
  const proceedButton = document.getElementById('proceedButton');
  const totalCostElem = document.getElementById('totalCost');

  // Function to update total cost based on selected checkboxes
  function updateCost() {
    let count = 0;
    document.querySelectorAll('.test-series-table tbody input[type="checkbox"]').forEach(cb => {
      if (cb.checked) count++;
    });
    const cost = count * costPerPaper;
    if (totalCostElem) {
      if (count > 0) {
        totalCostElem.textContent = `Total cost: ₹${cost}`;
      } else {
        totalCostElem.textContent = '';
      }
    }
    try {
      localStorage.setItem('selectedCost', cost);
    } catch (e) {
      console.warn('Unable to store cost in localStorage.', e);
    }
  }
  // Attach change listeners to checkboxes to recalculate cost
  document.querySelectorAll('.test-series-table tbody input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateCost);
  });
  // Initial calculation on page load
  updateCost();

  if (proceedButton) {
    proceedButton.addEventListener('click', () => {
      const selected = [];
      // Find all checked checkboxes within the test series tables
      document.querySelectorAll('.test-series-table tbody tr').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
          const paper = row.cells[1]?.textContent.trim();
          const subject = row.cells[2]?.textContent.trim();
          const date = row.cells[3]?.textContent.trim();
          selected.push({ paper, subject, date });
        }
      });
      if (selected.length === 0) {
        alert('Please select at least one paper to proceed.');
        return;
      }
      // Store the selection in localStorage
      try {
        localStorage.setItem('selectedPapers', JSON.stringify(selected));
      } catch (e) {
        console.warn('Unable to store selection in localStorage.', e);
      }
      // selectedCost is already stored by updateCost
      // Redirect to login page
      window.location.href = 'login.html';
    });
  }
});