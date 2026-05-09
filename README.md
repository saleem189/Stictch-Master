# Tailoring Empire ERP

A sophisticated, bilingual (English/Urdu) Enterprise Resource Planning system built for modern tailoring businesses.

## 🚀 Features

- **Intelligence Dashboard**: Real-time business overview and live tracking.
- **Client Management**: Comprehensive measurement logs and customer history.
- **Operations & Staff**: Employee performance tracking, role-based access, and payroll management.
- **Inventory Control**: Real-time monitoring of fabrics, threads, and supplies.
- **Financial Ledger**: Double-entry accounting with automated reports.
- **Bilingual Interface**: Seamless switching between English and Urdu with full RTL support.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend/DB**: Firebase Auth & Firestore
- **State Management**: React Context API
- **Internationalization**: i18next

## 📖 Documentation

For detailed information, please refer to:
- [**Technical Docs**](./TECHNICAL_DOCS.md): Architecture, Data Models, and Coding Standards.
- [**Agent Instructions**](./AGENTS.md): Context and rules for AI agents working on this project.

## 🚦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🔐 Security
The application uses hardened Firestore Security Rules. Ensure `firestore.rules` is updated and deployed whenever the data schema changes.
