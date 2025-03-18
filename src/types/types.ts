export type Widget = {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  noticeIds?: string;
  topNotices?: TNotice[];
  notices?: TNotice[];
};

export type AspectRatio = '4:3' | '16:9' | '16:10';

export type Category = {
  name: string;
  id: string
};


export type TNotice = {
  id: string
  title: string
  content: string
  category: string
  categoryId: string
  createdAt?: Date

}



export type TDashboard = {
  aspectRatio: string | null
  containers: {
    i: string
    h: number
    w: number
    x: number
    y: number
    title: string | undefined
    id: string
    category: string | undefined
    noticeIds: string | undefined
    width: string
    height: string
  }[]
}


export type TDashboard2 = {
  aspectRatio: string | null,
  notices: TNotice[],
  containers: {
    i: string
    h: number
    w: number
    x: number
    y: number
    title: string | undefined
    id: string
    category: string | undefined
    noticeIds: string[]
    width: string
    height: string
    leftPercent: string 
    leftPx: string 
    topPercent: string 
    topPx: string 
    
  }[]
}


