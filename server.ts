import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Storage configuration for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/upload", upload.fields([{ name: 'project', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), (req: any, res) => {
    const files = req.files;
    
    if (!files || !files['project']) {
      return res.status(400).json({ error: "No se subió el archivo del proyecto (ZIP)." });
    }
    
    const projectFile = files['project'][0];
    const iconFile = files['icon'] ? files['icon'][0] : null;
    
    // Simulate processing
    res.json({
      message: "Archivos recibidos correctamente.",
      projectFilename: projectFile.filename,
      iconFilename: iconFile?.filename || null,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {}
    });
  });

  app.post("/api/build", (req, res) => {
    const { projectFilename, iconFilename, appName, packageName, environment } = req.body;
    
    if (!projectFilename) {
      return res.status(400).json({ error: "No se especificó un archivo de proyecto." });
    }

    console.log(`[BUILD] Iniciando para: ${appName} (${packageName}) en entorno ${environment}`);
    
    res.json({
      status: "started",
      steps: [
        `Detectando entorno: ${environment || 'React'}...`,
        "Cargando dependencias del sistema Koyeb...",
        "Validando integridad del archivo ZIP...",
        `Procesando Icono de Aplicación: ${iconFilename || 'Default Android Icon'}`,
        `Generando AndroidManifest.xml con package=${packageName || 'com.example.app'}`,
        "Inyectando assets de la aplicación...",
        "Ejecutando Capacitor/Gradle Build sync...",
        "Optimizando recursos (Proguard/R8)...",
        "Compilando código nativo (Java/Kotlin)...",
        "Firmando APK con keystore de depuración...",
        "Construcción finalizada. Generando enlace temporal..."
      ]
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
