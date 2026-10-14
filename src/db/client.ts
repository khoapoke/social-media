/**
 * Khởi tạo và cấu hình Prisma Client để kết nối với PostgreSQL,
 * cung cấp một instance dùng chung cho các thành phần trong ứng dụng
 * khi thực hiện truy vấn và thao tác với cơ sở dữ liệu.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;