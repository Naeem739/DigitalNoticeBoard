export type Widget = {
    id: string;
    title: string;
    content?: string;
  };
  
export type AspectRatio = '4:3' | '16:9' | '16:10';
  
export type Category = {
    name: string;
    id : string
  };


  export type TNotice = {
    id: string
    title : string
    content: string
    category : string
    categoryId: string 
    createdAt? : Date

  }