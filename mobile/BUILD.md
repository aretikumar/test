# How to Build the APK

This is a **standalone Android app** — no server needed. Everything runs on your phone.

## What you need

- A computer (Windows, Mac, or Linux)
- Node.js installed (https://nodejs.org — download LTS version)
- An Expo account (free — create at https://expo.dev/signup)

## Step-by-step

### 1. Install tools

Open a terminal/command prompt and run:

```bash
npm install -g eas-cli
```

### 2. Install app dependencies

```bash
cd mobile
npm install
```

### 3. Log in to Expo

```bash
npx eas login
```
Enter your Expo account email and password.

### 4. Build the APK

```bash
npx eas build -p android --profile preview
```

This sends the code to Expo's cloud servers to build the APK (free tier, takes ~10-15 minutes).

When it finishes, you'll see a download URL like:
```
✔ Build finished
🤖 Android build: https://expo.dev/artifacts/eas/xxxxx.apk
```

### 5. Download and install

1. Open that URL on your Android phone (or download on PC and transfer)
2. Tap the .apk file to install
3. If prompted, allow "Install from unknown sources"
4. Open the app!

## How to use the app

1. **Open the app** — you'll see the Dashboard
2. **Go to Settings** → make sure your locations are enabled
3. **Go to Profile** → fill in your details
4. **Tap "Start" on the Dashboard** — monitoring begins
5. **The app checks Amazon Jobs every 5 minutes** for part-time warehouse roles
6. **When a job is found** → it opens in your browser automatically so you can apply fast
7. **You get a push notification** on your phone for each new job

## What the app does

- ✅ Checks Amazon UK Jobs API for part-time warehouse roles
- ✅ Filters: Coventry, Rugby, Daventry, Banbury, Birmingham, Northampton
- ✅ Only part-time jobs (blocks full-time — safe for student visa)
- ✅ Auto-opens matching jobs in your browser for fast application
- ✅ Push notifications when new jobs found
- ✅ Tracks all detected jobs and application history
- ✅ Works in background (checks even when app is minimised)
- ✅ All data stored locally on your phone — no server needed

## Troubleshooting

**"Build failed"** — Make sure you ran `npm install` in the mobile folder first.

**"No jobs found"** — Amazon may not have part-time warehouse roles right now. The app will keep checking.

**Background monitoring stops** — Android may kill background tasks to save battery. Go to your phone's Settings → Apps → Amazon Job Monitor → Battery → set to "Unrestricted".

**Notifications not showing** — Make sure you allowed notification permissions when the app first opened. You can also check Settings → Apps → Amazon Job Monitor → Notifications.
