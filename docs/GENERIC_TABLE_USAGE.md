# Generic Data Table Component

## Overview

This is a fully reusable, type-safe data table component that can display any entity from your database with built-in features like search, sort, pagination, and modal support.

## Components

### 1. `GenericDataTable`

The core table component with all features.

### 2. `GenericDataTableModal`

A modal wrapper around the generic table.

### 3. `AllTablesViewer`

A dashboard that displays all database tables with counts and allows viewing each table in a modal.

## Usage Examples

### Basic Usage

```tsx
import {
  GenericDataTable,
  ColumnDef,
} from "@/components/ui/generic-data-table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: ColumnDef<User>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  {
    key: "role",
    header: "Role",
    render: (value) => <Badge>{value}</Badge>,
  },
];

export function UsersTable({ users }: { users: User[] }) {
  return (
    <GenericDataTable
      data={users}
      columns={columns}
      title="Users"
      searchPlaceholder="Search users..."
      onEdit={(user) => console.log("Edit", user)}
      onDelete={(user) => console.log("Delete", user)}
    />
  );
}
```

### Modal Usage

```tsx
import { GenericDataTableModal } from "@/components/ui/generic-data-table";

export function UsersModal({ open, onClose, users }) {
  return (
    <GenericDataTableModal
      open={open}
      onOpenChange={onClose}
      modalTitle="All Users"
      modalDescription="View and manage users"
      data={users}
      columns={columns}
      pageSize={15}
    />
  );
}
```

### All Tables Viewer

```tsx
import { AllTablesViewer } from "@/components/all-tables-viewer";

export default function DatabasePage() {
  return <AllTablesViewer />;
}
```

## Column Definition

```typescript
interface ColumnDef<T> {
  key: string; // Property key from your data
  header: string; // Column header text
  accessor?: (row: T) => any; // Custom accessor function
  render?: (value: any, row: T) => ReactNode; // Custom render function
  sortable?: boolean; // Enable sorting
  filterable?: boolean; // Enable filtering (used for search)
  width?: string; // Column width
}
```

## Props

### GenericDataTable Props

| Prop                | Type                            | Default               | Description              |
| ------------------- | ------------------------------- | --------------------- | ------------------------ |
| `data`              | `T[]`                           | required              | Array of data to display |
| `columns`           | `ColumnDef<T>[]`                | required              | Column definitions       |
| `title`             | `string`                        | -                     | Table title              |
| `description`       | `string`                        | -                     | Table description        |
| `searchable`        | `boolean`                       | `true`                | Enable search            |
| `searchPlaceholder` | `string`                        | `'Search...'`         | Search input placeholder |
| `pageSize`          | `number`                        | `10`                  | Items per page           |
| `onView`            | `(row: T) => void`              | -                     | View action handler      |
| `onEdit`            | `(row: T) => void`              | -                     | Edit action handler      |
| `onDelete`          | `(row: T) => void`              | -                     | Delete action handler    |
| `rowKey`            | `keyof T \| (row: T) => string` | `'id'`                | Unique row identifier    |
| `emptyMessage`      | `string`                        | `'No data available'` | Message when no data     |

## Features

### ✅ Search

- Searches across all filterable columns
- Case-insensitive
- Resets to page 1 on search

### ✅ Sorting

- Click column headers to sort
- Toggle between ascending/descending
- Visual indicator for sort direction

### ✅ Pagination

- Configurable page size
- Previous/Next navigation
- Page counter

### ✅ Actions

- Optional View, Edit, Delete buttons
- Icon-based actions
- Customizable handlers

### ✅ Custom Rendering

- Custom cell renderers
- Default renderers for common types:
  - Booleans → Badges
  - Numbers → Formatted with commas
  - Dates → Localized format
  - Null/undefined → Dash

### ✅ Type Safety

- Full TypeScript support
- Generic type parameter
- Type-safe column definitions

## Customization Examples

### Custom Cell Renderer

```tsx
{
  key: 'status',
  header: 'Status',
  render: (value, row) => (
    <Badge variant={value === 'active' ? 'default' : 'secondary'}>
      {value}
    </Badge>
  )
}
```

### Custom Accessor

```tsx
{
  key: 'fullName',
  header: 'Full Name',
  accessor: (row) => `${row.firstName} ${row.lastName}`,
  sortable: true
}
```

### Computed Values

```tsx
{
  key: 'totalPrice',
  header: 'Total',
  accessor: (row) => row.price * row.quantity,
  render: (value) => `$${value.toFixed(2)}`
}
```

## Database Tables Included

The `AllTablesViewer` component includes configurations for:

1. **Users** - System users and managers
2. **Teachers** - Teaching staff
3. **Students** - Enrolled students
4. **Subjects** - Course subjects
5. **Receipts** - Payment records
6. **Schedules** - Class schedules
7. **Centers** - Education centers

Each table has:

- Proper column definitions
- Status badges
- Formatted values
- Sortable columns
- Search functionality

## Access the Viewer

Navigate to: `/[locale]/admin/database`

Or add it to your navigation menu.
