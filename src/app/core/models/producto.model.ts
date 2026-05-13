export interface Producto {
  producto_id: number;
  codigo_ean: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductoListResponse {
  data: Producto[];
  pagination: PaginationInfo;
  timestamp: string;
  traceId?: string;
}

export interface ProductoCreateRequest {
  codigo_ean: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
}

export interface ProductoUpdateRequest {
  codigo_ean?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
}

export interface ErrorDetail {
  target: string;
  code: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  traceId?: string;
  status: number;
  error: string;
  codigo: string;
  message: string;
  path: string;
  details?: ErrorDetail[];
}

export type SortField = 'nombre' | 'precio' | 'stock' | 'productoId';
export type SortDir = 'ASC' | 'DESC';
