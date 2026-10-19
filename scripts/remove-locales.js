const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const localesDir = path.join(
    context.appOutDir,
    context.electronPlatformName === 'darwin' 
      ? 'Contents/Resources' // macOS path varies slightly, look for .lproj
      : 'locales'            // Windows/Linux path
  );

  if (!fs.existsSync(localesDir)) return;

  const files = fs.readdirSync(localesDir);

  files.forEach((file) => {
    // Keep only en-US locales
    if (!file.startsWith('en-US')) {
      const filePath = path.join(localesDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
};