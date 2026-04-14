import { messagingApi } from '@line/bot-sdk';
import { ILineMessagingService, IFlexBubble } from '@/domain/services/ILineMessagingService';
import { buildFlexCarousel } from './FlexMessageBuilder';

export class LineMessagingService implements ILineMessagingService {
  private client: messagingApi.MessagingApiClient;

  constructor() {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    });
  }

  async sendFlexCarousel(userId: string, bubbles: IFlexBubble[]): Promise<void> {
    const carousel = buildFlexCarousel(bubbles);
    await this.client.pushMessage({
      to: userId,
      messages: [{ type: 'flex', altText: `แจ้งเตือนบิล ${bubbles.length} รายการ`, contents: carousel }],
    });
  }

  async replyText(replyToken: string, text: string): Promise<void> {
    await this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }
}
