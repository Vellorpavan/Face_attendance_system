# Final Build Instructions (Capacitor Approach)

Since Expo's cloud servers were having trouble with the project configuration, I have created a much more stable version using **Capacitor**. This generates a standard Android project that is easier to build.

## Prerequisites
1.  **Android Studio**: You must have Android Studio installed.
2.  **Java JDK**: Already installed.

## Step 1: Open the Project
1.  Open **Android Studio**.
2.  Select **"Open"** and navigate to your project folder.
3.  Choose the `vite-attendance/android` folder.

## Step 2: Build the APK
1.  Wait for Android Studio to finish "Syncing" (look at the bottom bar).
2.  In the top menu, go to: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Android Studio will compile your app.

## Step 3: Get the File
1.  When finished, a notification will appear at the bottom right. Click **"locate"**.
2.  You will find `app-debug.apk`. 
3.  Rename it to `SVPCET-Attendance.apk` and you are done!

---

### Why this is better:
- **Direct Loading**: The app is hard-coded to load your portal instantly.
- **Full Permissions**: Camera and Internet are pre-configured for face attendance.
- **Reliable**: Bypasses Expo's cloud queue and potential environment errors.
