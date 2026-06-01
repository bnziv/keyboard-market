export interface BasePrice {
  amount: number;
  currency: string;
}

export interface Item {
  name: string;
  price: number;
  currency: string;
}

export interface Vendor {
  region: string;
  name: string;
  url: string;
}

export interface ApiGroupBuy {
  id: string;
  topicId: string;
  name: string;
  type: string;
  status: string;
  gbStart: string | null;
  gbEnd: string | null;
  estimatedFulfillment: string | null;
  basePrice: BasePrice | null;
  designer: string;
  overview: string | null;
  images: string[];
  sourceUrl: string;
  vendors: Vendor[];
  discordUrl: string | null;
  items: Item[];
}

export interface AdminGroupBuy {
  id?: string;
  topicId?: string;
  name: string;
  type: string;
  status: string;
  designer: string;
  overview: string | null;
  poster: string | null;
  gbStart: string | null;
  gbEnd: string | null;
  estimatedFulfillment: string | null;
  basePrice: BasePrice | null;
  items: Item[];
  vendors: Vendor[];
  discordUrl: string | null;
  sourceUrl: string | null;
  images: string[];
  excludedImages: string[];
  hidden: boolean;
}
