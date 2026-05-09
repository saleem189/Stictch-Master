# Tailoring Empire ERP - Technical Documentation

## Overview
Tailoring Empire is a full-stack digital management system designed for high-end tailoring businesses. It manages the entire lifecycle of a garment from measurement to delivery, including inventory, staff payroll, and financial accounting.

## Architecture

### Frontend (React + Vite)
- **Directory Structure**:
  - `src/components`: Atomic UI components and feature-specific modals.
  - `src/pages`: Top-level route components.
  - `src/contexts`: Global state providers (User/Auth).
  - `src/lib`: Configuration (Firebase, i18n, utilities).
  - `src/types.ts`: TypeScript interface definitions.

### Backend (Firebase)
- **Firestore**: NoSQL database for real-time synchronization.
- **Auth**: Google Authentication.
- **Security**: Hardened Firestore Rules enforcing attribute-based access control (see `firestore.rules`).

## Data Models

| Collection | Description | key Fields |
| :--- | :--- | :--- |
| `users` | Profiles for clients, employees, and admins. | `role`, `phone`, `address`, `measurements` |
| `orders` | Individual work orders/garments. | `status`, `clientId`, `assignedTo`, `dueDate` |
| `inventory` | Stock management for fabrics and tools. | `quantity`, `minStock`, `category` |
| `employees` | Staff records and performance data. | `role`, `salary`, `tasksCompleted` |
| `accounts` | Financial ledger and transactions. | `balance`, `type`, `history` |

## Development Standards

### 1. Internationalization (i18n)
Every string in the UI must be translated.
```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<h1>{t('Dashboard')}</h1>
```

### 2. Styling (Tailwind CSS)
Follow the "Intelligence" aesthetic:
- **Primary Color**: Indigo-600 (`#4f46e5`)
- **Background**: Slate-50/100
- **Borders**: Slate-200
- **Typography**: Inter (Sans-serif)

### 3. Firebase Error Handling
Mandatory wrapping for all async Firestore calls:
```ts
try {
  await addDoc(collection(db, 'path'), data);
} catch (e) {
  handleFirestoreError(e, OperationType.WRITE, 'path');
}
```

## Workflow Lifecycle
1. **Order Entry**: Admin/Employee creates an order linked to a Client.
2. **Assignment**: Order is assigned to an Employee (e.g., Master Tailor).
3. **Production**: Employee updates status as they progress.
4. **Quality Check**: Final inspection before notifying the client.
5. **Delivery/Accounting**: Order is marked as delivered, revenue recorded in Ledger.
