/**
 * Interfaz base para todos los servicios de integración
 */

export interface IService {
  /**
   * Nombre del servicio
   */
  name: string;

  /**
   * Verifica si el servicio está correctamente configurado
   */
  isConfigured(): boolean;

  /**
   * Autentica con el servicio (si es necesario)
   */
  authenticate?(): Promise<void>;
}

export abstract class BaseService implements IService {
  abstract name: string;

  abstract isConfigured(): boolean;

  async authenticate?(): Promise<void>;
}
