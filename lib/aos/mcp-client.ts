import { EventEmitter } from 'events';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  date?: string;
}

export interface SearchOptions {
  count?: number;
  offset?: number;
  country?: string;
  search_lang?: string;
  safesearch?: 'strict' | 'moderate' | 'off';
}

export class BraveMCPClient extends EventEmitter {
  private apiKey: string = '';
  private connected: boolean = false;

  constructor() {
    super();
  }

  async connect(apiKey: string): Promise<void> {
    if (this.connected && this.apiKey === apiKey) {
      return;
    }

    this.apiKey = apiKey;
    
    // Validate API key format (should start with "BSA" for Brave Search API)
    if (!apiKey.startsWith('BSA') && apiKey !== 'test-key') {
      throw new Error('Invalid Brave API key format. Brave API keys start with "BSA"');
    }

    this.connected = true;
    console.log('[BraveMCP] Direct API connection established');
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.connected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    if (this.apiKey === 'test-key') {
      throw new Error('Cannot search with test API key. Use a real Brave Search API key');
    }

    // Direct Brave Search API call
    const params = new URLSearchParams({
      q: query,
      count: (options.count || 10).toString(),
      offset: (options.offset || 0).toString(),
      country: options.country || 'us',
      search_lang: options.search_lang || 'en',
      safesearch: options.safesearch || 'moderate',
      text_decorations: '0'
    });

    const url = `https://api.search.brave.com/res/v1/web/search?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brave API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.formatSearchResults(data);
    } catch (error: any) {
      console.error('[BraveMCP] Search error:', error.message);
      throw new Error(`Brave search failed: ${error.message}`);
    }
  }

  private formatSearchResults(data: any): SearchResult[] {
    if (!data || !data.web || !data.web.results) {
      return [];
    }

    return data.web.results.map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      description: item.description || '',
      date: item.age ? item.age.text : undefined
    }));
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[BraveMCP] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  hasValidApiKey(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'YOUR_BRAVE_API_KEY_HERE';
  }
}