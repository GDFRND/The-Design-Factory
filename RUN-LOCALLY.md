# Run The Design Factory on any computer

This runs the whole app — website **and** database — on one machine, no
internet service required. The only thing the computer needs is **Node.js**.
No Docker, no database to install.

## 1. Install Node.js (one time)

Download the **LTS** version from **https://nodejs.org** and run the
installer. (Works on Mac and Windows.)

## 2. Get the project folder

Either unzip the `the-design-factory` folder someone shared with you, **or**
clone it: `git clone <repo-url>`.

## 3. Open a terminal in the folder

- **Mac:** right-click the folder → *New Terminal at Folder*.
- **Windows:** open the folder, click the address bar, type `cmd`, press Enter.

## 4. Run two commands

```sh
npm install
npm run demo
```

`npm install` takes a couple of minutes the first time (it downloads the app
*and* a self-contained database). `npm run demo` then sets everything up and
starts the site.

## 5. Open the site

Go to **http://localhost:3000** in your browser.

- Click **Explore demo**, or open **Sign in** and use a brand button:
  **Enter as Rhino Fort**, **Enter as The Regent**, **Enter as El Mara**.
- Or sign in manually:

  | Brand | Email | Password |
  |---|---|---|
  | Rhino Fort Hotel | `demo@rhinofort.co.ke` | `RhinoFort2026` |
  | The Regent Hotel & Travel | `demo@theregent.co.ke` | `Regent2026` |
  | El Mara Hotels & Resorts | `demo@elmara.co.ke` | `ElMara2026` |

**To stop:** press `Ctrl+C` in the terminal.
**To run again later:** just `npm run demo` (skip `npm install`).

## Real AI (optional)

Out of the box the app uses built-in offline stand-ins, so the demo works
with no keys. To turn on real generation, open the **`.env`** file (created on
first run) and paste your keys after `ANTHROPIC_API_KEY=` and
`OPENROUTER_API_KEY=`, then run `npm run demo` again.

## Making a copy to hand to someone else

Zip the folder **without** the big regenerated bits:

```sh
# from inside the folder
zip -r ../the-design-factory-demo.zip . \
  -x "node_modules/*" ".next/*" ".pgdata/*" ".git/*" ".uploads/*"
```

Send that zip. The other person unzips it and follows steps 1–5. Everything
they need (including the database) is rebuilt by `npm install` + `npm run demo`.
