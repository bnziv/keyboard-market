export interface BasePrice {
  amount: number;
  currency: string;
}

export interface Item {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

export interface Vendor {
  region: string;
  name: string;
  url: string;
}

interface GroupBuyBase {
  name: string;
  type: string;
  status: string;
  designer: string;
  overview: string | null;
  gbStart: string | null;
  gbEnd: string | null;
  estimatedFulfillment: string | null;
  basePrice: BasePrice | null;
  items: Item[];
  vendors: Vendor[];
  discordUrl: string | null;
  images: string[];
}

export interface ApiGroupBuy extends GroupBuyBase {
  id: string;
  topicId: string;
  sourceUrl: string;
  featured?: boolean;
}

export interface AdminGroupBuy extends GroupBuyBase {
  id?: string;
  topicId?: string;
  sourceUrl: string | null;
  poster: string | null;
  excludedImages: string[];
  hidden: boolean;
  featured?: boolean;
}
