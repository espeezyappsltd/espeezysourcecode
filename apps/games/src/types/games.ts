export type Game = {
  id: string;
  name: string;
  url: string;
  category_id?: string;
  description?: string;
  image_url?: string;
  author?: string;
  created_at?: string;
  clicked_count?: number;
};

export type Category = {
  id: string;
  name: string;
  games?: Game[];
};
