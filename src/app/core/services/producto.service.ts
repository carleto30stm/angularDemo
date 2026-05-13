import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Producto,
  ProductoCreateRequest,
  ProductoListResponse,
  ProductoUpdateRequest
} from '../models/producto.model';

export interface ListarParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  listar(params: ListarParams): Observable<ProductoListResponse> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    return this.http.get<ProductoListResponse>(this.baseUrl, { params: httpParams });
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  crear(producto: ProductoCreateRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, producto);
  }

  actualizar(id: number, producto: ProductoUpdateRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
