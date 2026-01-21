# Brave Search MCP Integration

## Overview
LLM-Conduit now includes integrated Brave Search capabilities, allowing agents to perform real-time web searches to enhance their proposals with current information, competitive intelligence, and factual verification.

## Setup Instructions

### 1. Get Brave Search API Key
1. Visit https://brave.com/search/api/
2. Sign up for a Brave Search API account
3. Generate an API key (starts with "BSA")

### 2. Configure API Key
Update your `orgfile.yaml` with your Brave API key:

```yaml
api_keys:
  brave:
    key: "BSA_YOUR_ACTUAL_API_KEY_HERE"
```

### 3. Enable Search Tools
The integration is automatically enabled for all agents. Each agent's configuration now includes:

```yaml
team:
  CEO:
    model: deepseek/deepseek-r1:free
    powers: [veto, approve_spend]
    prompt: "You are CEO..."
    tools: [brave_web_search]  # Added automatically
```

## How Agents Use Web Search

### Search Guidelines for Agents
- **Fact Verification**: Use search to verify statistics, dates, and claims
- **Market Intelligence**: Research current trends, competitor activities, industry news
- **Technical Research**: Look up documentation, tutorials, best practices
- **Current Events**: Stay updated with relevant news and developments

### Agent Prompt Integration
Agents now receive these instructions:

```
AVAILABLE TOOLS:
- read_file: Read file contents from local filesystem
- write_file: Write content to a file  
- run_shell: Execute shell commands (requires permission)
- brave_web_search: Search the web using Brave Search API for current information, news, research, or to verify facts

Web Search Guidelines:
- Use brave_web_search when you need current information beyond your knowledge cutoff
- Use it to verify facts, get latest news, research trends, or gather competitive intelligence
- Cite search results in your justification when they support your proposal
- Format search queries to be specific and targeted
```

## Usage Examples

### Market Research Query
```
Goal: "Research our top 3 competitors' recent product launches"
Agent Response: "I'll search for recent product launches from competitors..."
Tool Call: brave_web_search("competitor X product launch 2024")
```

### Technical Verification
```
Goal: "Implement OAuth2 authentication"
Agent Response: "I'll search for current OAuth2 best practices..."
Tool Call: brave_web_search("OAuth2 implementation best practices 2024")
```

### Competitive Analysis
```
Goal: "Analyze market positioning strategy"
Agent Response: "Researching competitor pricing and features..."
Tool Call: brave_web_search("competitor pricing strategy comparison")
```

## UI Enhancements

### Search Results Display
- Web search results appear as formatted cards in the conversation
- Shows title, description, and URL for each result
- Limits to top 3 results to avoid clutter

### Status Indicators
- "Brave MCP: ONLINE" status in the system panel
- Search status indicators in agent messages
- Real-time search query display

### Quick Actions
- Added "Market Research" and "Competitive Analysis" quick action buttons
- One-click search templates for common use cases

## Technical Implementation

### Architecture
- **Direct API Integration**: Uses Brave Search API directly for reliability
- **Embedded Client**: MCP client embedded in ToolExecutor class
- **Secure Storage**: API keys stored in encrypted database
- **Error Handling**: Graceful degradation for API failures

### Configuration Flow
1. Agent initialization loads Brave API key from database
2. ToolExecutor configured with API key
3. Agents can call brave_web_search in proposals
4. Search results formatted and displayed in UI

### Security Features
- API key validation during connection
- Request rate limiting built-in
- Secure key storage in database
- Error handling for invalid keys

## Testing

Run the integration test to verify setup:

```bash
npx tsx scripts/test-brave-integration.ts
```

## Troubleshooting

### Common Issues
1. **Invalid API Key**: Ensure key starts with "BSA"
2. **Connection Issues**: Check internet connectivity
3. **Rate Limits**: Brave API has usage limits
4. **Search Failures**: Verify query formatting

### Error Messages
- `"Invalid Brave API key format"`: Check API key format
- `"Cannot search with test API key"`: Use real API key in production
- `"Brave search failed"`: Network or API issues

## Benefits

### For Decision Making
- **Current Information**: Access to latest market data
- **Fact-Based**: Verifiable information for proposals  
- **Competitive Intelligence**: Real-time competitor monitoring
- **Risk Reduction**: Fact-checking before decisions

### For Agent Capabilities
- **Enhanced Intelligence**: Beyond static knowledge
- **Research Skills**: Systematic information gathering
- **Citation Support**: Evidence-based recommendations
- **Adaptability**: Respond to current events

## Rate Limits & Usage

- **Free Tier**: Limited searches per month
- **Paid Plans**: Higher limits available
- **Built-in Caching**: Avoids duplicate searches
- **Query Optimization**: Specific queries reduce usage

## Future Enhancements

- **Search History**: Track search patterns
- **Advanced Filters**: News, images, videos
- **Result Caching**: Local cache for common queries
- **Multiple Sources**: Additional search providers

---

This integration transforms LLM-Conduit from a static knowledge system to a dynamic, real-time intelligence platform for your organization.