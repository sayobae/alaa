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
  div.id = `group-${groupId}`;
  div.innerHTML = `
    <h2>Group ${groupId + 1}</h2>

    <button type="button" class="delete-group-btn" onclick="removeGroup(${groupId})">
      ❌ Delete Group
    </button>

    <label>Group Name:</label>
    <input type="text" class="group-name" placeholder="e.g. Attorneys" />

    <label>Paste Headcount, Union Step, Mgmt Step (tab-separated, 3 columns):</label>
    <textarea class="group-csv" rows="5" placeholder="0\t83500\t$80,659.71"></textarea>

    <label>Union Raise (%):</label>
    <input type="number" class="union-raise" value="3" />

    <label>Mgmt Raise (%):</label>
    <input type="number" class="mgmt-raise" value="2" />
  `;
  container.appendChild(div);

  groupId++;
}

// Remove a group when the remove button is clicked
function removeGroup(id) {
  const el = document.getElementById(`group-${id}`);
  if (el) el.remove();
}

// Parse the CSV-style input into headcounts and salary steps
function parseCSVTriples(text) {
  const lines = text.split('\n');
  const headcounts = [], unionSteps = [], mgmtSteps = [];

  lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length === 3) {
      const headcount = parseFloat(parts[0].trim());
      const unionStep = parseFloat(parts[1].trim().replace(/[\$,]/g, ''));
      const mgmtStep  = parseFloat(parts[2].trim().replace(/[\$,]/g, ''));

      if (!isNaN(headcount) && !isNaN(unionStep) && !isNaN(mgmtStep)) {
        headcounts.push(headcount);
        unionSteps.push(unionStep);
        mgmtSteps.push(mgmtStep);
      }
    }
  });

  return { headcounts, unionSteps, mgmtSteps };
}

// Weighted cost for a set of steps
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

// NEW: calculate per-step salary progression for ONE person per step
function calculatePerStepProgression(steps, raisePct, years) {
  const out = steps.map(start => {
    let vals = [];
    let current = start;
    for (let y = 0; y < years; y++) {
      vals.push(current);
      current = current * (1 + raisePct / 100);
    }
    return vals;
  });
  return out;
}

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

    // NEW: per-step individual salary growth
    const unionPerPerson = calculatePerStepProgression(unionSteps, raiseUnion, years);
    const mgmtPerPerson  = calculatePerStepProgression(mgmtSteps, raiseMgmt, years);

    unionTotals = unionTotals.map((v, i) => v + union[i]);
    mgmtTotals = mgmtTotals.map((v, i) => v + mgmt[i]);
    lastTotals = lastTotals.map((v, i) => v + last[i]);

    groupResults.push({ groupName, union, mgmt, last, unionSteps, mgmtSteps, unionPerPerson, mgmtPerPerson });
  });

  const table = document.getElementById('resultsTable');
  table.innerHTML = '';

  groupResults.forEach(result => {
    const cumulativeUnion = sum(result.union).toFixed(2);
