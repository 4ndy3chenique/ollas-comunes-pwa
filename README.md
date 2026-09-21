# 🍲 Ollas Comunes PWA

> **Plataforma web Offline-First para la trazabilidad logística y gestión nutricional en ollas comunes de Lima Metropolitana**.

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TS-61dafb?logo=react)](https://reactjs.org/)
[![PHP](https://img.shields.io/badge/Backend-PHP%208.x-777bb4?logo=php)](https://www.php.net/)
[![Python](https://img.shields.io/badge/Analytics-Python%203.11%2B-3776ab?logo=python)](https://www.python.org/)
[![Azure](https://img.shields.io/badge/Cloud-Microsoft%20Azure-0078d4?logo=microsoftazure)](https://azure.microsoft.com/)
[![Security](https://img.shields.io/badge/Security-Zero%20Trust%20%7C%20AES--256-green)](#-seguridad-y-cumplimiento-normativo)
[![Normativa](https://img.shields.io/badge/Normativa-Ley%20N.%C2%B0%2029733-blue)](#-seguridad-y-cumplimiento-normativo)

---

## 📌 Descripción del Proyecto

La persistente inseguridad alimentaria en asentamientos periurbanos del país consolida a las ollas comunes como estructuras comunitarias permanentes. Pese a iniciativas censales estatales como Mankachay Perú del MIDIS, estas carecen de mecanismos transaccionales en tiempo real, no integran formulación nutricional demográfica y dependen de conectividad continua, inviable en periferias urbanas con cobertura precaria.

**Ollas Comunes PWA** resuelve esta brecha mediante una arquitectura transaccional **Offline-First** que asegura la continuidad operativa sin conexión continua, garantizando:
1. **Empadronamiento digital:** Validación sintáctica de DNI (Módulo 11) y control de duplicidad inter/intra-ollas.
2. **Cadena de custodia física (FSM):** Seguimiento mediante Máquina de Estados Finitos y tokens QR dinámicos firmados con HMAC.
3. **Optimización nutricional:** Cálculo automatizado de gramajes familiares basado en las tablas del MIDIS.
4. **Sincronización asíncrona:** Persistencia perimetral cifrada (IndexedDB/AES-256-GCM) y reconciliación idempotente (UUIDv4) con Azure Database for MySQL.

---

## 🏗️ Arquitectura del Sistema

```text
ollas-comunes-pwa/
├── client/                     # Cliente PWA: React 18, TypeScript, Vite, IndexedDB, Tailwind CSS
├── backend/                    # Core transaccional: PHP 8.x, FSM, RBAC, API REST, Mock PIDE
├── analytics/                  # Motor analítico: Python 3.11+, algoritmos de cálculo nutricional MIDIS
├── .github/
│   ├── workflows/ci.yml       # Pipeline DevSecOps (Gitleaks, Linters, Pruebas unitarias)
│   ├── ISSUE_TEMPLATE/        # Plantillas para historias de usuario y bugs
│   └── pull_request_template.md # Checklist obligatoria alineada a la Definition of Done (DoD)
├── .gitignore
├── .env.example
└── README.md
