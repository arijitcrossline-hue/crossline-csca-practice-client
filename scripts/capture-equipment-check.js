const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    useContentSize: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  await window.loadFile(path.join(__dirname, "..", "src", "index.html"));
  await window.webContents.executeJavaScript(`
    currentUser = { email: "student@example.com", username: "Student" };
    showEquipmentCheck();
    document.getElementById("device-scan-status").textContent = "Ready to scan for Windows devices.";
    document.getElementById("camera-device").innerHTML = "<option>Windows system default camera</option>";
    document.getElementById("microphone-device").innerHTML = "<option>Windows system default microphone</option>";
  `);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const image = await window.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, "..", "src", "assets", "landing", "product", "equipment-check.png"), image.toPNG());
  window.destroy();
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
