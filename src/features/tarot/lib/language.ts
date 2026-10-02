export const locales = ["en", "vi"] as const;
export type Locale = (typeof locales)[number];
export const languageCookie = "tarotler-language";
export const isLocale = (value: unknown): value is Locale => value === "en" || value === "vi";

export const galleryCopy = {
  en: {
    about: "About this deck", closeInfo: "Close deck information", close: "Close",
    controls: "Gallery controls", search: "Search cards", closeSearch: "Close search", clear: "Clear",
    searchLabel: "Search cards by name or number", placeholder: "Find a card...", filter: "Filter cards",
    gallery: "Rider-Waite-Smith tarot cards", loading: "Revealing the card", unavailable: "image unavailable",
    empty: "No cards found.", emptyHint: "Try another name or explore the full deck.", reset: "Clear search & filter",
    drag: "Drag", view: "View", artwork: "Artwork by Pamela Colman Smith, 1909.", scans: "Pam-A scans from",
    collection: "Steve P's collection", card: "Card", arcana: "Arcana", element: "Element", zodiac: "Zodiac",
    yesNo: "Yes / No", keywords: "Keywords", reading: "reading", details: "Card details", browse: "Browse cards",
    previous: "Previous card", next: "Next card", fallback: "Vietnamese translation is not published yet. Showing the English reading.",
    image: "In the image", general: "What it can suggest", love: "Love & relationships", work: "Work & study", money: "Money", reflection: "For reflection",
    groups: { "All cards": "All cards", "Major Arcana": "Major Arcana", Wands: "Wands", Cups: "Cups", Swords: "Swords", Pentacles: "Pentacles" },
  },
  vi: {
    about: "Thông tin bộ bài", closeInfo: "Đóng thông tin bộ bài", close: "Đóng",
    controls: "Điều khiển thư viện", search: "Tìm lá bài", closeSearch: "Đóng tìm kiếm", clear: "Xóa",
    searchLabel: "Tìm lá bài theo tên hoặc số", placeholder: "Tìm một lá bài...", filter: "Lọc lá bài",
    gallery: "Bộ bài tarot Rider-Waite-Smith", loading: "Đang tải lá bài", unavailable: "không tải được hình",
    empty: "Không tìm thấy lá bài.", emptyHint: "Thử tên khác hoặc khám phá toàn bộ bài.", reset: "Xóa tìm kiếm và bộ lọc",
    drag: "Kéo", view: "Xem", artwork: "Minh họa bởi Pamela Colman Smith, 1909.", scans: "Bản scan Pam-A từ",
    collection: "bộ sưu tập Steve P", card: "Lá bài", arcana: "Nhóm bài", element: "Nguyên tố", zodiac: "Cung hoàng đạo",
    yesNo: "Có / Không", keywords: "Từ khóa", reading: "diễn giải", details: "Thông tin lá bài", browse: "Duyệt lá bài",
    previous: "Lá trước", next: "Lá tiếp theo", fallback: "Bản tiếng Việt chưa được xuất bản. Đang hiển thị bài đọc tiếng Anh.",
    image: "Trong hình ảnh", general: "Ý nghĩa gợi mở", love: "Tình yêu và các mối quan hệ", work: "Công việc và học tập", money: "Tiền bạc", reflection: "Câu hỏi tự chiêm nghiệm",
    groups: { "All cards": "Tất cả lá bài", "Major Arcana": "Ẩn chính", Wands: "Gậy", Cups: "Cốc", Swords: "Kiếm", Pentacles: "Tiền" },
  },
};

const majorNames = ["Kẻ Khờ", "Nhà Ảo Thuật", "Nữ Tư Tế", "Hoàng Hậu", "Hoàng Đế", "Giáo Hoàng", "Tình Nhân", "Cỗ Xe", "Sức Mạnh", "Ẩn Sĩ", "Bánh Xe Số Phận", "Công Lý", "Người Treo Ngược", "Cái Chết", "Tiết Độ", "Ác Quỷ", "Tòa Tháp", "Ngôi Sao", "Mặt Trăng", "Mặt Trời", "Phán Xét", "Thế Giới"];
const ranks = ["", "Át", "Hai", "Ba", "Bốn", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười", "Tiểu Đồng", "Kỵ Sĩ", "Hoàng Hậu", "Vua"];

export function cardName(card: { name: string; group: string; rank: number }, locale: Locale) {
  if (locale === "en") return card.name;
  if (card.group === "Major Arcana") return majorNames[card.rank] ?? card.name;
  const suit = galleryCopy.vi.groups[card.group as keyof typeof galleryCopy.vi.groups];
  return suit && ranks[card.rank] ? `${ranks[card.rank]} ${suit}` : card.name;
}

export function localizedMetadata(value: string | undefined, locale: Locale) {
  if (!value || locale === "en") return value;
  const values: Record<string, string> = {
    "Major Arcana": "Ẩn chính", "Minor Arcana": "Ẩn phụ", Fire: "Lửa", Water: "Nước", Air: "Khí", Earth: "Đất",
    Yes: "Có", No: "Không", Maybe: "Có thể", Aries: "Bạch Dương", Taurus: "Kim Ngưu", Gemini: "Song Tử", Cancer: "Cự Giải",
    Leo: "Sư Tử", Virgo: "Xử Nữ", Libra: "Thiên Bình", Scorpio: "Bọ Cạp", Sagittarius: "Nhân Mã", Capricorn: "Ma Kết", Aquarius: "Bảo Bình", Pisces: "Song Ngư",
  };
  return values[value] ?? value;
}

export function languageUrl(path: string, locale: Locale) { return `${path}?lang=${locale}`; }
