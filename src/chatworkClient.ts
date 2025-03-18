interface ChatworkClientRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query: Record<string, string | number | undefined>;
  body: Record<string, string | number | undefined>;
}

export interface ChatworkClientResponse {
  uri: string;
  ok: boolean;
  status: number;
  response: string;
}

export class ChatworkClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request(req: ChatworkClientRequest): Promise<ChatworkClientResponse> {
    const url = new URL(`https://api.chatwork.com/v2${req.path}`);
    Object.entries(req.query)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

    const body = new URLSearchParams();
    Object.entries(req.body)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        body.append(key, String(value));
      });

    const fetchInit: RequestInit = {
      method: req.method,
      headers: {
        'X-ChatWorkToken': this.token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (body.size > 0) {
      fetchInit.body = body;
    }

    const response = await fetch(url.toString(), fetchInit);
    const responseText = await response.text();

    return {
      uri: url.toString(),
      ok: response.ok,
      status: response.status,
      response: responseText,
    };
  }
}
