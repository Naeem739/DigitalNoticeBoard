// Existing types
export type AspectRatio = "4:3" | "16:9" | "16:10"

export type TNotice = {
  id: string
  title: string
  content?: string
  // Add other notice properties as needed
}

export type Widget = {
  id: string
  title: string
  content?: string
  categoryId?: string
  category?: string
  notices?: TNotice[]
  topNotices?: TNotice[]
}

// Add the WidgetSettings type
export type WidgetSettings = {
  backgroundColor: string
  backgroundOpacity: number
  cardOpacity: number
  borderColor: string
  borderWidth: number
  fontColor: string
  noticeCount: number
  fontFamily: string
  fontSize: number
  fontWeight: string
  autoScroll: boolean
  showFullContent: boolean
  // Category styling options
  categoryFont: string
  categoryFontSize: number
  categoryFontWeight: string
  categoryFontColor: string
  categoryBackgroundColor: string
  categoryHeight: number
  categoryBorderColor: string
  categoryBorderWidth: number
  // Custom category name for display
  customCategoryName?: string
  // Image widget settings
  imageFit: string
  imageBorderRadius: number
  showImageTitle: boolean
  imageTitleColor: string
  imageTitleFontSize: number
  imageTitleFontWeight: string
}

// Add the Layout type from react-grid-layout
export interface Layout {
  i: string
  x: number
  y: number
  w: number
  h: number
}

// Add the DashboardTemplate type
export type DashboardTemplate = {
  id: string
  name: string
  description: string
  widgets: Widget[]
  layout: Layout[]
  widgetSettings: Record<string, WidgetSettings>
}
