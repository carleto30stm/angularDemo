import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adjunta withCredentials=true a todas las peticiones HTTP
 * para que el navegador envíe automáticamente la cookie HttpOnly access_token.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
