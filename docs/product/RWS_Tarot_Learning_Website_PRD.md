# PRD — Tarotler, RWS Tarot

**Phiên bản PRD:** 1.9 · **Ngày:** 02/10/2026 · **Trạng thái:** Đồng bộ bản dev Tarotler, Gallery EN/VI và CMS nội dung hai ngôn ngữ; còn QA giao diện và cấu hình deploy.

## 1. Sản phẩm và phạm vi hiện tại

Tarotler là website hỗ trợ tiếng Anh và tiếng Việt để khám phá và học bộ Rider–Waite–Smith (RWS), gồm 78 lá: 22 Major Arcana và 56 Minor Arcana, chia thành Wands, Cups, Swords, Pentacles.

Bản dev hiện tại bao gồm gallery Home, Search/Filter, thông tin nguồn bộ bài, bài đọc cho đủ 78 lá, màn chi tiết toàn màn hình và URL riêng cho từng lá. Tên sản phẩm hiện tại là **Tarotler**, thay cho tên làm việc Arcana Atlas. Phạm vi không còn giới hạn ở Home MVP; màn đọc và nội dung đã có trong code.

| Hạng mục | Trạng thái trong bản dev |
| --- | --- |
| Home `/` | Gallery một viewport, duyệt vòng lặp, Search/Filter, loading/empty/image error và thông tin nguồn ảnh. |
| Nội dung học | Có 78 bài tiếng Anh, lưu trong JSON; mỗi bài có 3 keywords và đủ 6 mục đọc. |
| Chi tiết `/cards/{slug}` | Full-screen article sheet; mở từ Home hoặc URL trực tiếp/reload; có điều hướng lá trước/sau. |
| CMS | Có `/admin`, đăng nhập một admin, editor 78 lá, nháp/preview/publish, metadata biên tập và notes riêng tư; lưu database libSQL. Chưa provision database hosted hoặc deploy CMS. |

Tài liệu mô tả triển khai đang có trong source, không xác nhận mọi tiêu chí đã vượt qua kiểm thử trên trình duyệt hoặc thiết bị thực. Các nhiệm vụ QA được tách ở mục 8.

## 2. Người dùng và mục tiêu

Người mới học tarot có thể khám phá hình ảnh, tìm đúng lá và đọc diễn giải ngắn theo từng chủ đề. Home là trải nghiệm duyệt trực quan, không phải landing page quảng bá hay thư viện dạng lưới.

1. Thấy lá bài ngay khi mở website.
2. Duyệt bộ bài bằng wheel/trackpad, drag/swipe hoặc phím trái/phải.
3. Tìm theo tên, alias hoặc số/cấp bậc; lọc Major Arcana hoặc một chất.
4. Chọn lá để đọc hình ảnh, ý nghĩa và câu hỏi tự phản chiếu.
5. Truy cập hoặc chia sẻ bài đọc qua URL riêng của lá.

**Ngôn ngữ website:** Gallery và màn đọc có switch EN/VI. Bài tiếng Việt được biên tập/publish riêng trong CMS; lá chưa có bản Việt publish sẽ dùng bài tiếng Anh kèm thông báo fallback. Bản seed có đủ 78 bài tiếng Anh, chưa tự động dịch 78 bài sang tiếng Việt. CMS có giao diện admin tiếng Anh, nội dung chỉnh được theo từng ngôn ngữ. PRD viết tiếng Việt. **Đối tượng đọc:** công khai; luồng gallery và bài đọc không yêu cầu tài khoản visitor.

## 3. Home `/`

### 3.1. Bố cục

