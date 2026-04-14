export interface IFlexBubble {
  instanceId: string;
  billName: string;
  dueDate: string;     // formatted Thai date e.g. "5 เม.ย. 2026"
  daysLeft: number;
  paymentApp: { name: string; deepLink: string | null; webUrl: string | null } | null;
  billingApp: { name: string; deepLink: string | null; webUrl: string | null } | null;
}

export interface ILineMessagingService {
  sendFlexCarousel(userId: string, bubbles: IFlexBubble[]): Promise<void>;
  replyText(replyToken: string, text: string): Promise<void>;
}
