<!DOCTYPE html>
<html>
<head>
  <title>Contract Cost Calculator</title>
  <style>
    .group-block {
      border: 1px solid #ccc;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .delete-button {
      background: #b30000;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      margin-top: 8px;
    }
    table {
      margin-top: 20px;
      border-collapse: collapse;
      width: 100%;
    }
    table, th, td {
      border: 1px solid #666;
    }
    th, td {
      padding: 5px;
      text-align: right;
    }
    th {
      background: #eee;
    }
  </style>
</head>

<body>

<h1>Contract Cost Calculator</h1>

<label>Contract Years:</label>
<input id="contract-years" type="number" value="4">

<label>Last Contract Raise (%):</label>
<input id="last-raise" type="number" value="3">

<button id="addGroupButton">Add Group</button>
<button id="calculateButton">Calculate</button>
<button id="exportButton">Export CSV</button>

<div id="groups-container"></div>

<h2>Total Results</h2>
<table id="resultsTable"></table>

<h2>Individual Step-Year Salary Calculations</h2>
<table id="stepDetailsTable"></table>

<script>
let groupId = 0;

// Ensure event listeners load after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("addGroupButton")