- Home chiếm một viewport bằng `100svh` với fallback `100vh`, chiều cao tối thiểu 260px. Không có hero marketing, grid danh mục, footer thành section thứ hai hoặc nội dung cuộn dọc bên dưới gallery.
- Header trong suốt phủ trên gallery: wordmark **Tarotler** và icon thông tin 12px, khoảng cách cluster 4px bên trái; Search, Filter và switch **EN / VI** bên phải. Wordmark liên kết về Home và giữ ngôn ngữ.
- Gallery đặt dưới header; lá ở tâm lớn nhất, các lá lân cận nhỏ và mờ dần. Artwork giữ tỷ lệ, không cắt hình.
- Card mặc định hiển thị ảnh. Tên lá xuất hiện phía trên lá tâm khi hover trên desktop hoặc focus-visible bằng bàn phím; không có badge, keyword hay thông tin nhóm/chất trên card gallery.
- Không có nút arrow trái/phải trong gallery hiện tại. Phím trái/phải vẫn điều khiển gallery. Nút Previous/Next nằm trong màn chi tiết.
- Trên thiết bị có chuột, custom cursor đổi từ **Drag** sang **View** khi hover lá tâm đã tải ảnh; không hiển thị khi màn chi tiết mở hoặc khi trỏ vào control/menu. Touch dùng swipe/tap.
- Icon thông tin mở panel nhỏ dưới header, ghi bộ RWS, tác giả Pamela Colman Smith, năm 1909 và liên kết đến bộ scan Pam-A trong Steve P’s collection. Panel dùng font, surface và spacing của gallery, nút Close/Đóng dạng chữ với hover underline; Escape hoặc click ngoài panel đóng được.
- Switch chỉ hiển thị EN / VI, có trạng thái chọn và thao tác bàn phím. Đổi ngôn ngữ giữ Search, Filter và vị trí lá; lưu cookie và cập nhật `?lang=en|vi`. URL direct/reload ưu tiên query rồi cookie. Artwork gốc không dịch.

### 3.2. Dữ liệu và ảnh

