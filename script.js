let groupId = 0;

function addGroup() {
  const container = document.getElementById('groups-container');
  const div = document.createElement('div');
  div.className = 'group-block';
  div.id = `group-${groupId++}`;  // Ensure each group has a unique ID
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

function removeGroup(groupId) {
  const groupToRemove = document.getElementById(`group-${groupId}`);
  groupToRemove.remove();
}

// Updated parseCSVTriples function to handle tab-separated CSV and strip dollar signs/commas
function parseCSVTriples(text) {
  const lines = text.split('\n');
  const headcounts = [], unionSteps = [], mgmtSteps = [];
  lines.forEach(line => {
    const parts = line.split('\t');  // Handle tab-separated values
    if (parts.length === 3) {
      const headcount = parseFloat(parts[0].trim());
      const unionStep = parseFloat(parts[1].trim());
      // Strip out dollar signs and commas for the management step
      const mgmtStep = parseFloat(parts[2]()

