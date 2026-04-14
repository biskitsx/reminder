import { IFlexBubble } from '@/domain/services/ILineMessagingService';
import { FlexBubble, FlexCarousel } from '@line/bot-sdk';

export function buildFlexCarousel(bubbles: IFlexBubble[]): FlexCarousel {
  return {
    type: 'carousel',
    contents: bubbles.map(buildBubble),
  };
}

function buildBubble(data: IFlexBubble): FlexBubble {
  const actions = [];

  if (data.billingApp) {
    const uri = data.billingApp.deepLink ?? data.billingApp.webUrl ?? '';
    actions.push({
      type: 'uri' as const,
      label: `📱 ดูยอด`,
      uri,
    });
  }

  if (data.paymentApp && (data.paymentApp.deepLink || data.paymentApp.webUrl)) {
    const uri = data.paymentApp.deepLink ?? data.paymentApp.webUrl ?? '';
    actions.push({
      type: 'uri' as const,
      label: `💳 ${data.paymentApp.name}`,
      uri,
    });
  }

  actions.push({
    type: 'postback' as const,
    label: '✅ จ่ายแล้ว',
    data: `MARK_PAID:${data.instanceId}`,
    displayText: 'จ่ายแล้ว',
  });

  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '💳 แจ้งเตือนบิล', size: 'xs', color: '#ffffffcc' },
        { type: 'text', text: data.billName, size: 'xl', weight: 'bold', color: '#ffffff' },
        { type: 'text', text: `ครบกำหนด: ${data.dueDate}`, size: 'sm', color: '#ffffffcc' },
      ],
      backgroundColor: '#7c3aed',
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `⏰ อีก ${data.daysLeft} วัน`,
              size: 'sm',
              weight: 'bold',
              color: '#d97706',
              backgroundColor: '#fef3c7',
              paddingAll: '4px',
              cornerRadius: '99px',
            },
          ],
          paddingBottom: '12px',
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: actions.map((action) => ({
            type: 'button',
            action,
            style: action.type === 'postback' ? 'primary' : 'secondary',
            color: action.type === 'postback' ? '#10b981' : undefined,
            flex: 1,
          })),
        },
      ],
      paddingAll: '16px',
    },
  };
}

