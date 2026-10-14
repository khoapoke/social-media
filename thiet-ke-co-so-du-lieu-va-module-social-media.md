# Thiết kế cơ sở dữ liệu và module cho ứng dụng mạng xã hội

> **Phạm vi:** Ứng dụng mạng xã hội quy mô nhỏ đến vừa, tập trung vào
> chức năng người dùng trước; phần quản trị viên (admin) sẽ thiết kế
> sau.\
> **Stack tham khảo:** TypeScript + Express + Prisma + PostgreSQL. Mô
> hình dữ liệu cũng có thể áp dụng cho Java Spring Boot.

## Mục lục

1.  [Phạm vi ứng dụng](#i-phạm-vi-ứng-dụng)
2.  [Tổng quan cơ sở dữ liệu](#ii-tổng-quan-cơ-sở-dữ-liệu)
3.  [Chi tiết các bảng](#iii-chi-tiết-các-bảng)
4.  [Các bảng mở rộng](#iv-các-bảng-mở-rộng)
5.  [Sơ đồ quan hệ tổng thể](#v-sơ-đồ-quan-hệ-tổng-thể)
6.  [Thiết kế module backend](#vi-thiết-kế-module-backend)
7.  [Cấu trúc thư mục backend](#vii-cấu-trúc-thư-mục-backend)
8.  [Các quy tắc thiết kế cơ sở dữ
    liệu](#viii-các-quy-tắc-thiết-kế-cơ-sở-dữ-liệu)
9.  [Thứ tự triển khai](#ix-thứ-tự-triển-khai)
10. [Bộ bảng đề xuất cho phiên bản
    đầu](#x-bộ-bảng-đề-xuất-cho-phiên-bản-đầu)

------------------------------------------------------------------------


## I. Phạm vi ứng dụng

Không nên cố gắng xây dựng tất cả chức năng của Facebook hoặc Instagram
ngay từ đầu. Với ứng dụng nhỏ hoặc vừa, có thể chia thành ba giai đoạn.

  -----------------------------------------------------------------------
  Giai đoạn                           Chức năng
  ----------------------------------- -----------------------------------
  **Giai đoạn 1 --- Cốt lõi**         Đăng ký, đăng nhập, hồ sơ cá nhân,
                                      bài viết, bình luận, thích bài
                                      viết, kết bạn, bảng tin

  **Giai đoạn 2 --- Tương tác**       Chia sẻ bài viết, thông báo, theo
                                      dõi người dùng, tìm kiếm, lưu bài
                                      viết

  **Giai đoạn 3 --- Mở rộng**         Nhắn tin, gửi ảnh/video, nhóm,
                                      story, gắn thẻ người dùng
  -----------------------------------------------------------------------

Nên thiết kế và triển khai **giai đoạn 1 trước**.

Facebook thiên về quan hệ bạn bè hai chiều, còn Instagram sử dụng quan
hệ theo dõi một chiều. Nếu ứng dụng muốn hỗ trợ cả hai kiểu, cần thiết
kế riêng hai loại quan hệ ngay từ đầu.

## II. Tổng quan cơ sở dữ liệu

Với phạm vi hiện tại, có thể cân nhắc khoảng 13 bảng cốt lõi và mở rộng.
Không nhất thiết phải tạo tất cả ngay trong migration đầu tiên; hãy
triển khai dựa trên nghiệp vụ thực tế.

  -------------------------------------------------------------------------
                    STT Bảng              Chức năng        Mức độ
  --------------------- ----------------- ---------------- ----------------
                      1 `users`           Tài khoản người  Bắt buộc
                                          dùng             

                      2 `user_profiles`   Thông tin hồ sơ  Bắt buộc
                                          cá nhân          

                      3 `user_sessions`   Phiên đăng nhập, Nên có nếu quản
                                          refresh token    lý phiên

                      4 `friendships`     Lời mời và quan  Bắt buộc nếu
                                          hệ bạn bè        dùng kiểu
                                                           Facebook

                      5 `posts`           Bài viết         Bắt buộc

                      6 `post_media`      Ảnh/video đính   Bắt buộc nếu có
                                          kèm bài viết     media

                      7 `post_likes`      Lượt thích bài   Bắt buộc
                                          viết             

                      8 `comments`        Bình luận và trả Bắt buộc
                                          lời bình luận    

                      9 `comment_likes`   Lượt thích bình  Có thể bổ sung
                                          luận             

                     10 `post_shares`     Lịch sử chia sẻ  Giai đoạn 2
                                          bài viết         

                     11 `post_saves`      Bài viết đã lưu  Giai đoạn 2

                     12 `notifications`   Thông báo        Giai đoạn 2

                     13 `follows`         Quan hệ theo dõi Nếu hỗ trợ kiểu
                                          người dùng       Instagram
  -------------------------------------------------------------------------

------------------------------------------------------------------------

## III. Chi tiết các bảng

### 1. `users` --- Tài khoản người dùng

Lưu thông tin phục vụ xác thực và quản lý tài khoản.

  -----------------------------------------------------------------------
  Thuộc tính              Kiểu PostgreSQL         Ý nghĩa
  ----------------------- ----------------------- -----------------------
  `id`                    `UUID`                  Khóa chính

  `username`              `VARCHAR(30)`           Tên người dùng duy nhất

  `email`                 `VARCHAR(255)`          Email đăng nhập

  `password_hash`         `VARCHAR(255)`          Mật khẩu đã được băm

  `status`                `VARCHAR(20)`           Trạng thái tài khoản

  `email_verified_at`     `TIMESTAMPTZ`, nullable Thời điểm xác thực
                                                  email

  `created_at`            `TIMESTAMPTZ`           Ngày tạo tài khoản

  `updated_at`            `TIMESTAMPTZ`           Ngày cập nhật
  -----------------------------------------------------------------------

**Quy tắc cần lưu ý:**

-   `id` là khóa chính.
-   `username` và `email` cần có ràng buộc `UNIQUE`.
-   Cần thống nhất cách chuẩn hóa email và username, đặc biệt với chữ
    hoa/chữ thường.
-   Không bao giờ lưu mật khẩu dạng văn bản thuần. Dùng thuật toán băm
    mật khẩu phù hợp như Argon2id hoặc bcrypt.
-   `status` có thể có các giá trị như `ACTIVE`, `SUSPENDED`, `DELETED`.
-   Nên tách thông tin xác thực khỏi thông tin hồ sơ hiển thị bằng bảng
    `user_profiles`.

### 2. `user_profiles` --- Hồ sơ cá nhân

Lưu thông tin hiển thị trên trang cá nhân.

  Thuộc tính        Kiểu PostgreSQL           Ý nghĩa
  ----------------- ------------------------- --------------------------------------------
  `user_id`         `UUID`                    Khóa chính, đồng thời là FK đến `users.id`
  `display_name`    `VARCHAR(100)`            Tên hiển thị
  `bio`             `VARCHAR(500)`            Giới thiệu bản thân
  `avatar_url`      `TEXT`, nullable          Đường dẫn ảnh đại diện
  `cover_url`       `TEXT`, nullable          Đường dẫn ảnh bìa
  `date_of_birth`   `DATE`, nullable          Ngày sinh
  `gender`          `VARCHAR(20)`, nullable   Giới tính nếu cần
  `privacy`         `VARCHAR(20)`             Chế độ riêng tư
  `created_at`      `TIMESTAMPTZ`             Ngày tạo
  `updated_at`      `TIMESTAMPTZ`             Ngày cập nhật

Quan hệ:

``` text
users 1 ───────── 1 user_profiles
```

Mỗi tài khoản có tối đa một hồ sơ cá nhân. Tách bảng giúp phân biệt dữ
liệu xác thực với dữ liệu hiển thị. Với ứng dụng rất nhỏ, có thể gộp hồ
sơ vào `users`, nhưng cần chấp nhận rằng bảng tài khoản sẽ chứa nhiều
loại thông tin hơn.

`avatar_url` và `cover_url` chỉ nên lưu đường dẫn. Tệp ảnh thực tế có
thể được lưu ở object storage hoặc dịch vụ lưu trữ tệp, thay vì lưu trực
tiếp vào PostgreSQL dưới dạng dữ liệu nhị phân.

### 3. `user_sessions` --- Phiên đăng nhập

Hữu ích khi dùng JWT kết hợp refresh token, cần đăng xuất khỏi thiết bị
hoặc thu hồi phiên đăng nhập.

  Thuộc tính             Kiểu PostgreSQL            Ý nghĩa
  ---------------------- -------------------------- -------------------------------
  `id`                   `UUID`                     Khóa chính
  `user_id`              `UUID`                     FK đến `users.id`
  `refresh_token_hash`   `TEXT`                     Giá trị băm của refresh token
  `device_name`          `VARCHAR(255)`, nullable   Tên thiết bị
  `expires_at`           `TIMESTAMPTZ`              Thời điểm hết hạn
  `revoked_at`           `TIMESTAMPTZ`, nullable    Thời điểm thu hồi
  `created_at`           `TIMESTAMPTZ`              Thời điểm tạo phiên

Quan hệ:

``` text
users 1 ───────── N user_sessions
```

Một người dùng có thể đăng nhập trên nhiều thiết bị. Không nên lưu
refresh token nguyên bản nếu không cần thiết; lưu giá trị băm sẽ giảm
rủi ro khi dữ liệu bị lộ. Nếu phiên bản đầu chưa triển khai refresh
token, có thể để bảng này sang giai đoạn sau.

### 4. `posts` --- Bài viết

  Thuộc tính     Kiểu PostgreSQL           Ý nghĩa
  -------------- ------------------------- -------------------------------
  `id`           `UUID`                    Khóa chính
  `user_id`      `UUID`                    FK đến `users.id`, người đăng
  `content`      `TEXT`                    Nội dung bài viết
  `visibility`   `VARCHAR(20)`             Phạm vi người xem
  `status`       `VARCHAR(20)`             Trạng thái bài viết
  `created_at`   `TIMESTAMPTZ`             Thời điểm đăng
  `updated_at`   `TIMESTAMPTZ`             Thời điểm chỉnh sửa
  `deleted_at`   `TIMESTAMPTZ`, nullable   Thời điểm xóa mềm

Các giá trị gợi ý cho `visibility`:

-   `PUBLIC`: Mọi người có thể xem.
-   `FRIENDS`: Chỉ bạn bè được xem.
-   `PRIVATE`: Chỉ chủ bài viết được xem.

Các giá trị gợi ý cho `status`:

-   `PUBLISHED`: Đã đăng.
-   `DRAFT`: Bản nháp.

Quan hệ:

``` text
users 1 ───────── N posts
```

Một người dùng có thể đăng nhiều bài viết; mỗi bài viết thuộc về một
người đăng.

**Có nên lưu `like_count`, `comment_count`, `share_count` ngay không?**

Ở giai đoạn đầu, chưa nhất thiết phải lưu các trường đếm này trong
`posts`. Có thể tính số lượt thích từ `post_likes`, số bình luận từ
`comments`. Khi hệ thống lớn hơn, việc tính lại liên tục có thể tốn tài
nguyên; lúc đó có thể bổ sung các trường đếm được cập nhật có kiểm soát
hoặc cơ chế tổng hợp riêng.

### 5. `post_media` --- Ảnh và video đính kèm

Một bài viết có thể không có media, có một ảnh hoặc có nhiều ảnh/video.
Vì vậy, nếu muốn hỗ trợ nhiều tệp, không nên chỉ tạo một trường
`image_url` trong `posts`.

  Thuộc tính        Kiểu PostgreSQL    Ý nghĩa
  ----------------- ------------------ ----------------------
  `id`              `UUID`             Khóa chính
  `post_id`         `UUID`             FK đến `posts.id`
  `media_type`      `VARCHAR(20)`      `IMAGE` hoặc `VIDEO`
  `media_url`       `TEXT`             Đường dẫn tệp
  `thumbnail_url`   `TEXT`, nullable   Ảnh xem trước
  `position`        `INTEGER`          Thứ tự hiển thị
  `created_at`      `TIMESTAMPTZ`      Thời điểm tạo

Quan hệ:

``` text
posts 1 ───────── N post_media
```

Ví dụ: bài viết "Hôm nay đi chơi vui quá!" có thể đính kèm ba ảnh. Bảng
`posts` lưu nội dung, còn `post_media` có ba bản ghi tương ứng với ba
ảnh. Thiết kế này tránh việc phải tạo các cột kiểu `image_url_1`,
`image_url_2`, `image_url_3`.

### 6. `post_likes` --- Thích bài viết

  Thuộc tính     Kiểu PostgreSQL   Ý nghĩa
  -------------- ----------------- -------------------
  `user_id`      `UUID`            FK đến `users.id`
  `post_id`      `UUID`            FK đến `posts.id`
  `created_at`   `TIMESTAMPTZ`     Thời điểm thích

Có thể sử dụng khóa chính kép:

``` sql
PRIMARY KEY (user_id, post_id)
```

Quan hệ logic:

``` text
users 1 ───── N post_likes N ───── 1 posts
```

Đây là quan hệ nhiều-nhiều giữa người dùng và bài viết:

-   Một người dùng có thể thích nhiều bài viết.
-   Một bài viết có thể được nhiều người thích.
-   Một người dùng chỉ được thích một bài viết một lần.

Khóa chính kép ngăn việc một người dùng thích cùng bài viết nhiều lần.
Khi bỏ thích, xóa bản ghi tương ứng. Nếu sau này muốn hỗ trợ nhiều loại
cảm xúc, có thể bổ sung `reaction_type`.

### 7. `comments` --- Bình luận và trả lời bình luận

Nên cân nhắc hỗ trợ trả lời bình luận ngay từ đầu. Có thể dùng
`parent_comment_id` để biểu diễn bình luận lồng nhau, không cần tạo bảng
`replies` riêng.

  -----------------------------------------------------------------------
  Thuộc tính              Kiểu PostgreSQL         Ý nghĩa
  ----------------------- ----------------------- -----------------------
  `id`                    `UUID`                  Khóa chính

  `post_id`               `UUID`                  FK đến `posts.id`

  `user_id`               `UUID`                  FK đến `users.id`

  `parent_comment_id`     `UUID`, nullable        FK tự tham chiếu đến
                                                  `comments.id`

  `content`               `TEXT`                  Nội dung bình luận

  `created_at`            `TIMESTAMPTZ`           Thời điểm tạo

  `updated_at`            `TIMESTAMPTZ`           Thời điểm chỉnh sửa

  `deleted_at`            `TIMESTAMPTZ`, nullable Thời điểm xóa mềm
  -----------------------------------------------------------------------

Nếu bình luận trực tiếp vào bài viết, `parent_comment_id = NULL`. Nếu là
trả lời, trường này trỏ đến bình luận cha.

Ví dụ:

``` text
Bài viết: Hôm nay đi chơi vui quá!
├── Bình luận A: Đi đâu vậy bạn?
│   ├── Bình luận B: Đi Đà Lạt á.
│   └── Bình luận C: Đẹp không bạn?
└── Bình luận D: Chụp hình đẹp quá!
```

Bình luận A và D có `parent_comment_id = NULL`; bình luận B và C trỏ đến
bình luận A.

**Quy tắc nghiệp vụ cần có:**

-   Kiểm tra bài viết có tồn tại và người dùng có quyền xem hay không.
-   Nếu có `parent_comment_id`, kiểm tra bình luận cha có thuộc cùng bài
    viết hay không.
-   Quy định giới hạn độ sâu bình luận để tránh truy vấn cây quá phức
    tạp.
-   Xác định cách xử lý khi bài viết bị xóa nhưng bình luận vẫn tồn tại.
    Với xóa mềm, có thể giữ dữ liệu để bảo toàn tính nhất quán nhưng ẩn
    nội dung khỏi người dùng.

### 8. `friendships` --- Lời mời và quan hệ bạn bè

Đây là bảng quản lý quan hệ bạn bè hai chiều, phù hợp với kiểu Facebook.

  Thuộc tính       Kiểu PostgreSQL   Ý nghĩa
  ---------------- ----------------- ---------------------------------------
  `id`             `UUID`            Khóa chính
  `requester_id`   `UUID`            FK đến `users.id`, người gửi lời mời
  `addressee_id`   `UUID`            FK đến `users.id`, người nhận lời mời
  `status`         `VARCHAR(20)`     Trạng thái quan hệ
  `created_at`     `TIMESTAMPTZ`     Thời điểm gửi lời mời
  `updated_at`     `TIMESTAMPTZ`     Thời điểm cập nhật

Các trạng thái gợi ý:

-   `PENDING`: Đang chờ phản hồi.
-   `ACCEPTED`: Đã trở thành bạn bè.
-   `REJECTED`: Lời mời bị từ chối.
-   `CANCELED`: Người gửi đã hủy lời mời.

Ví dụ, A gửi lời mời cho B:

``` text
requester_id = A
addressee_id = B
status = PENDING
```

Khi B chấp nhận, cập nhật trạng thái thành `ACCEPTED`; không cần tạo một
bản ghi ngược chiều.

**Các quy tắc bắt buộc:**

1.  Không cho phép gửi lời mời kết bạn cho chính mình.
2.  Không cho phép đồng thời tồn tại cả A → B và B → A.
3.  Không cho phép một cặp người dùng có nhiều lời mời đang chờ.
4.  Chỉ người nhận mới được chấp nhận hoặc từ chối lời mời.
5.  Chỉ người có quyền mới được hủy lời mời hoặc hủy kết bạn.

Lưu ý: `UNIQUE(requester_id, addressee_id)` chỉ ngăn trùng theo đúng
chiều, chưa ngăn A → B và B → A cùng tồn tại. Có thể bảo đảm tính duy
nhất bằng cách chuẩn hóa cặp ID theo thứ tự và tạo ràng buộc phù hợp,
hoặc xử lý bằng transaction kết hợp khóa dữ liệu. Cần thiết kế cách lưu
trạng thái sao cho vẫn giữ được người gửi và người nhận ban đầu.

### 9. `follows` --- Quan hệ theo dõi (tùy chọn)

Không bắt buộc nếu ứng dụng chỉ sử dụng kết bạn hai chiều. Bảng này phù
hợp khi muốn có trải nghiệm kiểu Instagram.

  Thuộc tính       Kiểu PostgreSQL   Ý nghĩa
  ---------------- ----------------- ---------------------
  `follower_id`    `UUID`            Người theo dõi
  `following_id`   `UUID`            Người được theo dõi
  `created_at`     `TIMESTAMPTZ`     Thời điểm theo dõi

Khóa chính kép:

``` sql
PRIMARY KEY (follower_id, following_id)
```

Quan hệ có hướng: A theo dõi B không có nghĩa B theo dõi A.

-   **Ứng dụng thiên về Facebook:** ưu tiên `friendships`.
-   **Ứng dụng thiên về Instagram:** ưu tiên `follows`.
-   **Ứng dụng kết hợp cả hai:** giữ hai bảng riêng biệt vì quy tắc
    nghiệp vụ của chúng khác nhau.

------------------------------------------------------------------------

## IV. Các bảng mở rộng

### 1. `comment_likes` --- Thích bình luận

  Thuộc tính     Kiểu PostgreSQL   Ý nghĩa
  -------------- ----------------- ----------------------
  `user_id`      `UUID`            Người thích
  `comment_id`   `UUID`            Bình luận được thích
  `created_at`   `TIMESTAMPTZ`     Thời điểm thích

Khóa chính kép:

``` sql
PRIMARY KEY (user_id, comment_id)
```

### 2. `post_shares` --- Chia sẻ bài viết

  Thuộc tính     Kiểu PostgreSQL    Ý nghĩa
  -------------- ------------------ -----------------------
  `id`           `UUID`             Khóa chính
  `post_id`      `UUID`             Bài viết được chia sẻ
  `user_id`      `UUID`             Người chia sẻ
  `caption`      `TEXT`, nullable   Nội dung kèm theo
  `created_at`   `TIMESTAMPTZ`      Thời điểm chia sẻ

Thiết kế này giả định chia sẻ là tạo một hoạt động chia sẻ bài viết có
sẵn, không sao chép toàn bộ nội dung thành một bài viết mới. Cần quyết
định liệu một người dùng có được chia sẻ cùng bài viết nhiều lần hay
không.

### 3. `post_saves` --- Lưu bài viết

  Thuộc tính     Kiểu PostgreSQL   Ý nghĩa
  -------------- ----------------- -------------------
  `user_id`      `UUID`            Người lưu
  `post_id`      `UUID`            Bài viết được lưu
  `created_at`   `TIMESTAMPTZ`     Thời điểm lưu

Khóa chính kép:

``` sql
PRIMARY KEY (user_id, post_id)
```

Bảng này giúp người dùng lưu bài viết để xem lại sau, tương tự chức năng
Saved trên Instagram.

### 4. `notifications` --- Thông báo

  -----------------------------------------------------------------------
  Thuộc tính              Kiểu PostgreSQL         Ý nghĩa
  ----------------------- ----------------------- -----------------------
  `id`                    `UUID`                  Khóa chính

  `recipient_id`          `UUID`                  Người nhận thông báo

  `actor_id`              `UUID`, nullable        Người tạo ra hành động

  `type`                  `VARCHAR(30)`           Loại thông báo

  `post_id`               `UUID`, nullable        Bài viết liên quan

  `comment_id`            `UUID`, nullable        Bình luận liên quan

  `friendship_id`         `UUID`, nullable        Lời mời/quan hệ bạn bè
                                                  liên quan

  `is_read`               `BOOLEAN`               Đã đọc hay chưa

  `created_at`            `TIMESTAMPTZ`           Thời điểm tạo
  -----------------------------------------------------------------------

Các loại thông báo gợi ý:

-   `POST_LIKED`: Có người thích bài viết.
-   `COMMENT_CREATED`: Có người bình luận.
-   `COMMENT_REPLIED`: Có người trả lời bình luận.
-   `FRIEND_REQUEST`: Có lời mời kết bạn.
-   `FRIEND_ACCEPTED`: Lời mời kết bạn được chấp nhận.

Thiết kế này đủ cho phiên bản đầu. Nếu cần hỗ trợ nhiều loại đối tượng
hơn, có thể thiết kế lại phần liên kết đối tượng thông báo. Không nên
vội sử dụng mô hình đa hình quá tổng quát khi chưa có nhu cầu thực tế.

------------------------------------------------------------------------

## V. Sơ đồ quan hệ tổng thể

Sơ đồ dưới đây mô tả các quan hệ logic chính, không phải cú pháp SQL:

``` text
USERS
  ├── 1 : 1 ─── USER_PROFILES
  ├── 1 : N ─── USER_SESSIONS
  ├── 1 : N ─── POSTS
  │                ├── 1 : N ─── POST_MEDIA
  │                ├── 1 : N ─── POST_LIKES ─── N : 1 ─── USERS
  │                └── 1 : N ─── COMMENTS
  │                                  ├── 1 : N ─── COMMENTS
  │                                  │              (trả lời bình luận)
  │                                  └── 1 : N ─── COMMENT_LIKES
  ├── N : N ─── FRIENDSHIPS ─── N : N ─── USERS
  └── 1 : N ─── NOTIFICATIONS
```

`friendships` là bảng trung gian có thêm trạng thái và thông tin người
gửi/nhận lời mời, không phải quan hệ nhiều-nhiều đơn giản. `feed` cũng
không nhất thiết cần bảng riêng; nó là module tổng hợp dữ liệu từ các
bảng hiện có.

------------------------------------------------------------------------

## VI. Thiết kế module backend

Nên sử dụng **Modular Monolith**: toàn bộ backend nằm trong một ứng
dụng, nhưng được chia thành các module nghiệp vụ tương đối độc lập. Mỗi
module sở hữu một nhóm nghiệp vụ và chịu trách nhiệm xử lý các quy tắc
liên quan.

### 1. Danh sách module

  -------------------------------------------------------------------------
                    STT Module            Trách nhiệm      Giai đoạn
  --------------------- ----------------- ---------------- ----------------
                      1 `auth`            Đăng ký, đăng    1
                                          nhập, đăng xuất, 
                                          refresh token    

                      2 `users`           Thông tin tài    1
                                          khoản, tìm kiếm  
                                          người dùng       

                      3 `profiles`        Xem và cập nhật  1
                                          hồ sơ cá nhân    

                      4 `friendships`     Gửi, nhận, chấp  1
                                          nhận, từ chối    
                                          lời mời kết bạn  

                      5 `posts`           Tạo, xem, sửa,   1
                                          xóa bài viết     

                      6 `comments`        Bình luận và trả 1
                                          lời bình luận    

                      7 `likes`           Thích/bỏ thích   1
                                          bài viết và bình 
                                          luận             

                      8 `feed`            Tạo bảng tin cho 1
                                          người dùng       

                      9 `media`           Tải lên và quản  1
                                          lý ảnh/video     

                     10 `notifications`   Quản lý thông    2
                                          báo              

                     11 `search`          Tìm kiếm người   2
                                          dùng và bài viết 

                     12 `bookmarks`       Lưu và bỏ lưu    2
                                          bài viết         

                     13 `shares`          Chia sẻ bài viết 2

                     14 `follows`         Theo dõi và bỏ   Tùy sản phẩm
                                          theo dõi         

                     15 `messaging`       Nhắn tin riêng   3

                     16 `groups`          Nhóm và bài viết 3
                                          trong nhóm       
  -------------------------------------------------------------------------

Phạm vi hiện tại tập trung vào người dùng, chưa triển khai module quản
trị viên. Tuy nhiên, vẫn nên có trạng thái tài khoản và cơ chế kiểm soát
quyền truy cập để bổ sung chức năng quản trị sau này.

### 2. Module `auth`

**Trách nhiệm:** xác thực danh tính người dùng.

Chức năng:

-   Đăng ký tài khoản.
-   Đăng nhập bằng email hoặc username.
-   Đăng xuất.
-   Làm mới access token.
-   Đổi mật khẩu.
-   Quên mật khẩu và đặt lại mật khẩu.
-   Xác thực email nếu ứng dụng yêu cầu.

API tham khảo:

``` http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Module này sử dụng `users` và có thể sử dụng `user_sessions`.

Phân biệt:

-   **Authentication:** xác định người dùng là ai.
-   **Authorization:** xác định người đó được phép thực hiện hành động
    nào.

Không cần đưa mọi quy tắc phân quyền vào `auth`. Các module như `posts`
và `comments` vẫn phải kiểm tra quyền nghiệp vụ của mình. Đăng nhập
thành công không có nghĩa người dùng được sửa bài viết của người khác.

### 3. Module `users` và `profiles`

Có thể tách hai module hoặc gộp thành `users` nếu ứng dụng còn nhỏ.

**`users`** chịu trách nhiệm về danh tính tài khoản:

-   Xem thông tin tài khoản được phép công khai.
-   Tìm kiếm người dùng.
-   Lấy danh sách người dùng.
-   Kiểm tra trạng thái tài khoản.

**`profiles`** chịu trách nhiệm về hồ sơ cá nhân:

-   Xem trang cá nhân.
-   Cập nhật tên hiển thị.
-   Cập nhật ảnh đại diện và ảnh bìa.
-   Cập nhật phần giới thiệu.
-   Điều chỉnh chế độ riêng tư.

Tách riêng hữu ích khi hai nhóm nghiệp vụ phát triển theo hướng khác
nhau; gộp lại giúp giảm số module trong dự án nhỏ.

### 4. Module `friendships`

Chức năng:

-   Gửi lời mời kết bạn.
-   Xem lời mời đã gửi.
-   Xem lời mời đang chờ.
-   Chấp nhận lời mời.
-   Từ chối lời mời.
-   Hủy lời mời.
-   Hủy kết bạn.
-   Xem danh sách bạn bè.

API tham khảo:

``` http
POST   /api/v1/friendships/requests
GET    /api/v1/friendships/requests/received
GET    /api/v1/friendships/requests/sent
PATCH  /api/v1/friendships/requests/:id/accept
PATCH  /api/v1/friendships/requests/:id/reject
DELETE /api/v1/friendships/requests/:id
GET    /api/v1/friendships
DELETE /api/v1/friendships/:userId
```

Có thể điều chỉnh cách đặt endpoint để thống nhất với quy ước API của dự
án. Module phải bảo đảm trạng thái quan hệ hợp lệ: không chấp nhận lời
mời đã bị hủy và không cho người thứ ba xử lý lời mời không thuộc về họ.

### 5. Module `posts`

Chức năng:

-   Tạo bài viết.
-   Xem chi tiết bài viết.
-   Sửa bài viết của mình.
-   Xóa bài viết của mình.
-   Lấy danh sách bài viết của một người dùng.
-   Kiểm soát quyền xem bài viết.
-   Quản lý trạng thái xuất bản.

API tham khảo:

``` http
POST   /api/v1/posts
GET    /api/v1/posts/:id
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
GET    /api/v1/users/:userId/posts
```

Module `posts` chịu trách nhiệm chính cho nghiệp vụ bài viết. Khi sửa
hoặc xóa, backend phải xác định người thực hiện có quyền thao tác hay
không. Không nên chỉ tin `userId` mà client gửi lên. Nếu A cố sửa bài
viết của B, backend phải từ chối trừ khi có quyền đặc biệt theo nghiệp
vụ.

### 6. Module `comments`

Chức năng:

-   Tạo bình luận.
-   Xem bình luận của bài viết.
-   Trả lời bình luận.
-   Sửa bình luận của mình.
-   Xóa bình luận của mình.

API tham khảo:

``` http
POST   /api/v1/posts/:postId/comments
GET    /api/v1/posts/:postId/comments
PATCH  /api/v1/comments/:id
DELETE /api/v1/comments/:id
```

Module cần kiểm tra:

-   Bài viết có tồn tại hay không.
-   Người dùng có quyền xem bài viết hay không.
-   Bình luận cha có thuộc bài viết đó hay không.
-   Người dùng có quyền sửa hoặc xóa bình luận hay không.

Cần thống nhất cách xử lý khi bài viết bị xóa nhưng bình luận vẫn tồn
tại. Xóa mềm có thể giúp bảo toàn tính nhất quán và cho phép ẩn nội dung
khỏi người dùng.

### 7. Module `likes`

Nếu chỉ có chức năng thích/bỏ thích, tên `likes` là đủ. Nếu dự định hỗ
trợ nhiều loại cảm xúc, có thể cân nhắc tên `reactions`.

Chức năng:

-   Thích bài viết.
-   Bỏ thích bài viết.
-   Xem danh sách người thích.
-   Thích bình luận.
-   Bỏ thích bình luận.

API tham khảo:

``` http
PUT    /api/v1/posts/:postId/like
DELETE /api/v1/posts/:postId/like

PUT    /api/v1/comments/:commentId/like
DELETE /api/v1/comments/:commentId/like
```

Dùng `PUT` cho thao tác thích giúp hành vi idempotent: gọi nhiều lần vẫn
đưa quan hệ về trạng thái đã thích, thay vì tạo nhiều lượt thích. Kết
hợp với ràng buộc duy nhất trong PostgreSQL để tránh dữ liệu trùng khi
có các request gần như đồng thời.

### 8. Module `feed`

Bảng tin là danh sách bài viết xuất hiện trên trang chủ.

API tham khảo:

``` http
GET /api/v1/feed?page=1&pageSize=20
```

Với phiên bản đầu, có thể:

1.  Lấy danh sách người dùng mà người hiện tại có quan hệ bạn bè hợp lệ.
2.  Lấy bài viết của chính người dùng và bạn bè.
3.  Chỉ lấy bài viết mà người dùng hiện tại có quyền xem.
4.  Sắp xếp theo thời gian đăng.
5.  Phân trang kết quả.

Chưa cần thuật toán đề xuất bài viết hoặc xếp hạng bằng AI. Bảng tin
theo thời gian là đủ để bắt đầu.

`feed` không nhất thiết phải có bảng dữ liệu riêng; đây là module đọc và
tổng hợp dữ liệu từ `posts`, `friendships` và `users`. Không được bỏ qua
quy tắc riêng tư của bài viết: là bạn bè không đồng nghĩa có thể xem bài
viết ở chế độ `PRIVATE`.

### 9. Module `media`

Chức năng:

-   Tải ảnh lên.
-   Tải video lên.
-   Kiểm tra loại tệp.
-   Kiểm tra kích thước tệp.
-   Xóa tệp không còn được sử dụng.
-   Tạo ảnh xem trước nếu cần.

Có thể sử dụng object storage để lưu tệp và PostgreSQL để lưu metadata.
Với ứng dụng nhỏ, có thể bắt đầu bằng dịch vụ lưu trữ đơn giản, nhưng
tránh phụ thuộc chặt vào một nhà cung cấp cụ thể.

Cần kiểm tra quyền truy cập tệp nếu có bài viết riêng tư. URL khó đoán
không tự động bảo đảm quyền riêng tư; cần chọn cơ chế truy cập phù hợp,
chẳng hạn URL ký có thời hạn hoặc kiểm tra quyền qua backend.

### 10. Module giai đoạn 2 và 3

**`notifications` --- Thông báo**

-   Thông báo khi có người thích bài viết.
-   Thông báo khi có bình luận hoặc trả lời.
-   Thông báo lời mời kết bạn.
-   Thông báo khi lời mời được chấp nhận.
-   Đánh dấu thông báo đã đọc.

**`search` --- Tìm kiếm**

-   Tìm kiếm người dùng.
-   Tìm kiếm bài viết.
-   Lọc kết quả theo tiêu chí phù hợp.

**`bookmarks` --- Lưu bài viết**

-   Lưu bài viết.
-   Bỏ lưu bài viết.
-   Xem danh sách bài viết đã lưu.

**`shares` --- Chia sẻ bài viết**

-   Chia sẻ bài viết.
-   Thêm nội dung kèm theo nếu có.
-   Xem thông tin chia sẻ.

**`follows` --- Theo dõi**

-   Theo dõi người dùng.
-   Bỏ theo dõi.
-   Xem người theo dõi và người đang theo dõi.

**`messaging` --- Nhắn tin**

-   Hội thoại riêng.
-   Tin nhắn văn bản.
-   Có thể mở rộng sang ảnh/video và trạng thái đã đọc.

**`groups` --- Nhóm**

-   Tạo nhóm.
-   Tham gia/rời nhóm.
-   Quản lý thành viên.
-   Đăng bài trong nhóm.

------------------------------------------------------------------------

## VII. Cấu trúc thư mục backend

Với TypeScript + Express + Prisma, có thể tổ chức theo module nghiệp vụ
như sau:

``` text
src/
├── app.ts
├── server.ts
│
├── config/
│   ├── env.ts
│   ├── prisma.ts
│   └── jwt.ts
│
├── shared/
│   ├── errors/
│   ├── middleware/
│   ├── utils/
│   └── types/
│
├── db/
|   └── prisma/
|
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.schema.ts
│   │
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── users.schema.ts
│   │
│   ├── profiles/
│   │   ├── profiles.routes.ts
│   │   ├── profiles.controller.ts
│   │   ├── profiles.service.ts
│   │   ├── profiles.repository.ts
│   │   └── profiles.schema.ts
│   │
│   ├── friendships/
│   │   ├── friendships.routes.ts
│   │   ├── friendships.controller.ts
│   │   ├── friendships.service.ts
│   │   ├── friendships.repository.ts
│   │   └── friendships.schema.ts
│   │
│   ├── posts/
│   │   ├── posts.routes.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.repository.ts
│   │   └── posts.schema.ts
│   │
│   ├── comments/
│   ├── likes/
│   ├── feed/
│   └── media/
│
└── generated/

```

Đây là cấu trúc minh họa. Có thể dùng chung schema validation với
package contract hoặc tách riêng request/response DTO. Không phải module
nào cũng bắt buộc có đủ năm loại file; module nhỏ có thể đơn giản hóa.
Quan trọng là ranh giới nghiệp vụ rõ ràng, tránh tạo lớp chỉ để có đủ
thư mục.

### Trách nhiệm của từng lớp

  Thành phần     Trách nhiệm
  -------------- ------------------------------------------------------
  `routes`       Khai báo endpoint và middleware
  `controller`   Nhận request, gọi service, trả response
  `service`      Xử lý nghiệp vụ và điều phối thao tác
  `repository`   Truy vấn, ghi và cập nhật dữ liệu
  `schema`       Kiểm tra cấu trúc và tính hợp lệ của dữ liệu đầu vào

Ví dụ trong chức năng gửi lời mời kết bạn:

-   `routes` khai báo endpoint gửi lời mời.
-   `controller` lấy danh tính người gửi và dữ liệu đầu vào.
-   `service` kiểm tra quy tắc nghiệp vụ.
-   `repository` truy vấn và ghi dữ liệu vào PostgreSQL.
-   `schema` kiểm tra kiểu và hình dạng request.

------------------------------------------------------------------------

## VIII. Các quy tắc thiết kế cơ sở dữ liệu

### 1. Sử dụng UUID cho khóa chính

Ví dụ:

``` text
users.id       UUID
posts.id       UUID
comments.id    UUID
```

PostgreSQL hỗ trợ UUID trực tiếp và Prisma cũng hỗ trợ kiểu này. UUID
không phải lúc nào cũng tốt hơn số nguyên, nhưng phù hợp với tài nguyên
được tạo từ nhiều module và thường được dùng trong API.

### 2. Thiết lập khóa ngoại

Ví dụ:

``` text
posts.user_id       → users.id
comments.post_id    → posts.id
comments.user_id    → users.id
post_media.post_id  → posts.id
```

Khóa ngoại giúp bảo đảm dữ liệu tham chiếu hợp lệ. Cần chọn hành vi khi
xóa phù hợp: `CASCADE`, `RESTRICT` hoặc `SET NULL`. Với bài viết và bình
luận, xóa mềm có thể phù hợp hơn xóa vật lý ngay lập tức.

### 3. Thiết lập chỉ mục

Các truy vấn thường gặp có thể cần index như:

``` text
posts(user_id, created_at)
comments(post_id, created_at)
post_likes(post_id)
friendships(requester_id, status)
friendships(addressee_id, status)
notifications(recipient_id, created_at)
```

Nếu khóa chính kép của `post_likes` là `(user_id, post_id)`, PostgreSQL
đã có chỉ mục theo thứ tự đó. Tuy nhiên, chỉ mục này không tối ưu tương
đương cho mọi truy vấn chỉ lọc theo `post_id`, nên có thể cần index bổ
sung. Hãy dựa vào truy vấn thực tế để quyết định.

### 4. Sử dụng phân trang

Với bài viết và bình luận, không nên trả về toàn bộ dữ liệu cùng lúc.

-   Có thể bắt đầu với `page` và `pageSize`.
-   Khi dữ liệu lớn hơn, cân nhắc cursor pagination dựa trên
    `created_at` và `id`.
-   Với bảng tin, cursor pagination thường phù hợp hơn vì bài viết mới
    có thể liên tục xuất hiện giữa các lần tải dữ liệu.

### 5. Không tin dữ liệu do client tự khai báo

Ví dụ, khi tạo bài viết, client có thể gửi:

``` json
{
  "content": "Hôm nay thật vui!",
  "visibility": "FRIENDS"
}
```

Backend lấy `user_id` từ danh tính đã được xác thực, không lấy `user_id`
tùy ý từ request để quyết định ai là người đăng.

Tương tự, khi thích bài viết hoặc gửi lời mời kết bạn, backend phải tự
xác định người thực hiện và kiểm tra quyền tương ứng.

### 6. Quyền riêng tư và phân quyền

-   Xác thực danh tính ở middleware phù hợp.
-   Kiểm tra quyền sở hữu khi sửa/xóa bài viết và bình luận.
-   Kiểm tra quyền xem bài viết trước khi trả dữ liệu.
-   Không để quan hệ bạn bè tự động vượt qua chế độ `PRIVATE`.
-   Không dựa hoàn toàn vào việc ẩn nút ở frontend; backend phải thực
    thi quy tắc.

### 7. Xóa mềm và tính nhất quán

Các trường `deleted_at` có thể hỗ trợ xóa mềm cho bài viết và bình luận.
Cần xác định rõ:

-   Bài viết bị xóa thì media liên quan được xử lý thế nào.
-   Bình luận bị xóa thì các trả lời con còn hiển thị không.
-   Tệp media không còn được tham chiếu khi nào sẽ được xóa.
-   Những bảng liên quan có cần lưu lịch sử hay không.

Không phải mọi bảng đều cần xóa mềm. Các bảng quan hệ như lượt thích
thường có thể xóa bản ghi khi người dùng bỏ thích.

------------------------------------------------------------------------

## IX. Thứ tự triển khai

### Mốc 1: Tài khoản và hồ sơ

**Bảng:** `users`, `user_profiles`, và `user_sessions` nếu triển khai
refresh token.\
**Module:** `auth`, `users`, `profiles`.

Kết quả: người dùng đăng ký, đăng nhập, cập nhật hồ sơ và đăng xuất
được.

### Mốc 2: Bài viết và media

**Bảng:** `posts`, `post_media`.\
**Module:** `posts`, `media`.

Kết quả: người dùng tạo, xem, sửa và xóa bài viết của mình được.

### Mốc 3: Tương tác

**Bảng:** `post_likes`, `comments`, và `comment_likes` nếu cần.\
**Module:** `likes`, `comments`.

Kết quả: người dùng thích bài viết, bình luận và trả lời bình luận được.

### Mốc 4: Quan hệ bạn bè

**Bảng:** `friendships`.\
**Module:** `friendships`.

Kết quả: người dùng kết bạn, chấp nhận lời mời và xem danh sách bạn bè
được.

### Mốc 5: Bảng tin

**Module:** `feed`.

Bảng tin sử dụng dữ liệu từ các module trước. Phải kiểm tra quyền xem
bài viết trước khi trả dữ liệu.

### Mốc 6: Hoàn thiện trải nghiệm

Sau khi chức năng cốt lõi ổn định, bổ sung:

-   `notifications`
-   `post_saves`
-   `post_shares`
-   `search`
-   `follows` nếu cần

Nhắn tin, story và nhóm có thể để ở giai đoạn sau.

------------------------------------------------------------------------

## X. Bộ bảng đề xuất cho phiên bản đầu

Nếu đây là dự án đầu tiên tự thiết kế ứng dụng mạng xã hội, có thể chọn
bộ bảng sau làm phiên bản đầu tiên:

  Nhóm           Bảng                             Có nên triển khai ngay?
  -------------- -------------------------------- ---------------------------
  Tài khoản      `users`                          Có
  Hồ sơ          `user_profiles`                  Có
  Xác thực       `user_sessions`                  Nếu dùng refresh token
  Quan hệ        `friendships`                    Có nếu chọn kiểu Facebook
  Bài viết       `posts`                          Có
  Media          `post_media`                     Có nếu hỗ trợ ảnh/video
  Tương tác      `post_likes`                     Có
  Tương tác      `comments`                       Có
  Tương tác      `comment_likes`                  Chưa bắt buộc
  Bảng tin       Không nhất thiết có bảng riêng   Có module
  Thông báo      `notifications`                  Giai đoạn 2
  Chia sẻ        `post_shares`                    Giai đoạn 2
  Lưu bài viết   `post_saves`                     Giai đoạn 2
  Theo dõi       `follows`                        Tùy sản phẩm

## Kết luận

Hai nguyên tắc quan trọng:

1.  **Thiết kế cơ sở dữ liệu theo nghiệp vụ, không phải theo số lượng
    màn hình.** Ví dụ, trang chủ và trang cá nhân đều có thể dùng dữ
    liệu từ `posts`, nhưng cách truy vấn và điều kiện hiển thị khác
    nhau.
2.  **Đừng biến Modular Monolith thành một hệ thống quá nhiều lớp.**
    Chia theo nghiệp vụ, giữ quy tắc nghiệp vụ trong service, giữ thao
    tác dữ liệu trong repository khi abstraction đó có ích, và tránh tạo
    module chỉ để cấu trúc thư mục trông đầy đủ.

Với quy mô nhỏ hoặc vừa, PostgreSQL và một backend Express hoặc Spring
Boot được tổ chức tốt là đủ để bắt đầu. Chưa cần microservices, Kafka
hay hệ thống cache phức tạp ngay từ đầu.

**Bước tiếp theo hợp lý:** chốt ERD và các ràng buộc dữ liệu trước, sau
đó mới viết Prisma schema và migration. Việc này giúp hiểu rõ quan hệ dữ
liệu và giảm khả năng phải sửa cấu trúc khi các module đã phụ thuộc vào
nhau.
