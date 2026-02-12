"use client";

/**
 * Simple Usage Example for GenericDataTable
 *
 * This demonstrates how to use the generic table with any data type
 */

import {
  GenericDataTable,
  ColumnDef,
} from "@/components/ui/generic-data-table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Example 1: Simple User Table
interface SimpleUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

const userColumns: ColumnDef<SimpleUser>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    filterable: true,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    filterable: true,
  },
  {
    key: "active",
    header: "Status",
    render: (value: boolean) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export function SimpleUserTable() {
  const users: SimpleUser[] = [
    { id: "1", name: "John Doe", email: "john@example.com", active: true },
    { id: "2", name: "Jane Smith", email: "jane@example.com", active: false },
  ];

  return (
    <GenericDataTable
      data={users}
      columns={userColumns}
      title="Users"
      description="Manage system users"
      onEdit={(user) => toast.info(`Edit ${user.name}`)}
      onDelete={(user) => toast.error(`Delete ${user.name}`)}
    />
  );
}

// Example 2: Product Table with Custom Rendering
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

const productColumns: ColumnDef<Product>[] = [
  { key: "name", header: "Product", sortable: true, filterable: true },
  { key: "category", header: "Category", sortable: true },
  {
    key: "price",
    header: "Price",
    sortable: true,
    render: (value: number) => `$${value.toFixed(2)}`,
  },
  {
    key: "stock",
    header: "Stock",
    sortable: true,
    render: (value: number, row: Product) => (
      <Badge
        variant={
          value > 10 ? "default" : value > 0 ? "secondary" : "destructive"
        }
      >
        {value} units
      </Badge>
    ),
  },
];

export function ProductTable() {
  const products: Product[] = [
    {
      id: "1",
      name: "Laptop",
      price: 999.99,
      stock: 5,
      category: "Electronics",
    },
    {
      id: "2",
      name: "Mouse",
      price: 29.99,
      stock: 50,
      category: "Accessories",
    },
    {
      id: "3",
      name: "Keyboard",
      price: 79.99,
      stock: 0,
      category: "Accessories",
    },
  ];

  return (
    <GenericDataTable
      data={products}
      columns={productColumns}
      title="Products"
      searchPlaceholder="Search products..."
      pageSize={20}
      onView={(product) => toast.info(`View ${product.name}`)}
    />
  );
}

// Example 3: Using Custom Accessor
interface Order {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  items: number;
  total: number;
  createdAt: number;
}

const orderColumns: ColumnDef<Order>[] = [
  {
    key: "customerName",
    header: "Customer",
    accessor: (row) => `${row.customerFirstName} ${row.customerLastName}`,
    sortable: true,
    filterable: true,
  },
  {
    key: "items",
    header: "Items",
    sortable: true,
  },
  {
    key: "total",
    header: "Total",
    sortable: true,
    render: (value: number) => `$${value.toFixed(2)}`,
  },
  {
    key: "createdAt",
    header: "Date",
    sortable: true,
  },
];

export function OrderTable() {
  const orders: Order[] = [
    {
      id: "1",
      customerFirstName: "Alice",
      customerLastName: "Johnson",
      items: 3,
      total: 149.97,
      createdAt: Date.now() - 86400000,
    },
  ];

  return (
    <GenericDataTable
      data={orders}
      columns={orderColumns}
      title="Orders"
      description="Recent customer orders"
      rowKey="id"
    />
  );
}
