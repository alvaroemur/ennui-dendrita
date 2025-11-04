/**
 * Cliente de Reddit API
 * Soporta operaciones de lectura y escritura
 */

import { BaseService } from '../base/service.interface';
import { RedditAuth, RedditCredentials } from './auth';
import { createLogger } from '../../utils/logger';

// Types para compatibilidad con fetch API (usar el tipo global de fetch)

const logger = createLogger('Reddit');

export interface RedditPost {
  title: string;
  text?: string;
  url?: string;
  subreddit: string;
  kind: 'self' | 'link';
}

export interface RedditPostResponse {
  id: string;
  name: string;
  url: string;
  permalink: string;
}

export interface RedditComment {
  text: string;
  parentId: string; // fullname of parent (post or comment)
}

export class RedditClient extends BaseService {
  name = 'Reddit';
  private credentials?: RedditCredentials;
  private accessToken?: string;

  constructor() {
    super();
    if (RedditAuth.isConfigured()) {
      this.credentials = RedditAuth.getCredentials();
    }
  }

  isConfigured(): boolean {
    return RedditAuth.isConfigured();
  }

  async authenticate(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Reddit credentials not configured');
    }

    try {
      this.accessToken = await RedditAuth.getAccessToken();
      logger.info('Reddit authenticated successfully');
    } catch (error) {
      logger.error('Reddit authentication failed', error);
      throw error;
    }
  }

  /**
   * Obtiene el access token actual o solicita uno nuevo
   */
  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  /**
   * Headers base para todas las requests GET
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    const creds = this.credentials!;

    return {
      'Authorization': `Bearer ${token}`,
      'User-Agent': creds.userAgent,
    };
  }

  /**
   * Crea un nuevo post en un subreddit
   */
  async createPost(post: RedditPost): Promise<RedditPostResponse> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const token = await this.getAccessToken();
    const creds = this.credentials!;

    // Reddit API usa application/x-www-form-urlencoded para submit
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': creds.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Preparar datos según el tipo de post
    const params = new URLSearchParams({
      title: post.title,
      sr: post.subreddit,
      kind: post.kind,
    });

    if (post.kind === 'self' && post.text) {
      params.append('text', post.text);
    } else if (post.kind === 'link' && post.url) {
      params.append('url', post.url);
    }

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: headers,
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to create Reddit post', { error, post });
      throw new Error(`Failed to create post: ${error}`);
    }

    const result: any = await response.json();
    
    if (result.json?.errors && result.json.errors.length > 0) {
      throw new Error(`Reddit API error: ${JSON.stringify(result.json.errors)}`);
    }

    const postData = result.json?.data;
    if (!postData) {
      throw new Error('Invalid response from Reddit API');
    }

    return {
      id: postData.id,
      name: postData.name,
      url: `https://reddit.com${postData.permalink}`,
      permalink: postData.permalink,
    };
  }

  /**
   * Obtiene información de un subreddit
   */
  async getSubredditInfo(subreddit: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const headers = await this.getHeaders();

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/about.json`,
      {
        method: 'GET',
        headers: headers,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get subreddit info: ${error}`);
    }

    return await response.json();
  }

  /**
   * Obtiene posts de un subreddit
   */
  async getSubredditPosts(
    subreddit: string,
    limit: number = 10,
    sort: 'hot' | 'new' | 'top' | 'rising' = 'hot'
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const headers = await this.getHeaders();

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`,
      {
        method: 'GET',
        headers: headers,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get posts: ${error}`);
    }

    return await response.json();
  }

  /**
   * Comenta en un post o comentario
   */
  async createComment(comment: RedditComment): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const token = await this.getAccessToken();
    const creds = this.credentials!;

    // Reddit API usa application/x-www-form-urlencoded para comment
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': creds.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const params = new URLSearchParams({
      text: comment.text,
      thing_id: comment.parentId,
    });

    const response = await fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      headers: headers,
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to create Reddit comment', { error, comment });
      throw new Error(`Failed to create comment: ${error}`);
    }

    const result: any = await response.json();

    if (result.json?.errors && result.json.errors.length > 0) {
      throw new Error(`Reddit API error: ${JSON.stringify(result.json.errors)}`);
    }

    return result.json?.data;
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getMe(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const headers = await this.getHeaders();

    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return await response.json();
  }

  /**
   * Obtiene comentarios de un post
   * @param postId - ID del post (fullname, ej: "t3_abc123")
   * @param limit - Número máximo de comentarios a obtener
   */
  async getPostComments(postId: string, limit: number = 100): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const headers = await this.getHeaders();

    // Reddit API usa el formato: /r/{subreddit}/comments/{postId}.json
    // Pero también podemos usar el fullname directamente
    // Para obtener comentarios, necesitamos el permalink del post
    // Alternativamente, podemos usar /api/info?ids={postId}
    
    // Opción más directa: usar el postId como fullname
    const response = await fetch(
      `https://oauth.reddit.com/api/info.json?id=${postId}`,
      {
        method: 'GET',
        headers: headers as HeadersInit,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get post comments: ${error}`);
    }

    const data = await response.json();
    
    // Si tenemos el permalink, podemos obtener los comentarios directamente
    // Para obtener comentarios completos, necesitamos usar el endpoint de comments
    // que requiere el permalink: /r/{subreddit}/comments/{postId}.json
    
    return data;
  }

  /**
   * Obtiene comentarios usando el permalink del post
   * @param permalink - Permalink del post (ej: "/r/opensource/comments/abc123/title/")
   */
  async getCommentsByPermalink(permalink: string, limit: number = 100): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Reddit not configured');
    }

    await this.authenticate();

    const headers = await this.getHeaders();

    // Reddit API endpoint para obtener post + comentarios
    const response = await fetch(
      `https://oauth.reddit.com${permalink}.json?limit=${limit}`,
      {
        method: 'GET',
        headers: headers as HeadersInit,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get comments: ${error}`);
    }

    const data = await response.json();
    
    // La respuesta es un array:
    // [0] = post data
    // [1] = comments data
    return data;
  }
}

