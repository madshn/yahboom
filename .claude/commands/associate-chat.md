---
description: "@mention relay for Cloud Associates. Invoke when user or Bob types @associate to bring them into the conversation."
---

# @mention — Cloud Associate Relay

Brings Cloud Associates into the current conversation via @mentions, like a Slack channel.

## Trigger

This skill activates when:
- User types `@mira ...` (or any registered associate name)
- Bob decides to consult an associate: `Let me ask @mira about this...`

Do NOT invoke this as a slash command. It's a behavior pattern.

## Arguments

```
$ARGUMENTS
```

The arguments contain the full user message including the @mention.

---

## Associate Registry

| Associate | Workflow ID | Chat Webhook |
|-----------|-------------|--------------|
| mira | `iJYT5f31nKcGV6UH` | `https://flow.rightaim.ai/webhook/iJYT5f31nKcGV6UH/chat` |
| aston | `Wh1SR9R7ksNAVblW` | `https://flow.rightaim.ai/webhook/Wh1SR9R7ksNAVblW/chat` |
| leah | `LzjLBWOX0ZPWWgm1` | `https://flow.rightaim.ai/webhook/1813d0c3-b09c-4473-b3d3-b20e77591047/chat` |
| bob | `P1TLiNlN7weVPgdY` | `https://flow.rightaim.ai/webhook/23d684e2-0695-432e-8689-98c640bd7e17/chat` |

**Entourage Router** (single endpoint, requires auth): `https://flow.rightaim.ai/webhook/entourage-router`

---

## Behavior

### Session Management

Maintain ONE sessionId per associate per conversation:

- **First @mention of an associate:** generate `relay-{associate}-{unix_timestamp}`, store it
- **All subsequent @mentions of same associate:** reuse the stored sessionId
- This gives the associate conversation memory across the entire session

### When You See @{associate}

1. **Extract the message** — strip the `@name` prefix, keep the rest as the message
2. **Embed sessionId** in chatInput:
   ```
   [session:{sessionId}] {message}
   ```
3. **Dispatch via Task tool in background** to keep the main thread unblocked:
   ```
   Task(subagent_type="general-purpose", model="haiku", run_in_background=true, description="relay to {associate}", prompt="""
   Call mcp__associates-tools__walkietalkie with:
   - associate: "{associate}"
   - chatInput: "[session:{sessionId}] {message}"
   - sessionId: "{sessionId}"

   Return ONLY the output field from the response.
   Nothing else — no JSON wrapper, no metadata.
   If there was an error or the output field is missing, return: [error] {brief description}
   """)
   ```
4. **Display** with IRC-style prefix when the background agent completes — visually distinct from Bob's text:

```
<mira> {response}
```

Use angle brackets + lowercase name. This reads like a chat participant, not a heading. No bold, no colon — the brackets ARE the formatting.

That's it. Then continue the normal conversation. Don't add commentary around the relay — just show the response like they're in the room.

### Why Subagent

The subagent keeps even a small HTTP response out of the main conversation context. The chat webhook returns only `{ output, sessionId }` (~1K tokens), but isolating it in a haiku subagent keeps the terminal clean and consistent.

### Conversation Feel

The terminal should read like a group chat:

```
User: Hey Bob, what's the status of the kiosk project?

Bob: Kiosk is in Phase 1, scaffolded last week...

User: @mira what's the current opex for our infrastructure?

<mira> The current total opex is ~$20-25/mo. Breakdown:
- Supabase: ~$10/mo
- Render: ~$7/mo
- ForwardEmail: ~$3/mo
No anomalies this week.

User: @mira can you check if n8n is healthy?

<mira> Checking now... n8n (srv-d07ld4uibrs73fjkhhg) is running
normally. Last deploy was 2 days ago, uptime 99.9%.

User: Thanks. Bob, let's move on to the roadmap.
```

### What Bob Can Do

Bob can also @mention associates when it's useful:

- **Consulting:** "Let me check with @mira on the infrastructure status"
- **Delegating:** "I'll ask @mira to verify the deploy went through"
- **Cross-referencing:** "@mira, Bob here — can you confirm the cost baseline?"

When Bob @mentions, use the same relay mechanism. Prefix Bob's message with `[caller:bob]` context:
```
[session:{sessionId}] [caller:bob] {bob's question}
```

### Always Use @mention, Never Raw Walkietalkie

In-office sessions must **always** use the `@name` pattern for inter-associate communication. Never call `walkietalkie` MCP tool directly — the @mention relay handles session management, background dispatch, and clean terminal formatting automatically.

```
✓ CORRECT:  @mira what's the current opex?
✗ INCORRECT: walkietalkie(associate="mira", chatInput="what's the current opex?")
```

---

## Edge Cases

- **Associate not in registry:** "I don't have a relay configured for @{name}. Known associates: mira, aston, leah, bob."
- **Router unreachable:** "Can't reach @{name} — the Entourage Router returned an error. Check workflow fHE0C4plcdOqhdzt at flow.rightaim.ai."
- **Execution error:** Show the error briefly, don't dump raw JSON. "`<mira>` [error] Max iterations reached — she got stuck in a tool loop. Try a simpler question."
- **Response time:** Each relay takes ~5-15s. Don't apologize for it, just show the response when it arrives.
