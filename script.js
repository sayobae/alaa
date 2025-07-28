let groupId = 0;

// Ensure the event listeners are added after the DOM has fully loaded.
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('addGroupButton').addEventListener('click', addGroup);
  document.getElementById('calculateButton').addEventListener('click', calculateCosts);
  document.getElementById('exportButton').addEventListener('click', exportCSV);
});

// Add a new group when the button is clicked
function addGroup() {
  const container = document.getElementById('groups-container');
  const div = document.createElement('div');
  div.className = 'group-block';
  div.id = `group-${groupId++}`;
  div.innerHTML = `
    <h2>Group ${groupId}</h2>
    <label>Group Name:</label>
    <input type="text" class="group-name" placeholder="e.g. Attorneys" />

    <label>Paste Headcount, Union Step, Mgmt Step (CSV-style, 3 columns, Tab-separated):</label>
    <textarea class="group-csv" rows="5" placeholder="0\t83500\t$80,659.71\n0\t85500\t$82,782.34\n3\t88666\t$84,904.96"></textarea>

    <label>Union Raise (%):</label>
    <input type="number" class="union-raise" value="3" />

    <label>Mgmt Raise (%):</label>
    <input type="number" class="mgmt-raise" value="2" />

    <button type="button" onclick="removeGroup(${groupId - 1})">Remove Group</button>
  `;
  container.appendChild(div);
}

// Remove a group when the remove button is clicked
function removeGroup(groupId) {
  const groupToRemove = document.getElementById(`group-${groupId}`);
  groupToRemove.remove();
}

// Parse the CSV-style input into headcounts and salary steps
function parseCSVTriples(text) {
  const lines = text.split('\n');
  const headcounts = [], unionSteps = [], mgmtSteps = [];
  lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length === 3) {
      const headcount = parseFloat(parts[0].trim());
      const unionStep = parseFloat(parts[1].trim());
      const mgmtStep = parseFloat(parts[2].trim().replace(/[\$,]/g, ''));
      
      if (!isNaN(headcount) && !isNaN(unionStep) && !isNaN(mgmtStep)) {
        headcounts.push(headcount);
        unionSteps.push(unionStep);
        mgmtSteps.push(mgmtStep);
      }
    }
  });
  return { headcounts, unionSteps, mgmtSteps };
}

// Calculate the weighted cost for a given set of steps
function weightedCost(steps, headcounts) {
  return steps.reduce((sum, step, i) => sum + step * (headcounts[i] || 0), 0);
}

// Calculate costs for each year, considering raises
function calculateProposalCosts(steps, headcounts, raise, years) {
  const totals = [];
  let current = [...steps];
  for (let y = 0; y < years; y++) {
    totals.push(weightedCost(current, headcounts));
    current = current.map(s => s * (1 + raise / 100));
  }
  return totals;
}

// Sum up an array of numbers
function sum(array) {
  return array.reduce((acc, val) => acc + val, 0);
}

// Export results to CSV
function exportCSV() {
  const table = document.getElementById('resultsTable');
  let csv = '';
  for (let row of table.rows) {
    const cells = Array.from(row.cells).map(cell => '"' + cell.textContent.trim() + '"');
    csv += cells.join(',') + '\n';
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'contract_costs.csv';
  link.click();
}

// Calculate the results for all groups
function calculateCosts() {
  const years = parseInt(document.getElementById('contract-years').value);
  const lastRaise = parseFloat(document.getElementById('last-raise').value);

  const allGroups = document.querySelectorAll('.group-block');
  const labels = Array.from({ length: years }, (_, i) => `Year ${i + 1}`);

  let unionTotals = Array(years).fill(0);
  let mgmtTotals = Array(years).fill(0);
  let lastTotals = Array(years).fill(0);

  let groupResults = [];

  allGroups.forEach(group => {
    const groupName = group.querySelector('.group-name').value || 'Unnamed Group';
    const raiseUnion = parseFloat(group.querySelector('.union-raise').value);
    const raiseMgmt = parseFloat(group.querySelector('.mgmt-raise').value);

    const csvInput = group.querySelector('.group-csv').value;
    const { headcounts, unionSteps, mgmtSteps } = parseCSVTriples(csvInput);

    const union = calculateProposalCosts(unionSteps, headcounts, raiseUnion, years);
    const mgmt = calculateProposalCosts(mgmtSteps, headcounts, raiseMgmt, years);
    const last = calculateProposalCosts(mgmtSteps, headcounts, lastRaise, years);

    unionTotals = unionTotals.map((v, i) => v + union[i]);
    mgmtTotals = mgmtTotals.map((v, i) => v + mgmt[i]);
    lastTotals = lastTotals.map((v, i) => v + last[i]);

    groupResults.push({ groupName, union, mgmt, last });
  });

  const table = document.getElementById('resultsTable');
  table.innerHTML = '';

  groupResults.forEach(result => {
    const cumulativeUnion = sum(result.union).toFixed(2);
    const cumulativeMgmt = sum(result.mgmt).toFixed(2);
    const cumulativeLast = sum(result.last).toFixed(2);

    table.innerHTML += `<tr><th colspan="6">${result.groupName}</th></tr>`;
    table.innerHTML += `<tr><th>Year</th><th>Union</th><th>Mgmt</th><th>Last Contract</th><th>Union - Mgmt</th><th>Union - Last</th></tr>`;
    labels.forEach((label, i) => {
      table.innerHTML += `
        <tr>
          <td>${
