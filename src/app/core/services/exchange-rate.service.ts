import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  last_updated: string;
}

export interface ProductoPrecioConvertidoResponse {
  producto_id: number;
  nombre: string;
  precio_original: number;
  moneda_original: string;
  precio_convertido: number;
  moneda: string;
  tasa: number;
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getLatestRates(): Observable<ExchangeRateResponse> {
    return this.http.get<ExchangeRateResponse>(`${this.baseUrl}/exchange-rates/latest`);
  }

  getPrecioConvertido(productoId: number, moneda: string): Observable<ProductoPrecioConvertidoResponse> {
    return this.http.get<ProductoPrecioConvertidoResponse>(
      `${this.baseUrl}/productos/${productoId}/precio-convertido`,
      { params: { moneda } }
    );
  }
}
