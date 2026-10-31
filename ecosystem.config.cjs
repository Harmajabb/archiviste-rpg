// Configuration de pm2, le "gardien" qui fait tourner le bot sur le serveur :
// il le relance s'il plante, et le redémarre si le serveur redémarre.
module.exports = {
  apps: [
    {
      name: "rp-export-bot",
      script: "src/index.ts",
      interpreter: "node",
      interpreter_args: "--import tsx", // permet à Node de lire le TypeScript
      restart_delay: 5000,              // attend 5 s avant de relancer après un plantage
      max_memory_restart: "400M",       // redémarre si le bot consomme trop de mémoire
    },
  ],
};
