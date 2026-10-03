declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_API_KEY?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    YOUTUBE_CLIENT_ID?: string;
    YOUTUBE_CLIENT_SECRET?: string;
    SOCIAL_TOKEN_ENCRYPTION_KEY?: string;
    TIKTOK_CLIENT_KEY?: string;
    TIKTOK_CLIENT_SECRET?: string;
  }
}
