# How to run the demo (plain-English guide)

This runs the whole app on one computer. Nothing to sign up for, no website
to configure. Just follow the steps.

---

## Step 1 — Install Node.js (only needed once)

Go to **https://nodejs.org** and click the big green **LTS** button to
download it. Open the downloaded file and click through the installer like any
normal app (Continue → Install). That's it — you never open it again.

## Step 2 — Unzip the folder

Double-click the `the-design-factory-demo.zip` you were given. It becomes a
folder called **the-design-factory**. Open that folder.

## Step 3 — Start the demo (double-click)

Inside the folder:

- **On a Mac:** find the file called **`Start-Demo.command`**. The first time,
  **right-click it → Open** (a warning may appear — click **Open** again). After
  that first time you can just double-click it.
- **On Windows:** double-click **`Start-Demo.bat`**.

A black window opens and text starts scrolling. **That's normal — it's setting
things up.** The first time takes a few minutes (it's downloading what it
needs). Leave the window alone until it settles.

## Step 4 — Open the site

When the black window shows a line like **`Open http://localhost:3000`** and
stops scrolling, open your web browser (Chrome, Safari, Edge…) and go to:

### **http://localhost:3000**

The site is now running. Click **Explore demo**, or open **Sign in** and pick a
brand: **Enter as Rhino Fort**, **The Regent**, or **El Mara**.

You can also sign in by hand:

| Brand | Email | Password |
|---|---|---|
| Rhino Fort Hotel | `demo@rhinofort.co.ke` | `RhinoFort2026` |
| The Regent Hotel & Travel | `demo@theregent.co.ke` | `Regent2026` |
| El Mara Hotels & Resorts | `demo@elmara.co.ke` | `ElMara2026` |

---

## Stopping and restarting

- **To stop:** close the black window.
- **To run it again another day:** just double-click `Start-Demo.command`
  (Mac) or `Start-Demo.bat` (Windows) again. It's much faster the second time.

## Turning on real AI (optional)

The demo works out of the box using built-in stand-ins, so you don't need any
keys. If you want real AI-generated images and text, open the file named
**`.env`** inside the folder (with TextEdit or Notepad) and paste your keys
after `ANTHROPIC_API_KEY=` and `OPENROUTER_API_KEY=`, then start the demo again.

## If something goes wrong

- **"Node.js isn't installed"** in the black window → do Step 1, then try again.
- **The browser says it can't connect** → the black window is probably still
  setting up; wait for the `http://localhost:3000` line, then refresh.
- Still stuck? Send a photo of the black window's last few lines.
