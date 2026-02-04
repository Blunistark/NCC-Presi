/**
* NCC Attendance Automation Script
* 
* SETUP:
* 1. Open your Google Sheet.
* 2. Go to Extensions > Apps Script.
* 3. Paste this entire code.
* 4. Save and run 'updateEventStrength' once manually to grant permissions.
* 4. Save.
* 5. Select 'setupTriggers' from the dropdown and Click 'Run' to enable automation.
*/
const SHEET_ID = '11yk2xohYru3MyqqnXzTYBIr3lFkWbXsVOP2P7PRDbfE'; // YOUR SHEET ID
const LOGS_SHEET = 'Attendance_Logs';
const STRENGTH_SHEET = 'Event_Strength';
const ATTENDANCE_SHEET = 'Attendance'; // The new sheet for detailed categorization
const EVENT_MASTER_SHEET = 'Event_Master';
const NCC_DATA_SHEETS = ['1st Year', '2nd Year', '3rd Year'];
/**
 * ONE-CLICK SETUP: Run this function once to set up all automation.
 */
function setupTriggers() {
    // Clear existing triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => ScriptApp.deleteTrigger(t));
    // 1. Live Strength Update -> Every 5 Minutes
    ScriptApp.newTrigger('updateEventStrength')
        .timeBased()
        .everyMinutes(5)
        .create();
    // 2. Process Attendance Sheet -> Daily at 1 AM
    ScriptApp.newTrigger('processAttendanceSheet')
        .timeBased()
        .atHour(1)
        .everyDays(1)
        .create();
    // 2.1 Also run it every hour during the day to keep it relatively fresh?
    ScriptApp.newTrigger('processAttendanceSheet')
        .timeBased()
        .everyHours(1)
        .create();
    Logger.log("Triggers set up successfully.");
}
/**
 * 1. LIVE UPDATE: Process new logs to update Event Strength
 */
function updateEventStrength() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logsSheet = ss.getSheetByName(LOGS_SHEET);
    const strengthSheet = ss.getSheetByName(STRENGTH_SHEET);
    if (!logsSheet || !strengthSheet) return;
    const logs = logsSheet.getDataRange().getValues();
    const eventStats = {};
    const cadetMap = getCadetYearMap(ss);
    // Skip header (i=1)
    for (let i = 1; i < logs.length; i++) {
        const row = logs[i];
        const eventId = row[1];
        const enrollmentId = row[2];
        if (!eventId) continue;
        if (!eventStats[eventId]) {
            // Assuming first column is timestamp
            const dateStr = row[0] ? new Date(row[0]).toLocaleDateString() : '';
            eventStats[eventId] = { total: 0, year1: 0, year2: 0, year3: 0, date: dateStr };
        }
        eventStats[eventId].total++;
        const cadetYear = cadetMap[enrollmentId];
        if (cadetYear === '1st Year') eventStats[eventId].year1++;
        else if (cadetYear === '2nd Year') eventStats[eventId].year2++;
        else if (cadetYear === '3rd Year') eventStats[eventId].year3++;
    }
    // Write Strength Overview
    if (strengthSheet.getLastRow() > 1) {
        strengthSheet.getRange(2, 1, strengthSheet.getLastRow() - 1, 6).clearContent();
    }
    const output = [];
    for (const eventId in eventStats) {
        const stats = eventStats[eventId];
        output.push([
            eventId,
            stats.date,
            stats.total,
            stats.year3,
            stats.year2,
            stats.year1
        ]);
    }
    if (output.length > 0) {
        strengthSheet.getRange(2, 1, output.length, 6).setValues(output);
    }
}
/**
 * 2. PROCESS ATTENDANCE SHEET (Categorized)
 */
