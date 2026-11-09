// Local TypeScript checks for the Deno globals supplied by Supabase Edge Functions.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
