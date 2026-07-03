
Build and Create Windows Installer (NSIS) for Mstock

Prerequisites:
- Node.js 18+ and npm installed
- Install dependencies: `npm install`

Development icon:
- For development the project uses the uploaded PNG as the window/taskbar icon. You will see it when running `npm run start`.
- The PNG used (already present) is: `Screenshot 2026-07-02 042824.png` at the repository root.

Packaging (Windows/NSIS):
1. Convert the PNG to a proper Windows `.ico` file and place it at `build/icon.ico`.
	 - Using ImageMagick:
		 ```bash
		 magick convert "Screenshot 2026-07-02 042824.png" -resize 256x256 build/icon.ico
		 ```
	 - Or run the included node helper (requires dependencies):
		 ```bash
		 npm install
		 node scripts/convert-icon.js
		 ```
2. Build the installer (electron-builder will read `build/icon.ico`):
```bash
npm run build
```

Output:
- The installer `.exe` will be placed in the `dist/` folder.

Notes:
- `package.json` is already configured to use `build/icon.ico` for packaging. If you want desktop shortcut, license screen or other NSIS options, I can add custom NSIS config.
- During development the app uses the PNG directly so you can immediately see the icon without converting.