function processAttendanceSheet() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logsSheet = ss.getSheetByName(LOGS_SHEET);
    const eventMasterSheet = ss.getSheetByName(EVENT_MASTER_SHEET);
    const attendanceSheet = ss.getSheetByName(ATTENDANCE_SHEET);
    if (!logsSheet || !eventMasterSheet || !attendanceSheet) {
        Logger.log("Missing one of the required sheets.");
        return;
    }
    // 1. Map Event IDs to Types
    // Event_Master: [Event ID, Title, Type, ...]
    const eventMasterData = eventMasterSheet.getDataRange().getValues();
    const eventTypeMap = {}; // { 'EVT-123': 'Mandatory Parade' }
    for (let i = 1; i < eventMasterData.length; i++) {
        const eid = eventMasterData[i][0];
        const type = eventMasterData[i][2]; // Assuming Column C is Type
        if (eid) eventTypeMap[eid] = type;
    }
    // 2. Aggregate Attendance Log Counts per EnrollmentID -> Type
    const logs = logsSheet.getDataRange().getValues();
    // { 'KA/22/SD/123': { 'Mandatory Parade': 5, 'Social Service': 2 } }
    const cadetStats = {};
    for (let i = 1; i < logs.length; i++) {
        const eventId = logs[i][1];
        const enrollmentId = logs[i][2];
        const status = logs[i][4]; // Check if status column exists for OD
        if (!enrollmentId || !eventId) continue;
        const type = eventTypeMap[eventId] || 'Others';
        if (!cadetStats[enrollmentId]) {
            cadetStats[enrollmentId] = {
                'Mandatory Parade': 0,
                'Social Service': 0,
                'College Events': 0,
                'Others': 0,
                'Total': 0
            };
        }
        // Determine count weight
        // If status is actually a number (OD hours), we might count differently?
        // For now, let's treat every entry as 1 participation event. 
        // If you want to sum hours, we need to parse valid int from status.
        let count = 1;
        cadetStats[enrollmentId][type] = (cadetStats[enrollmentId][type] || 0) + count;
        cadetStats[enrollmentId]['Total'] += count;
    }
    // 3. Write to 'Attendance' Sheet
    // Expected Columns: Sr No, Enrollment ID, RANK, Year, Name, DEPT, PU ROLL, Mandatory, Social, College, Others, Total
    // We need to read existing rows to match Enrollment IDs and preserve static info (Name, Rank etc).
    // OR we can rebuild it from the Year sheets. Let's assume we update existing rows based on Enrollment ID.
    const attendanceData = attendanceSheet.getDataRange().getValues();
    // Headers are likely row 1.
    // Col Indexes (0-based):
    // 1: Enrollment ID
    // 7: Mandatory Parade (H)
    // 8: Social Drives (I)
    // 9: College Events (J)
    // 10: Others (K)
    // 11: Total (L)
    const updatedData = [];
    for (let i = 1; i < attendanceData.length; i++) {
        const row = attendanceData[i];
        const enrId = row[1]; // Enrollment ID
        if (enrId && cadetStats[enrId]) {
            const stats = cadetStats[enrId];
            // Update the calculated columns
            row[7] = stats['Mandatory Parade'] || 0;
            row[8] = stats['Social Service'] || 0;
            row[9] = stats['College Events'] || 0;
            row[10] = stats['Others'] || 0;
            row[11] = stats['Total'] || 0;
        }
        updatedData.push(row);
    }
    // Write back specific range (Cols H to L) or entire sheet?
    // Updating entire sheet is safer for alignment, but if rows are huge, range is better.
    // Let's write back everything from row 2.
    if (updatedData.length > 0) {
        attendanceSheet.getRange(2, 1, updatedData.length, attendanceData[0].length).setValues(updatedData);
    }
}
/**
 * Helper Map
 */
function getCadetYearMap(ss) {
    const map = {};
    NCC_DATA_SHEETS.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return;
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            const regNo = data[i][1];
            if (regNo) {
                map[regNo.toString().trim()] = sheetName;
            }
        }
    });
    return map;
}