- `src/features/tarot/data/cards.json` chứa 78 ID duy nhất, tên, nhóm, rank, alias, đường dẫn ảnh, kích thước và URL nguồn của từng scan.
- Thứ tự: Major Arcana từ The Fool (0) đến The World (21), rồi Wands → Cups → Swords → Pentacles; mỗi chất Ace → 10 → Page → Knight → Queen → King. Rank Minor dùng 1–14.
- Ảnh WebP nằm trong `public/cards/`, gồm bản gốc và biến thể 600px, 800px; dùng `srcset`/`sizes` để trình duyệt chọn ảnh phù hợp. Source hiện có đủ ba biến thể cho cả 78 lá.
- Gallery tái sử dụng 9 button card để biểu diễn vòng lặp, cập nhật ảnh khi card nằm gần viewport. Lá tâm dùng eager loading và fetch priority cao; lá bên cạnh dùng lazy loading. Layout preload ảnh The Fool.
- Khi chờ ảnh, card hiện skeleton với nhãn **Revealing the card**. Khi ảnh gallery lỗi, hiển thị tên lá và **image unavailable** trong cùng khung.
- Nguồn scan: [Steve P — RWS Pam-A](https://steve-p.org/cards/RWSa.html). Source credit và URL nguồn đã có; chúng không thay thế việc xác nhận quyền dùng scan trước phát hành công khai.

### 3.3. Duyệt và chọn lá

- GSAP Observer nhận wheel, touch và pointer; gallery dùng một vị trí chung để render và snap lá về tâm.
- Duyệt vòng lặp hai chiều qua đầu/cuối bộ bài hoặc tập kết quả; không tự chạy.
- Wheel/trackpad nhận trục có delta lớn hơn; sau khi ngừng wheel, gallery snap về lá gần nhất. Drag/swipe ngang có momentum giới hạn và snap khi thả.
- Click/tap lá bên cạnh đưa lá đó về tâm. Click/tap lá tâm mở bài đọc. Drag có cơ chế chặn click ngoài ý muốn sau khi thả.
- Phím ArrowLeft/ArrowRight chuyển lá khi không thao tác trong input, header, Filter hoặc màn chi tiết.
- Với một kết quả, chỉ một card hiển thị; wheel/drag/phím không đổi lá, nhưng vẫn mở được bài đọc.
- Khi Search/Filter đổi, gallery dựng lại vị trí. Từ Home `/` thông thường, lá đầu của tập mới về tâm. Nếu phiên truy cập bắt đầu bằng URL một lá, code ưu tiên lá đó khi nó còn trong tập kết quả, nếu không thì về lá đầu.

### 3.4. Search, Filter và empty state

- Search icon mở input và đưa focus vào; icon đổi thành nút đóng. Escape đóng input, giữ query và trả focus về Search button.
- Search không phân biệt hoa thường hoặc dấu tiếng Việt, trim khoảng trắng và tách query thành các token. Mỗi token phải khớp: token chỉ gồm chữ số so với `rank`, token chữ tìm trong tên Anh/Việt, tên đã publish từ CMS, alias hoặc nhóm.
- Không tìm trong keyword hay nội dung bài đọc. Khi có query, nút **Clear** xóa query trong một thao tác và giữ focus input.
- Filter gồm **All cards, Major Arcana, Wands, Cups, Swords, Pentacles**. Search và Filter kết hợp theo giao hai điều kiện, giữ thứ tự bộ bài.
- Không có kết quả: giữ header và bố cục viewport, hiển thị **No cards found.**, gợi ý tìm lại và nút **Clear search & filter** để về toàn bộ bài.

## 4. Màn chi tiết và URL

### 4.1. Mở và đóng

- Chọn lá tâm từ Home mở article sheet phủ toàn màn hình, trượt lên từ dưới; URL đổi thành `/cards/{slug}` bằng History API, không reload.
- Slug tạo từ tên tiếng Anh, viết thường và nối bằng dấu gạch ngang, ví dụ `/cards/the-fool`.
- Truy cập URL trực tiếp hoặc reload dùng route `src/app/cards/[slug]/page.tsx`, mở cùng article sheet trên gallery; không có layout detail độc lập khác. Slug không hợp lệ trả về not found.
- Nút **Close** và Escape đóng màn đọc. Nếu mở từ gallery, Close quay lại history trước phiên đọc; nếu vào URL trực tiếp, Close thay URL bằng `/` rồi đóng sheet.
- Back/Forward đồng bộ bài đang mở với URL. Search, Filter và vị trí gallery được giữ trong phiên khi mở/đóng bằng History API; không được lưu vào URL hoặc storage để khôi phục sau reload. Click wordmark là điều hướng về Home, không phải cơ chế giữ trạng thái này.
- Màn đọc khóa overflow body, có `role="dialog"`, `aria-modal`, Tab trap và trạng thái inert khi đóng. Khi mở bằng bàn phím, focus chuyển đến Close và được trả về phần tử trước đó khi đóng.
- Chưa có nút **Copy link** riêng; URL trên thanh địa chỉ là đường dẫn chia sẻ hiện tại.

### 4.2. Bố cục đọc

- Màn đọc dùng nền sáng và chữ tối, tương phản với gallery nền tối.
- Desktop: artwork ở cột trái, tên lá ở đầu cột phải và nội dung cuộn riêng bên dưới; hình không bị crop.
- Mobile ở breakpoint 700px trở xuống: tên lá, hình và nội dung xếp một cột; toàn màn đọc cuộn dọc.
- Thanh cuộn mặc định được ẩn; indicator mảnh hiện khi đang cuộn và tự mờ sau đó.
- Cuối bài có **Previous card** và **Next card**, kèm tên lá đích. Điều hướng theo toàn bộ 78 lá, wrap hai chiều, không giới hạn theo Search/Filter của gallery; đổi URL và đưa nội dung bài mới về đầu.

### 4.3. Metadata

Màn đọc hiển thị **Card**, **Arcana**, **Yes / No**, **Keyword**; **Element** và **Zodiac** chỉ hiển thị khi có giá trị.

- Major: số 00–21; Minor: rank 01–14 và tên chất.
- Arcana: Major Arcana hoặc Minor Arcana.
- Element/Zodiac được suy ra trong `src/features/tarot/lib/card-metadata.ts`; không phải mọi lá đều có đủ hai trường.
- Yes / No dùng quy tắc diễn giải trong code, với ba giá trị **Yes**, **No**, **Maybe**. Đây là gợi ý diễn giải, không phải kết quả tiên đoán được kiểm chứng.

## 5. Nội dung học cho 78 lá

Nội dung ban đầu trong `src/features/tarot/data/card-content.json` được seed vào database libSQL; các lần khởi động sau không ghi đè nội dung đã sửa. Home và URL lá bài đọc bản đã publish ở thời điểm request; reload trang sau khi publish để nhận nội dung mới. Có đủ 78 bài, không gọi AI thời gian thực. CMS lưu riêng nguồn gốc nội dung và trạng thái review; bài seed mặc định là Unspecified / Not reviewed.

| Trường dữ liệu | Nhãn hiển thị | Nội dung hiện tại |
| --- | --- | --- |
| `keywords` | Keyword | 3 từ khóa cho mỗi lá, hiển thị bằng chuỗi phân tách dấu phẩy. |
| `image` | In the image | Đoạn mô tả chi tiết artwork. |
| `general` | What it can suggest | Ý nghĩa chung, tách khỏi mô tả hình. |
| `love` | Love & relationships | Góc nhìn quan hệ. |
| `work` | Work & study | Góc nhìn công việc và học tập. |
| `money` | Money | Góc nhìn tiền bạc. |
| `reflection` | For reflection | Câu hỏi tự phản chiếu. |

Định hướng biên tập: ngắn, dễ đọc cho người mới, không khẳng định tương lai chắc chắn; mô tả hình cần khớp artwork. Kiểm tra dữ liệu đã xác nhận 78/78 bài đủ các trường trên, nhưng chưa thay thế review chất lượng nội dung và liên hệ biểu tượng/chiêm tinh.

## 6. Visual và design system hiện tại

- Gallery tối, tối giản, artwork là điểm nhìn chính; header trong suốt và control tiết chế. Màn đọc sáng, ưu tiên nội dung.
- Toàn bộ Gallery, heading màn đọc và CMS dùng **Helvetica Neue** hệ thống, fallback Helvetica → Arial → sans-serif. Heading giữ weight 300 (Light), body 400 (Regular), logo/control nhấn mạnh 500 (Medium). Không tải Saans hoặc Neue Haas Display.
- Tokens dùng CSS `:root` trong `src/app/globals.css`; UI Search/Filter, panel và khung màn đọc dùng góc vuông. Custom cursor và chấm chọn Filter là hình tròn.

| Token/giá trị | Bản dev hiện tại |
| --- | --- |
| `--color-bg` | `#111111` |
| `--color-surface` | `#1b1b1b` |
| `--color-text` | `#f5f3ef` |
| `--color-text-muted` | `#b6b4b0` |
| `--color-accent` | `#c4ad88` |
| `--color-border` | `#ffffff20` |
| `--color-focus` | `#e9d5b5` |
| `--radius` | `0` |
| `--header-height` | `64px` |
| `--page-gutter` | `48px` desktop, `22px` ở breakpoint 640px; header hẹp hơn ở màn rất nhỏ. |
| Nền/chữ article sheet | `#f8f7f5` / `#202020`, đang khai báo trực tiếp trong CSS. |

Tokens đã có cho font, màu, gutter và một số motion/control. Không coi toàn bộ màu, spacing, type và duration đã được token hóa: CSS và GSAP vẫn có giá trị trực tiếp.

Các state đã được xử lý trong code: hover/focus, dragging/snapping, Search/Filter mở, một kết quả, empty, loading/image error gallery và mở/đóng detail. `prefers-reduced-motion` tắt animation/transition CSS, giảm thời gian snap, bỏ giảm scale/opacity giữa các lá và bỏ cursor lag trong thao tác pointer.

## 7. CMS — bản đầu tiên

CMS tại `/admin` đã triển khai cho một admin, với các chức năng:

1. Đăng nhập bằng password hash scrypt, session ký và cookie HTTP-only; API kiểm tra quyền, Origin và giới hạn lượt đăng nhập. Có sign out.
2. Danh sách 78 lá, Search/Filter theo nhóm và trạng thái; chỉnh keywords cùng sáu mục bài đọc.
3. Lưu nháp riêng với bài publish; preview nội dung hiện tại trong editor, kể cả chưa lưu. Publish chỉ nhận bản nháp đã lưu và thay bài công khai trong transaction.
4. Save/publish có kiểm tra revision để chặn ghi đè từ tab cũ; lỗi giữ nội dung trong editor. Có browser recovery để chủ động restore bản chưa lưu.
5. Lưu alt text, nguồn tham khảo, nguồn gốc nội dung, trạng thái review và notes riêng tư. Notes không được gửi vào props của trang công khai.

6. Chọn nội dung **EN / VI** trong editor. Tên lá, keywords, sáu mục đọc và metadata biên tập có document/revision/publish riêng theo ngôn ngữ; publish một ngôn ngữ không ghi đè ngôn ngữ còn lại. Recovery cũng tách theo lá/ngôn ngữ. Dữ liệu CMS tiếng Anh cũ được migrate giữ nguyên draft, published và revision; VI khởi tạo nháp chưa publish.

Database local là `.cms/content.db`, dùng libSQL client; có thể cấu hình database hosted bằng environment variables. CMS dùng Next.js Node runtime, không dùng scaffold Cloudflare D1/Drizzle hiện có. Publish yêu cầu 3–6 keywords không rỗng, mỗi mục đọc tối thiểu 25 ký tự và alt text; nháp cho phép mục đọc chưa hoàn chỉnh. Preview là màn đọc trong studio, không phải bản sao chính xác của sheet công khai.

Đã pass test backend và integration cho auth, nháp/publish, conflict, validation và cách ly notes. QA giao diện desktop/mobile, accessibility và recovery thực tế còn cần làm. Database hosted/deploy chưa cấu hình; xem `docs/cms.md` để setup. Không còn mốc “v1.5 — Learning & editing” gộp màn đọc với CMS.

Ngoài phạm vi hiện tại: bookmark/đã học, đối chiếu lá, nghĩa ngược, trải bài ngẫu nhiên, tài khoản visitor và AI trả lời thời gian thực. Copy link chưa có trong dev và không phải điều kiện bắt buộc của bản đồng bộ này.

## 8. Kiểm chứng và QA

### 8.1. Đã đối chiếu bằng source/dữ liệu

- 78 ID duy nhất; đúng 22 Major và 14 lá cho mỗi chất.
- 78 bài đủ `keywords`, `image`, `general`, `love`, `work`, `money`, `reflection`; mỗi bài có 3 keywords.
- Đủ ảnh gốc, biến thể 600px và 800px cho cả 78 lá.
- Có route từng lá, xử lý History API, full-screen detail, Search/Filter và cấu hình reduced motion trong code.

### 8.2. Checklist nghiệm thu hành vi

Các tiêu chí dưới đây cần kiểm thử thực tế; việc có code không đồng nghĩa đã pass QA.

| ID | Hạng mục | Điều kiện kiểm tra |
| --- | --- | --- |
| H01 | Home | Gallery hiện ngay, một viewport, không có section phụ; header và control không chồng lấn. |
| H02 | Ảnh | Đúng lá, không crop/méo; loading và image error gallery hiển thị rõ. |
| H03 | Duyệt | Wheel/trackpad, drag/swipe và phím trái/phải wrap/snap đúng; drag không vô tình mở bài. |
| H04 | Search/Filter | Token tên/alias/nhóm và rank hoạt động; giao điều kiện đúng; clear, một kết quả và empty không giữ ảnh sai từ tập cũ. |
| H05 | Chi tiết | Click lá tâm mở đúng bài; Close/Escape hoạt động; Previous/Next wrap toàn bộ bộ bài và reset scroll. |
| H06 | URL/history | Direct/reload mở đúng sheet; slug sai trả not found; Back/Forward và Close qua nhiều bài giữ đúng URL và trạng thái gallery trong phiên. |
| H07 | Accessibility | Focus-visible, Tab trap/return focus, accessible names và live announcement dùng được; kiểm tra screen reader và reduced motion. |
| H08 | Responsive | Desktop/mobile, viewport thấp, 200% text zoom và vùng safe area không che control hoặc nội dung. |
| H09 | Hiệu năng | Không tải đồng loạt mọi ảnh; kiểm tra chuyển lá, ảnh hiện chậm và cuộn bài trên mạng/thiết bị thử nghiệm. |
| C01 | CMS | Backend/integration đã pass; còn kiểm tra editor desktop/mobile, keyboard, recovery, lỗi mạng, screen reader và môi trường deploy. |

Usability test đề xuất: 3–5 người mới thử tìm The Star, lọc một chất, duyệt qua điểm nối vòng lặp, mở bài đọc và quay lại gallery. Ghi nhận khả năng nhận ra drag và cách mở lá tâm, nhất là trên touch không có cursor View.

Trước phát hành công khai, review nội dung/metadata, xác nhận quyền dùng scan và hoàn tất QA luồng người đọc. Khi deploy CMS, cấu hình credentials, database lưu bền vững và hoàn tất QA luồng admin; Vercel cần database hosted.

## 9. Căn cứ cập nhật

Đối chiếu với `src/app/page.tsx`, `src/app/cards/[slug]/page.tsx`, `src/features/tarot/components/tarot-explorer.tsx`, `src/features/tarot/data/cards.json`, `src/features/tarot/data/card-content.json`, `src/features/tarot/lib/card-detail.ts`, `src/features/tarot/lib/card-metadata.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/db/schema.ts`, ảnh trong `public/cards/` và README của repo Tarotler.

Các reference thiết kế, đề xuất token và lịch sử chốt Home MVP trong PRD cũ đã được thay bằng mô tả triển khai hiện tại. Đường dẫn source đã được đồng bộ với cấu trúc `src/` sau khi sắp xếp project.
