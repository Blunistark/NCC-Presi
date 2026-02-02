# Google Sheets Setup Guide

To enable the attendance system to write to Google Sheets, you need to set up a Service Account in the Google Cloud Console.

## Step 1: Create a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Face Attendance").

## Step 2: Enable APIs
1. In the sidebar, go to **APIs & Services** > **Library**.
2. Search for **Google Sheets API** and enable it.
3. Search for **Google Drive API** and enable it (required for `gspread` to discover sheets).

## Step 3: Create Service Account
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** and select **Service Account**.
3. Name it (e.g., "attendance-bot") and click **Create and Continue**.
4. (Optional) Role: You can choose **Editor** or skip this step.
5. Click **Done**.

## Step 4: Download Credentials (JSON)
1. In the **Service Accounts** list, click on the email address of the account you just created.
2. Go to the **Keys** tab.
3. Click **Add Key** > **Create new key**.
4. Select **JSON** and click **Create**.
5. A file will download automatically.

## Step 5: Configure Application
1. Rename the downloaded file to `credentials.json`.
2. Move this file to the `backend/data/` directory in your project:
   `d:/NCC/UdaanNCC/backend/data/credentials.json`

## Step 6: Share the Sheet
1. Open your Google Sheet (create one named `FaceAttendance`).
2. Click the **Share** button.
3. Open the `credentials.json` file (text editor) and find the `"client_email"` field.
4. Copy that email address (e.g., `attendance-bot@project-id.iam.gserviceaccount.com`).
5. Paste it into the Share dialog in your Google Sheet and give it **Editor** access.
