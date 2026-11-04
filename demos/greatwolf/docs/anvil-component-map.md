# Great Wolf Lodge: component map

Plan element → Anvil component. "Local" means built in `src/components/local/` (see `anvil-upgrade-candidates.md`).

| Plan element | Used in | Component |
| --- | --- | --- |
| Chat thread, bubbles, author | 1–5, 7 | `ChatShell` + `MessageRow` (wrapped by local `AgentChat`) |
| Composer, mic | 1–5, 7 | `PromptInput` (`onVoice`, `listening`) |
| Suggestion / follow-up chips | all chats | `QuickReplyGroup` / `QuickReply` |
| Typing / working state | all chats | `ToolLogLine` (`running`) |
| Tool steps shown to the user | all chats | `ToolLogLine` (`done`) |
| Voice / Live composer state | 2 | `PromptInput` `listening` (waveform) + header "Live" subtitle; no local component needed |
| Suite result card | 2 | `OfferCard` (horizontal) |
| Compare | 2 | `Card` grid |
| Day-plan timeline, status and age tags | 3 | `Timeline` / `TimelineItem` + `Badge`, with `Switch` for sensory-friendly |
| Cited answer, source chips | 5, 6 | `MessageRow` `citations` + `CitationChip`, with a passage `Card` (local `Citations`) |
| Suggested-action card with limit check | 5 | `ApprovalCard` + `ApprovalCardField` + `ShellFooter` |
| Rating | 7 | `RatingScale` (faces) |
| KPI tiles | 6 | `WidgetMetricCard` / `WidgetMetricGroup` |
| Itemized quote card | 1 | Local `QuoteCard` |
| Handoff to a person | 3 | Local `HandoffCard` |
| Ticket status | 4, 5 | Local `TicketStatusCard` (uses `ProgressSteps`) |
| Forecast chart | 6 | Local `ForecastChart` |
| Lock-screen notification | 3, 7 | Local `LockScreen` (demo-only) |
| Device frames | shell | Local `DeviceFrame` (demo-only) |
