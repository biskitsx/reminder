import { IFlexBubble } from '@/domain/services/ILineMessagingService';
import { messagingApi } from '@line/bot-sdk';
type FlexBubble = messagingApi.FlexBubble;
type FlexCarousel = messagingApi.FlexCarousel;

function resolveUri(deepLink: string | null, webUrl: string | null): string | null {
  if (deepLink && (deepLink.startsWith('https://') || deepLink.startsWith('http://'))) return deepLink;
  if (webUrl) return webUrl;
  return null;
}

export function buildFlexCarousel(bubbles: IFlexBubble[]): FlexCarousel {
  return {
    type: 'carousel',
    contents: bubbles.map(buildBubble),
  };
}

function buildAppImageButton(app: { name: string; logoUrl: string; deepLink: string | null; webUrl: string | null }): messagingApi.FlexBox | null {
  const uri = resolveUri(app.deepLink, app.webUrl);
  if (!uri) return null;
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    borderWidth: '1px',
    borderColor: '#e5e7eb',
    cornerRadius: '8px',
    paddingAll: '8px',
    action: { type: 'uri', label: app.name, uri },
    contents: [
      {
        type: 'image',
        url: app.logoUrl,
        size: 'full',
        aspectMode: 'fit',
        aspectRatio: '1:1',
      }
    ],
  };
}

function buildBubble(data: IFlexBubble): FlexBubble {
  const appButtons: messagingApi.FlexComponent[] = [];

  if (data.billingApp) {
    const box = buildAppImageButton(data.billingApp);
    if (box) appButtons.push(box);
  }

  if (data.paymentApp) {
    const box = buildAppImageButton(data.paymentApp);
    if (box) appButtons.push(box);
  }

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
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#fef3c7',
              paddingAll: '4px',
              cornerRadius: '99px',
              contents: [
                {
                  type: 'text',
                  text: `⏰ อีก ${data.daysLeft} วัน`,
                  size: 'sm',
                  weight: 'bold',
                  color: '#d97706',
                },
              ],
            },
          ],
          paddingBottom: '12px',
        },
        ...(appButtons.length > 0
          ? [
              {
                type: 'box' as const,
                layout: 'horizontal' as const,
                spacing: 'sm' as const,
                contents: appButtons,
                paddingBottom: '8px',
              },
            ]
          : []),
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '✅ จ่ายแล้ว',
            data: `MARK_PAID:${data.instanceId}`,
            displayText: 'จ่ายแล้ว',
          },
          style: 'primary',
          color: '#10b981',
        },
      ],
      paddingAll: '16px',
    },
  };
}

