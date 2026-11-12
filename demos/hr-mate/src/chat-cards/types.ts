// A subset of the Google Chat Cards v2 shape (https://developers.google.com/workspace/chat/api/reference/rest/v1/cards),
// enough for the cards HR Mate sends. Engineers can lift the JSON in this folder as the starting payloads.
export type CardAction = { action: { function: string; parameters?: { key: string; value: string }[] } } | { openLink: { url: string } }

export interface CardButton {
  text: string
  onClick: CardAction
  type?: 'FILLED' | 'OUTLINED' | 'BORDERLESS'
}

export type Widget =
  | { textParagraph: { text: string } }
  | { buttonList: { buttons: CardButton[] } }
  | { decoratedText: { topLabel?: string; text: string; bottomLabel?: string; startIcon?: { knownIcon: string } } }
  | { divider: Record<string, never> }

export interface CardSection {
  header?: string
  widgets: Widget[]
}

export interface CardV2 {
  cardId: string
  card: {
    header?: { title: string; subtitle?: string; imageType?: 'CIRCLE' | 'SQUARE' }
    sections: CardSection[]
  }
}

export interface ChatMessage {
  cardsV2: CardV2[]
}
